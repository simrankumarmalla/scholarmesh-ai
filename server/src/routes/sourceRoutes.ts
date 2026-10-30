import { Router, Response } from 'express';
import db from '../config/db.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware.js';
import { ingestSourceSchema } from '../validators/schemas.js';
import { extractTextFromBuffer } from '../services/pdfParserService.js';
import { analyzeSourceDocument } from '../services/geminiService.js';

const router = Router({ mergeParams: true });
router.use(authenticateToken);

// Sample studies library for 1-click testing across diverse domains
const PRESET_SAMPLE_STUDIES: Record<string, Array<{
  title: string;
  authors: string;
  publication_year: number;
  source_type: string;
  content: string;
}>> = {
  biomedical_clinical: [
    {
      title: 'Targeted Ionizable Liposomes for Glioblastoma mRNA Delivery Across the Blood-Brain Barrier',
      authors: 'Ahmadi, K., Larsson, M., & Zhao, S.',
      publication_year: 2024,
      source_type: 'peer_reviewed_paper',
      content: `ABSTRACT: Glioblastoma multiforme (GBM) remains largely untreatable due to limited therapeutic penetrance past the blood-brain barrier (BBB). In this study, we engineered Angiopep-2 functionalized ionizable lipid nanoparticles (LNP-Ang2) delivering Cas9 mRNA and gRNA targeting EGFRvIII. In orthotopic human U87-MG murine xenografts (n=45), systemic IV administration of LNP-Ang2 at 0.75 mg/kg produced 72.4% intracranial delivery with an 8.6-fold higher accumulation in tumor margins compared to non-targeted controls. Median survival was extended from 22 days to 54 days (p<0.0001). Astrocytic GFAP and microglial Iba-1 immunofluorescence confirmed zero induced neuroinflammation or behavioral deficits. We conclude that low-molecular peptide ligand conjugation enables safe transcytosis without destabilizing LNP encapsulation stability.`
    },
    {
      title: 'Neurotoxicity and Glial Activation Induced by High-Concentration Synthetic Nanocarriers in CNS Tissues',
      authors: 'Petrov, N., O’Donnell, C., & Fischer, B.',
      publication_year: 2023,
      source_type: 'peer_reviewed_paper',
      content: `ABSTRACT: The clinical translation of nanoparticle formulations targeting central nervous system pathologies requires rigorous assessment of glial toxicity. We evaluated synthetic cationic and ionizable lipid delivery systems in primary human cortical neuronal-glial co-cultures and rodent models. Doses above 0.4 mg/kg elicited pronounced reactive astrogliosis, calcium influx dysregulation, and a 3.2-fold spike in cleaved caspase-3 within hippocampal slices within 24 hours. The safe concentration window for intracranial delivery is exceedingly narrow (<0.2 mg/kg). Unmodified cationic headgroups directly disrupt neuronal axonal membrane potentials, demonstrating that transcytosis-enhancing ligands do not prevent localized membrane disruption.`
    }
  ],
  ai_computer_science: [
    {
      title: 'Sparse Mixture of Experts vs. Dense Transformers: Inference Latency and Hallucination Scaling',
      authors: 'Vasudevan, A., Mercier, J., & Zhang, L.',
      publication_year: 2024,
      source_type: 'technical_report',
      content: `ABSTRACT: As frontier foundation models scale beyond 100B parameters, Sparse Mixture of Experts (MoE) architectures have emerged as an alternative to dense transformers to reduce floating-point operations (FLOPs) during inference. We benchmarked 8x7B MoE models against comparable 70B dense baselines across 40,000 reasoning prompts. While MoE models reduced time-to-first-token (TTFT) latency by 41.2% and lowered serving energy consumption by 34%, empirical hallucination rates on complex multi-hop biomedical logic increased from 8.4% to 14.7% (p<0.001). Router expert routing instability under out-of-distribution prompts was identified as the primary failure mode. We propose speculative router dampening to maintain latency advantages while matching dense factual precision.`
    },
    {
      title: 'Empirical Verification of Expert Routing Stability in Calibrated Sparse Architectures',
      authors: 'Keller, T., & Thorne, D.',
      publication_year: 2024,
      source_type: 'peer_reviewed_paper',
      content: `ABSTRACT: Discrepancies regarding factual hallucination in Mixture of Experts (MoE) models have been attributed to routing entropy collapse. In this work, we demonstrate that with temperature-annealed top-k routing and balanced auxiliary loss weighting, 8x14B sparse architectures match dense 70B models in factual accuracy (92.1% vs 91.8%) across TruthfulQA and GSM8K, while sustaining a 2.8x throughput advantage on H100 GPU clusters. We disprove claims that sparsity inherently degrades symbolic reliability.`
    }
  ]
};

// GET /api/workspaces/:workspaceId/sources (List all sources)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.workspaceId;

    // Verify workspace ownership
    const ws = await db.query('SELECT id FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
    if (ws.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Workspace not found.' });
    }

    const sourcesRes = await db.query(
      'SELECT * FROM sources WHERE workspace_id = $1 AND user_id = $2 ORDER BY created_at DESC',
      [workspaceId, userId]
    );

    // Attach claims to each source
    const sourcesWithClaims = await Promise.all(
      sourcesRes.rows.map(async (source) => {
        const claimsRes = await db.query(
          'SELECT * FROM extracted_claims WHERE source_id = $1 ORDER BY created_at ASC',
          [source.id]
        );
        return {
          ...source,
          extracted_claims: claimsRes.rows
        };
      })
    );

    return res.json({ sources: sourcesWithClaims });
  } catch (err: any) {
    console.error('List sources error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve workspace sources.' });
  }
});

// POST /api/workspaces/:workspaceId/sources (Ingest file or text + AI Analysis)
router.post('/', upload.single('document'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.workspaceId;

    // Verify workspace ownership & get research question
    const wsRes = await db.query('SELECT * FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
    if (wsRes.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Workspace not found or unauthorized.' });
    }
    const workspace = wsRes.rows[0];

    let extractedText = '';
    let originalFilename: string | null = null;
    let title = req.body.title;
    let authors = req.body.authors || 'Unknown Authors';
    let publicationYear = Number(req.body.publication_year) || new Date().getFullYear();
    let sourceType = req.body.source_type || 'peer_reviewed_paper';

    if (req.file) {
      originalFilename = req.file.originalname;
      if (!title || title.trim() === '') {
        // Derive clean title from filename
        title = originalFilename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      }
      extractedText = await extractTextFromBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
    } else if (req.body.raw_content && req.body.raw_content.trim().length > 0) {
      extractedText = req.body.raw_content.trim();
    } else {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please either upload a valid research document (.pdf, .txt, .md) or provide study text / abstract in raw_content.'
      });
    }

    if (extractedText.length < 30) {
      return res.status(400).json({
        error: 'Insufficient Content',
        message: 'The ingested document contains too little readable text to extract reliable scientific claims (minimum 30 characters required).'
      });
    }

    const wordCount = extractedText.split(/\s+/).length;

    // Run Gemini Analysis
    const aiAnalysis = await analyzeSourceDocument(
      workspace.research_question,
      title,
      authors,
      sourceType,
      extractedText
    );

    // Insert source into database
    const insertSourceRes = await db.query(
      `INSERT INTO sources (
        workspace_id, user_id, title, authors, publication_year, source_type,
        original_filename, raw_content, word_count, ai_summary, methodology_notes,
        rigor_score, rigor_justification, key_topics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        workspaceId,
        userId,
        title,
        authors,
        publicationYear,
        sourceType,
        originalFilename,
        extractedText,
        wordCount,
        aiAnalysis.ai_summary,
        aiAnalysis.methodology_notes,
        aiAnalysis.rigor_score,
        aiAnalysis.rigor_justification,
        JSON.stringify(aiAnalysis.key_topics || [])
      ]
    );

    const source = insertSourceRes.rows[0];

    // Bulk insert extracted atomic claims
    const savedClaims: any[] = [];
    if (aiAnalysis.extracted_claims && Array.isArray(aiAnalysis.extracted_claims)) {
      for (const claim of aiAnalysis.extracted_claims) {
        const claimRes = await db.query(
          `INSERT INTO extracted_claims (
            source_id, workspace_id, user_id, claim_text, claim_category, supporting_quote, confidence_level
          ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            source.id,
            workspaceId,
            userId,
            claim.claim_text,
            claim.claim_category,
            claim.supporting_quote || null,
            claim.confidence_level || 'high'
          ]
        );
        savedClaims.push(claimRes.rows[0]);
      }
    }

    return res.status(201).json({
      source: {
        ...source,
        extracted_claims: savedClaims
      }
    });
  } catch (err: any) {
    console.error('Source ingestion error:', err);
    return res.status(500).json({ error: 'Server Error', message: err.message || 'Failed to ingest and analyze research document.' });
  }
});

// POST /api/workspaces/:workspaceId/sources/sample (Load sample studies)
router.post('/sample', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.workspaceId;

    const wsRes = await db.query('SELECT * FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
    if (wsRes.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Workspace not found.' });
    }
    const workspace = wsRes.rows[0];

    // Choose sample studies based on workspace domain
    const pool = PRESET_SAMPLE_STUDIES[workspace.domain] || PRESET_SAMPLE_STUDIES.biomedical_clinical;
    // Pick an un-ingested study or randomly
    const sample = pool[Math.floor(Math.random() * pool.length)];

    const wordCount = sample.content.split(/\s+/).length;
    const aiAnalysis = await analyzeSourceDocument(
      workspace.research_question,
      sample.title,
      sample.authors,
      sample.source_type,
      sample.content
    );

    const insertSourceRes = await db.query(
      `INSERT INTO sources (
        workspace_id, user_id, title, authors, publication_year, source_type,
        original_filename, raw_content, word_count, ai_summary, methodology_notes,
        rigor_score, rigor_justification, key_topics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        workspaceId,
        userId,
        sample.title,
        sample.authors,
        sample.publication_year,
        sample.source_type,
        'curated_sample_study.pdf',
        sample.content,
        wordCount,
        aiAnalysis.ai_summary,
        aiAnalysis.methodology_notes,
        aiAnalysis.rigor_score,
        aiAnalysis.rigor_justification,
        JSON.stringify(aiAnalysis.key_topics || [])
      ]
    );

    const source = insertSourceRes.rows[0];
    const savedClaims: any[] = [];

    if (aiAnalysis.extracted_claims && Array.isArray(aiAnalysis.extracted_claims)) {
      for (const claim of aiAnalysis.extracted_claims) {
        const claimRes = await db.query(
          `INSERT INTO extracted_claims (
            source_id, workspace_id, user_id, claim_text, claim_category, supporting_quote, confidence_level
          ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            source.id,
            workspaceId,
            userId,
            claim.claim_text,
            claim.claim_category,
            claim.supporting_quote || null,
            claim.confidence_level || 'high'
          ]
        );
        savedClaims.push(claimRes.rows[0]);
      }
    }

    return res.status(201).json({
      source: {
        ...source,
        extracted_claims: savedClaims
      }
    });
  } catch (err: any) {
    console.error('Load sample study error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to load sample study.' });
  }
});

// DELETE /api/workspaces/:workspaceId/sources/:sourceId (Delete a source)
router.delete('/:sourceId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId, sourceId } = req.params;

    const check = await db.query('SELECT id FROM sources WHERE id = $1 AND workspace_id = $2 AND user_id = $3', [sourceId, workspaceId, userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Source not found or unauthorized.' });
    }

    await db.query('DELETE FROM sources WHERE id = $1 AND workspace_id = $2 AND user_id = $3', [sourceId, workspaceId, userId]);

    return res.json({ success: true, message: 'Source and extracted claims successfully deleted.' });
  } catch (err: any) {
    console.error('Delete source error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to delete source.' });
  }
});

export default router;
