import { Router, Response } from 'express';
import db from '../config/db.js';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware.js';
import { synthesizeRequestSchema } from '../validators/schemas.js';
import { generateCrossSourceSynthesis } from '../services/geminiService.js';

const router = Router({ mergeParams: true });
router.use(authenticateToken);

// POST /api/workspaces/:workspaceId/synthesize (Generate Cross-Source AI Synthesis)
router.post('/workspaces/:workspaceId/synthesize', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.workspaceId;

    const parseResult = synthesizeRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.issues.map((e: any) => e.message)
      });
    }

    const { source_ids, synthesis_mode, title } = parseResult.data;

    // Verify workspace ownership
    const wsRes = await db.query('SELECT * FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
    if (wsRes.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Workspace not found.' });
    }
    const workspace = wsRes.rows[0];

    // Fetch the selected sources and verify they belong to this workspace
    const sourcesRes = await db.query(
      'SELECT * FROM sources WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, userId]
    );

    const selectedSources = sourcesRes.rows.filter(s => source_ids.includes(s.id));
    if (selectedSources.length < 2) {
      return res.status(400).json({
        error: 'Insufficient Sources',
        message: 'Cross-Source synthesis requires selecting at least 2 valid sources belonging to this workspace.'
      });
    }

    // Attach claims to each source
    const sourcesWithClaims = await Promise.all(
      selectedSources.map(async (s) => {
        const claimsRes = await db.query('SELECT * FROM extracted_claims WHERE source_id = $1', [s.id]);
        return {
          id: s.id,
          title: s.title,
          authors: s.authors,
          rigor_score: s.rigor_score,
          ai_summary: s.ai_summary || '',
          claims: claimsRes.rows.map(c => ({
            claim_text: c.claim_text,
            claim_category: c.claim_category,
            supporting_quote: c.supporting_quote
          }))
        };
      })
    );

    // Run Gemini Synthesis
    const synthesisData = await generateCrossSourceSynthesis(
      workspace.research_question,
      workspace.working_hypothesis,
      synthesis_mode,
      sourcesWithClaims
    );

    const reportTitle = title || `${synthesis_mode.replace(/_/g, ' ').toUpperCase()} (${selectedSources.length} Sources)`;

    // Save report to database
    const insertRes = await db.query(
      `INSERT INTO synthesis_reports (
        workspace_id, user_id, title, synthesis_mode, source_ids,
        executive_summary, consensus_themes, contradictions, research_gaps,
        decision_recommendations, overall_evidence_strength
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        workspaceId,
        userId,
        reportTitle,
        synthesis_mode,
        JSON.stringify(source_ids),
        synthesisData.executive_summary,
        JSON.stringify(synthesisData.consensus_themes || []),
        JSON.stringify(synthesisData.contradictions || []),
        JSON.stringify(synthesisData.research_gaps || []),
        JSON.stringify(synthesisData.decision_recommendations || []),
        synthesisData.overall_evidence_strength || 'Moderate Evidence'
      ]
    );

    const savedReport = insertRes.rows[0];

    return res.status(201).json({
      report: savedReport
    });
  } catch (err: any) {
    console.error('Cross-source synthesis error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to generate cross-source synthesis.' });
  }
});

// GET /api/workspaces/:workspaceId/syntheses (List syntheses for a workspace)
router.get('/workspaces/:workspaceId/syntheses', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.workspaceId;

    const ws = await db.query('SELECT id FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
    if (ws.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Workspace not found.' });
    }

    const reportsRes = await db.query(
      'SELECT * FROM synthesis_reports WHERE workspace_id = $1 AND user_id = $2 ORDER BY created_at DESC',
      [workspaceId, userId]
    );

    return res.json({ reports: reportsRes.rows });
  } catch (err: any) {
    console.error('List workspace syntheses error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch synthesis reports.' });
  }
});

// GET /api/syntheses (List all synthesis reports across all user workspaces)
router.get('/syntheses', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const reportsRes = await db.query(
      `SELECT sr.*, w.title AS workspace_title, w.domain AS workspace_domain
       FROM synthesis_reports sr
       JOIN workspaces w ON w.id = sr.workspace_id
       WHERE sr.user_id = $1
       ORDER BY sr.created_at DESC`,
      [userId]
    );

    return res.json({ reports: reportsRes.rows });
  } catch (err: any) {
    console.error('List all syntheses error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch user synthesis library.' });
  }
});

export default router;
