import { Router, Response } from 'express';
import db from '../config/db.js';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware.js';
import { copilotQuestionSchema } from '../validators/schemas.js';
import { askResearchCopilot } from '../services/geminiService.js';

const router = Router({ mergeParams: true });
router.use(authenticateToken);

// GET /api/workspaces/:workspaceId/copilot (Fetch chat history)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.workspaceId;

    const ws = await db.query('SELECT id FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
    if (ws.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Workspace not found.' });
    }

    const messagesRes = await db.query(
      'SELECT * FROM copilot_messages WHERE workspace_id = $1 AND user_id = $2 ORDER BY created_at ASC',
      [workspaceId, userId]
    );

    return res.json({ messages: messagesRes.rows });
  } catch (err: any) {
    console.error('Fetch copilot messages error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve copilot history.' });
  }
});

// POST /api/workspaces/:workspaceId/copilot (Ask grounded question)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.workspaceId;

    const parseResult = copilotQuestionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.issues.map((e: any) => e.message)
      });
    }

    const { question } = parseResult.data;

    // Verify workspace
    const wsRes = await db.query('SELECT * FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
    if (wsRes.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Workspace not found.' });
    }
    const workspace = wsRes.rows[0];

    // Fetch all workspace sources with their claims
    const sourcesRes = await db.query(
      'SELECT id, title, authors, raw_content, ai_summary FROM sources WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, userId]
    );

    if (sourcesRes.rows.length === 0) {
      return res.status(400).json({
        error: 'Corpus Empty',
        message: 'No research sources have been ingested into this workspace yet. Upload at least one PDF/document or click "Load Sample Study" first.'
      });
    }

    const sourcesWithClaims = await Promise.all(
      sourcesRes.rows.map(async (s) => {
        const claimsRes = await db.query('SELECT claim_text FROM extracted_claims WHERE source_id = $1', [s.id]);
        return {
          id: s.id,
          title: s.title,
          authors: s.authors,
          raw_content: s.raw_content,
          ai_summary: s.ai_summary || '',
          claims: claimsRes.rows
        };
      })
    );

    // Save user message to database
    await db.query(
      `INSERT INTO copilot_messages (workspace_id, user_id, role, message_text, citations, follow_up_questions)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [workspaceId, userId, 'user', question, JSON.stringify([]), JSON.stringify([])]
    );

    // Fetch recent chat history
    const historyRes = await db.query(
      'SELECT role, message_text FROM copilot_messages WHERE workspace_id = $1 AND user_id = $2 ORDER BY created_at ASC',
      [workspaceId, userId]
    );

    // Run Gemini Copilot Query
    const copilotAnswer = await askResearchCopilot(
      workspace.research_question,
      sourcesWithClaims,
      historyRes.rows,
      question
    );

    // Save assistant message to database
    const assistantMsgRes = await db.query(
      `INSERT INTO copilot_messages (workspace_id, user_id, role, message_text, citations, follow_up_questions)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        workspaceId,
        userId,
        'assistant',
        copilotAnswer.answer_markdown,
        JSON.stringify(copilotAnswer.citations || []),
        JSON.stringify(copilotAnswer.follow_up_questions || [])
      ]
    );

    return res.status(201).json({
      message: assistantMsgRes.rows[0]
    });
  } catch (err: any) {
    console.error('Copilot query error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to process copilot query.' });
  }
});

export default router;
