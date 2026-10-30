import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';

export async function seedDemoData() {
  try {
    // Check if demo user already exists
    const existing = await db.query('SELECT * FROM users WHERE email = $1', ['demo@scholarmesh.ai']);
    if (existing.rows.length > 0) {
      console.log('✓ Demo researcher account already initialized');
      return;
    }

    console.log('🌱 Seeding demo researcher account and pre-populated research workspace...');
    const passwordHash = await bcrypt.hash('DemoPass123!', 10);

    // 1. Insert Demo User
    const userResult = await db.query(
      `INSERT INTO users (full_name, email, password_hash, institution, research_role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        'Dr. Elena Rostova',
        'demo@scholarmesh.ai',
        passwordHash,
        'Broad Institute of MIT & Harvard',
        'Lead Investigator, Genomic Delivery Systems'
      ]
    );

    const user = userResult.rows[0];
    const userId = user.id;

    // 2. Insert Research Workspace
    const workspaceResult = await db.query(
      `INSERT INTO workspaces (user_id, title, domain, research_question, working_hypothesis, default_synthesis_mode)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        userId,
        'mRNA Delivery Lipid Nanoparticles: Efficacy vs. Hepatic Toxicity',
        'biomedical_clinical',
        'What ionizable lipid chemical structures maximize mRNA transfection efficiency while minimizing dose-dependent hepatic necrosis and Kupffer cell activation?',
        'Incorporation of biodegradable ester linkages into the hydrophobic alkyl tails of ionizable lipids accelerates hepatic clearance kinetics, reducing ALT/AST elevation by >60% without compromising delivery potency.',
        'contradiction_audit'
      ]
    );

    const workspace = workspaceResult.rows[0];
    const workspaceId = workspace.id;

    // 3. Insert Study 1
    const study1Result = await db.query(
      `INSERT INTO sources (
        workspace_id, user_id, title, authors, publication_year, source_type,
        original_filename, raw_content, word_count, ai_summary, methodology_notes,
        rigor_score, rigor_justification, key_topics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        workspaceId,
        userId,
        'High-Efficiency Ionizable LNP Formulations in Murine Hepatic Models',
        'Chen, W., Kowalski, T., & Henderson, R.',
        2024,
        'peer_reviewed_paper',
        'chen_et_al_2024_murine_lnp.pdf',
        `ABSTRACT: Synthetic ionizable lipid nanoparticles (LNPs) remain the gold standard for clinical mRNA delivery. In this investigation, we systematically tested a combinatorial library of amino-lipid heads conjugated to branched saturated alkyl tails (designated Series-LN7) in C57BL/6 murine models (n=120). Intravenous administration of LN7-encapsulated luciferase and erythropoietin (EPO) mRNA at 0.5 mg/kg achieved 94.2% splenic and hepatic transfection efficiency, exceeding benchmark DLin-MC3-DMA by 3.8-fold. Serum biomarker analysis 24 hours post-infusion showed modest, transient alanine aminotransferase (ALT) elevations (mean 78 U/L vs 32 U/L vehicle baseline), which fully resolved to normal physiological baseline within 48 hours. Histopathological examination revealed no signs of sinusoidal microthrombi or hepatocellular apoptosis. We conclude that saturated lipid alkyl tail architectures exhibit exceptional therapeutic index and minimal hepatotoxic liabilities in rodent cohorts at standard preclinical dosing regimens.`,
        145,
        'Chen et al. demonstrate that Series-LN7 amino-lipids achieve 94.2% mRNA transfection efficiency in murine models at 0.5 mg/kg, outperforming benchmark MC3 LNPs by nearly four-fold. The study concludes that hepatic enzyme elevations are mild (mean ALT 78 U/L) and completely resolve within 48 hours without tissue damage, supporting high clinical translation potential.',
        'Well-powered randomized cohort study using 120 C57BL/6 mice. Utilized bioluminescent imaging, LC-MS/MS biodistribution quantitation, and serum biochemistry (ALT/AST/bilirubin). Limitation: purely rodent-based, lacking higher mammalian immune reactivity.',
        88,
        'High statistical rigor (p<0.001 across n=120 cohort) and precise kinetic biodistribution tracking, although translation to primates is speculative.',
        JSON.stringify(['Ionizable Lipids', 'mRNA Delivery', 'Transfection Efficacy', 'Murine Hepatology', 'ALT Elevation'])
      ]
    );

    const s1Id = study1Result.rows[0].id;

    // Claims for Study 1
    const study1Claims = [
      {
        text: 'Series-LN7 achieved 94.2% transfection efficiency in murine splenic and hepatic tissues at 0.5 mg/kg, exceeding MC3 benchmark by 3.8-fold.',
        category: 'empirical_finding',
        quote: 'Intravenous administration at 0.5 mg/kg achieved 94.2% splenic and hepatic transfection efficiency, exceeding benchmark DLin-MC3-DMA by 3.8-fold.',
        confidence: 'high'
      },
      {
        text: 'Serum ALT elevations in mice peaked at 78 U/L and completely returned to baseline (32 U/L) within 48 hours.',
        category: 'statistic',
        quote: 'modest, transient alanine aminotransferase (ALT) elevations (mean 78 U/L vs 32 U/L vehicle baseline), which fully resolved to normal physiological baseline within 48 hours.',
        confidence: 'high'
      },
      {
        text: 'No evidence of microthrombosis, hepatocyte necrosis, or apoptosis was observed on histological liver sections.',
        category: 'empirical_finding',
        quote: 'Histopathological examination revealed no signs of sinusoidal microthrombi or hepatocellular apoptosis.',
        confidence: 'high'
      },
      {
        text: 'Study relies exclusively on inbred C57BL/6 murine models, limiting direct translatability to species with robust innate immune activation.',
        category: 'limitation',
        quote: 'tested a combinatorial library... in C57BL/6 murine models (n=120).',
        confidence: 'high'
      }
    ];

    for (const c of study1Claims) {
      await db.query(
        `INSERT INTO extracted_claims (source_id, workspace_id, user_id, claim_text, claim_category, supporting_quote, confidence_level)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [s1Id, workspaceId, userId, c.text, c.category, c.quote, c.confidence]
      );
    }

    // 4. Insert Study 2 (Direct Contradiction)
    const study2Result = await db.query(
      `INSERT INTO sources (
        workspace_id, user_id, title, authors, publication_year, source_type,
        original_filename, raw_content, word_count, ai_summary, methodology_notes,
        rigor_score, rigor_justification, key_topics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        workspaceId,
        userId,
        'Acute Hepatotoxicity and Kupffer Cell Inflammation in Non-Human Primates Following High-Dose LNP Regimens',
        "Vanderbilt, E., Sterling, K., Zhao, Y., & O'Connor, P.",
        2023,
        'peer_reviewed_paper',
        'vanderbilt_2023_nhp_hepatotoxicity.pdf',
        `ABSTRACT: While rodent models frequently indicate benign hepatic tolerability profiles for ionizable lipid nanoparticles, non-human primate (NHP) clinical translation frequently encounters unexpected systemic toxicity. We evaluated the safety profile of saturated ionizable LNPs in Cynomolgus macaques (Macaca fascicularis, n=18). Animals receiving intravenous doses at or exceeding 0.3 mg/kg exhibited rapid, severe hepatobiliary injury within 12 hours of administration. Serum ALT and AST escalated 4.8-fold and 6.2-fold above baseline respectively (peak ALT 340 U/L), persisting for over 7 days post-treatment. Multiplex immunohistochemistry revealed massive Kupffer cell pyroptosis and high release of inflammatory cytokines TNF-alpha and IL-1beta, accompanied by focal centrilobular hepatocyte necrosis. We demonstrate that murine models dramatically underestimate macrophage-mediated phagocytic clearance and immune recognition of LNPs, establishing that the safe maximum tolerated therapeutic threshold in primates cannot exceed 0.15 mg/kg for conventional non-cleavable ionizable lipids.`,
        160,
        'Vanderbilt et al. directly challenge rodent safety findings by demonstrating that non-human primates suffer acute hepatocellular necrosis and 4.8x ALT spikes (up to 340 U/L) at doses as low as 0.3 mg/kg. The study establishes that Kupffer cell pyroptosis and intense cytokine storm (TNF-a, IL-1b) persist beyond 7 days, capping the safe therapeutic threshold in primates at <=0.15 mg/kg.',
        'Controlled dose-escalation trial in 18 Cynomolgus macaques across 3 dosage tiers (0.1, 0.3, 0.6 mg/kg). Comprehensive liver biopsies, electron microscopy, and serum cytokine bead arrays. High clinical relevance.',
        92,
        'Exceptional primate model translation, multi-modal tissue pathology, cytokine profiling, and rigorous blinded pathological evaluation.',
        JSON.stringify(['Non-Human Primates', 'Hepatotoxicity', 'Kupffer Cells', 'Cytokine Storm', 'Dose-Limiting Toxicity'])
      ]
    );

    const s2Id = study2Result.rows[0].id;

    const study2Claims = [
      {
        text: 'Intravenous LNP administration at >=0.3 mg/kg in non-human primates triggers severe hepatobiliary injury with ALT spiking 4.8-fold (peak 340 U/L).',
        category: 'empirical_finding',
        quote: 'Animals receiving intravenous doses at or exceeding 0.3 mg/kg exhibited rapid, severe hepatobiliary injury... Serum ALT and AST escalated 4.8-fold and 6.2-fold (peak ALT 340 U/L).',
        confidence: 'high'
      },
      {
        text: 'Hepatic injury in primates persisted for more than 7 days, directly contradicting rodent findings of 48-hour recovery.',
        category: 'contradiction',
        quote: 'persisting for over 7 days post-treatment.',
        confidence: 'high'
      },
      {
        text: 'The maximum tolerated dose (MTD) in primates is established at 0.15 mg/kg, far below the 0.5 mg/kg tested safely in rodents.',
        category: 'statistic',
        quote: 'the safe maximum tolerated therapeutic threshold in primates cannot exceed 0.15 mg/kg for conventional non-cleavable ionizable lipids.',
        confidence: 'high'
      },
      {
        text: 'Macrophage phagocytosis and Kupffer cell pyroptosis are the primary mechanistic drivers of acute hepatic necrosis in primates.',
        category: 'methodology',
        quote: 'Multiplex immunohistochemistry revealed massive Kupffer cell pyroptosis and high release of inflammatory cytokines TNF-alpha and IL-1beta.',
        confidence: 'high'
      }
    ];

    for (const c of study2Claims) {
      await db.query(
        `INSERT INTO extracted_claims (source_id, workspace_id, user_id, claim_text, claim_category, supporting_quote, confidence_level)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [s2Id, workspaceId, userId, c.text, c.category === 'contradiction' ? 'empirical_finding' : c.category, c.quote, c.confidence]
      );
    }

    // 5. Insert Study 3 (Reconciling Mechanism)
    const study3Result = await db.query(
      `INSERT INTO sources (
        workspace_id, user_id, title, authors, publication_year, source_type,
        original_filename, raw_content, word_count, ai_summary, methodology_notes,
        rigor_score, rigor_justification, key_topics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        workspaceId,
        userId,
        'Biodegradable Ester-Linked LNP Cleavage Kinetics and Safety Margin Resolution',
        'Morrison, S. & Al-Mansoor, H.',
        2024,
        'peer_reviewed_paper',
        'morrison_2024_biodegradable_esters.pdf',
        `ABSTRACT: The fundamental trade-off between mRNA translational potency and hepatic organ toxicity stems from intracellular accumulation of non-metabolizable ionizable lipids in reticuloendothelial macrophages. To bridge the conflicting tolerability observed between rodents and primates, we engineered a second-generation library of ionizable lipids incorporating internal carboxylesterase-sensitive ester bonds within the secondary alkyl chains (designated BioLipid-E4). In vitro human liver microsome incubations revealed an enzymatic degradation half-life (t1/2) of 4.2 hours, compared to 38.6 hours for non-cleavable MC3 lipids. When administered to canines and non-human primates at 0.5 mg/kg, BioLipid-E4 achieved 91.4% mRNA transfection efficiency while suppressing ALT spikes to under 1.4-fold baseline. Cytokine profiling confirmed complete absence of Kupffer cell pyroptosis and undetectable serum TNF-alpha. Pharmacokinetic analysis proves that accelerating metabolic elimination rates decouples therapeutic cargo delivery from organ toxicity, providing an 8-fold wider therapeutic window.`,
        155,
        'Morrison and Al-Mansoor resolve the divergence between rodent and primate toxicity by engineering BioLipid-E4 with enzymatically cleavable internal ester bonds. BioLipid-E4 degrades 9x faster in human liver microsomes (t1/2 = 4.2h vs 38.6h), allowing high transfection (91.4%) at 0.5 mg/kg in primates while preventing Kupffer cell activation and keeping ALT elevation below 1.4x baseline.',
        'Cross-species pharmacology (human microsomes, canines, and non-human primates). High-resolution LC-MS/MS metabolic profiling and cytokine panels.',
        89,
        'Elegant synthetic chemistry combined with cross-species pharmacokinetic validation and rigorous mechanistic proof of clearance kinetics.',
        JSON.stringify(['Biodegradable Lipids', 'Ester Cleavage', 'Pharmacokinetics', 'Enzymatic Hydrolysis', 'Therapeutic Window'])
      ]
    );

    const s3Id = study3Result.rows[0].id;

    const study3Claims = [
      {
        text: 'Carboxylesterase-sensitive ester bonds reduce lipid clearance half-life in human liver microsomes from 38.6 hours to 4.2 hours.',
        category: 'statistic',
        quote: 'human liver microsome incubations revealed an enzymatic degradation half-life (t1/2) of 4.2 hours, compared to 38.6 hours for non-cleavable MC3 lipids.',
        confidence: 'high'
      },
      {
        text: 'BioLipid-E4 maintained 91.4% mRNA transfection in primates at 0.5 mg/kg while keeping ALT elevation under 1.4-fold baseline.',
        category: 'empirical_finding',
        quote: 'When administered to canines and non-human primates at 0.5 mg/kg, BioLipid-E4 achieved 91.4% mRNA transfection efficiency while suppressing ALT spikes to under 1.4-fold baseline.',
        confidence: 'high'
      },
      {
        text: 'Accelerating intracellular metabolic elimination decouples mRNA translation from macrophage-driven Kupffer cell inflammation.',
        category: 'hypothesis',
        quote: 'Pharmacokinetic analysis proves that accelerating metabolic elimination rates decouples therapeutic cargo delivery from organ toxicity.',
        confidence: 'high'
      },
      {
        text: 'Long-term repeat-dosing cumulative accumulation over >6 months remains uncharacterized in this acute study.',
        category: 'limitation',
        quote: 'When administered to canines and non-human primates... evaluating enzymatic degradation half-life.',
        confidence: 'medium'
      }
    ];

    for (const c of study3Claims) {
      await db.query(
        `INSERT INTO extracted_claims (source_id, workspace_id, user_id, claim_text, claim_category, supporting_quote, confidence_level)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [s3Id, workspaceId, userId, c.text, c.category, c.quote, c.confidence]
      );
    }

    // 6. Insert Pre-Generated Cross-Source Synthesis Report
    await db.query(
      `INSERT INTO synthesis_reports (
        workspace_id, user_id, title, synthesis_mode, source_ids,
        executive_summary, consensus_themes, contradictions, research_gaps,
        decision_recommendations, overall_evidence_strength
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        workspaceId,
        userId,
        'Cross-Study Synthesis: LNP Safety Thresholds & Transfection Trade-offs in Hepatic Delivery',
        'contradiction_audit',
        JSON.stringify([s1Id, s2Id, s3Id]),
        `Cross-examination of the 3 ingested research studies reveals an acute inter-species translational disparity regarding the hepatic safety margin of ionizable lipid nanoparticles. While rodent investigations (Chen et al., 2024) report benign hepatotoxicity up to 0.5 mg/kg with rapid 48-hour enzyme normalization, non-human primate trials (Vanderbilt et al., 2023) identify catastrophic Kupffer cell pyroptosis, severe ALT elevation (340 U/L), and hepatocellular necrosis at doses >=0.3 mg/kg. This critical discrepancy is resolved by Morrison & Al-Mansoor (2024), who demonstrate that non-cleavable alkyl lipids persist in primate reticuloendothelial macrophages for >38 hours, whereas incorporating biodegradable ester bonds accelerates clearance kinetics (t1/2 = 4.2h), successfully preserving 91.4% delivery efficiency while dampening liver enzyme spikes to safe clinical thresholds.`,
        JSON.stringify([
          {
            theme_title: 'High Transfection Efficacy Across Delivery Platforms',
            synthesis_statement: 'All three investigations confirm that modern ionizable lipid chemistries achieve robust hepatic mRNA transfection (>90%) at 0.5 mg/kg or lower.',
            supporting_source_titles: [
              'High-Efficiency Ionizable LNP Formulations in Murine Hepatic Models',
              'Biodegradable Ester-Linked LNP Cleavage Kinetics and Safety Margin Resolution'
            ]
          },
          {
            theme_title: 'Macrophage Accumulation as the Root Cause of Hepatotoxicity',
            synthesis_statement: 'Both primate and pharmacokinetic studies identify reticuloendothelial macrophage/Kupffer cell cargo retention—rather than hepatocyte entry itself—as the trigger for severe systemic inflammation and liver injury.',
            supporting_source_titles: [
              'Acute Hepatotoxicity and Kupffer Cell Inflammation in Non-Human Primates Following High-Dose LNP Regimens',
              'Biodegradable Ester-Linked LNP Cleavage Kinetics and Safety Margin Resolution'
            ]
          }
        ]),
        JSON.stringify([
          {
            topic: 'Maximum Tolerated Dose (MTD) and Liver Enzyme Kinetics',
            conflicting_positions: 'Chen et al. report 0.5 mg/kg is well-tolerated in mice with complete ALT resolution in 48h (peak 78 U/L), whereas Vanderbilt et al. demonstrate that in primates, 0.3 mg/kg produces persistent ALT elevation (340 U/L) and necrosis lasting >7 days.',
            methodological_reason: 'Interspecies divergence in innate immune PRR (pattern recognition receptor) sensitivity and macrophage phagocytic capacity. Rodents tolerate lipid accumulation significantly better than primates.',
            sources_involved: [
              'High-Efficiency Ionizable LNP Formulations in Murine Hepatic Models',
              'Acute Hepatotoxicity and Kupffer Cell Inflammation in Non-Human Primates Following High-Dose LNP Regimens'
            ]
          }
        ]),
        JSON.stringify([
          {
            gap_title: 'Chronic Repeat-Dosing Accumulation Dynamics',
            description: 'All 3 studies evaluated single-dose or short-term administration (<14 days). Neither evaluated repeat bi-weekly administration over 6+ months for rare chronic metabolic diseases.',
            suggested_next_study: 'Longitudinal 6-month repeat-dosing trial in non-human primates evaluating liver fibrosis biomarkers and secondary lymphoid organ accumulation.'
          },
          {
            gap_title: 'Pediatric vs. Geriatric Hepatic Clearance Variations',
            description: 'Enzymatic carboxylesterase expression varies widely across developmental stages and aging populations, which could affect BioLipid cleavage rates.',
            suggested_next_study: 'Human liver donor tissue microsome assay stratified across pediatric, adult, and cirrhotic cohorts.'
          }
        ]),
        JSON.stringify([
          {
            action_title: 'Cease Non-Cleavable Lipid Formulations for Primate Translation',
            recommendation: 'Immediately decommission saturated, non-biodegradable ionizable lipids for clinical systemic mRNA programs, replacing them with carboxylesterase-cleavable ester linkages.',
            evidence_confidence: 'High',
            risk_if_ignored: 'Failure in Phase 1 clinical trials due to dose-limiting transaminitis and acute cytokine release syndrome.'
          },
          {
            action_title: 'Institute Primate Maximum Dosing Cap at 0.20 mg/kg',
            recommendation: 'Cap first-in-human trial starting doses at <=0.15 mg/kg until accelerated clearance kinetics are empirically confirmed in clinical pharmacokinetic cohorts.',
            evidence_confidence: 'High',
            risk_if_ignored: 'Hepatocyte necrosis and potential acute liver failure during dose-escalation cohorts.'
          }
        ]),
        'Mixed / Contested'
      ]
    );

    // 7. Seed Initial Copilot Q&A
    await db.query(
      `INSERT INTO copilot_messages (workspace_id, user_id, role, message_text, citations, follow_up_questions)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        workspaceId,
        userId,
        'user',
        'Where do these studies disagree on dosing thresholds and what sample sizes were used?',
        JSON.stringify([]),
        JSON.stringify([])
      ]
    );

    await db.query(
      `INSERT INTO copilot_messages (workspace_id, user_id, role, message_text, citations, follow_up_questions)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        workspaceId,
        userId,
        'assistant',
        `Based on the uploaded research corpus, there is a fundamental empirical contradiction regarding safe dosing thresholds between rodent and non-human primate models:

1. **Rodent Safety Threshold (0.5 mg/kg)**:
   According to *High-Efficiency Ionizable LNP Formulations in Murine Hepatic Models* (Chen et al., 2024), doses up to **0.5 mg/kg** demonstrated 94.2% transfection efficiency with only transient, mild liver enzyme increases (peak ALT 78 U/L), fully normalizing within 48 hours. This study utilized a cohort of **120 C57BL/6 mice**.

2. **Primate Toxicity Threshold (0.15–0.3 mg/kg)**:
   In stark contrast, *Acute Hepatotoxicity and Kupffer Cell Inflammation in Non-Human Primates Following High-Dose LNP Regimens* (Vanderbilt et al., 2023) established that doses at or exceeding **0.3 mg/kg** trigger severe hepatic necrosis, Kupffer cell pyroptosis, and peak ALT levels of 340 U/L persisting beyond 7 days. They set the maximum safe threshold at **0.15 mg/kg** using **18 Cynomolgus macaques**.

3. **Mechanistic Resolution via Ester Cleavage**:
   *Biodegradable Ester-Linked LNP Cleavage Kinetics and Safety Margin Resolution* (Morrison & Al-Mansoor, 2024) tested canines and primates, demonstrating that incorporating biodegradable ester bonds allows safe delivery at **0.5 mg/kg** by reducing lipid half-life from 38.6 hours down to 4.2 hours.`,
        JSON.stringify([
          {
            source_id: s1Id,
            source_title: 'High-Efficiency Ionizable LNP Formulations in Murine Hepatic Models',
            relevance_note: 'Establishes 0.5 mg/kg safe dosing in n=120 rodent cohort with rapid 48h recovery.',
            key_excerpt: 'Intravenous administration at 0.5 mg/kg achieved 94.2% splenic and hepatic transfection efficiency... fully resolved within 48 hours.'
          },
          {
            source_id: s2Id,
            source_title: 'Acute Hepatotoxicity and Kupffer Cell Inflammation in Non-Human Primates Following High-Dose LNP Regimens',
            relevance_note: 'Demonstrates acute toxicity at >=0.3 mg/kg in n=18 primates with persistent 7-day necrosis.',
            key_excerpt: 'safe maximum tolerated therapeutic threshold in primates cannot exceed 0.15 mg/kg for conventional non-cleavable ionizable lipids.'
          },
          {
            source_id: s3Id,
            source_title: 'Biodegradable Ester-Linked LNP Cleavage Kinetics and Safety Margin Resolution',
            relevance_note: 'Resolves discrepancy by accelerating clearance kinetics (t1/2 4.2h vs 38.6h).',
            key_excerpt: 'When administered to canines and non-human primates at 0.5 mg/kg, BioLipid-E4 achieved 91.4% mRNA transfection efficiency while suppressing ALT spikes to under 1.4-fold baseline.'
          }
        ]),
        JSON.stringify([
          'What specific cytokines were elevated in primates during Kupffer cell pyroptosis?',
          'How does carboxylesterase enzyme density in human liver compare to cynomolgus macaques?',
          'What are the recommended safety markers to monitor in Phase 1 clinical trials for ester LNPs?'
        ])
      ]
    );

    console.log('✓ Successfully seeded demo researcher account and mRNA delivery workspace with 3 studies, 12 claims, and synthesis report.');
  } catch (err) {
    console.error('Error seeding demo data:', err);
  }
}
