import { Router, Response } from 'express';
import db from '../config/db.js';
import { createWorkspaceSchema } from '../validators/schemas.js';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateToken);

// GET /api/workspaces (List all user workspaces with optional filters and dynamic counts)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { domain, search } = req.query;

    const queryParams: any[] = [userId];
    let sql = `
      SELECT w.*,
        (SELECT COUNT(*)::text FROM sources s WHERE s.workspace_id = w.id) AS source_count,
        (SELECT COUNT(*)::text FROM extracted_claims c WHERE c.workspace_id = w.id) AS claim_count,
        (SELECT COUNT(*)::text FROM synthesis_reports sr WHERE sr.workspace_id = w.id) AS synthesis_count
      FROM workspaces w
      WHERE w.user_id = $1
    `;

    if (domain && typeof domain === 'string' && domain !== 'all') {
      queryParams.push(domain);
      sql += ` AND w.domain = $${queryParams.length}`;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      queryParams.push(`%${search.trim()}%`);
      sql += ` AND (w.title ILIKE $${queryParams.length} OR w.research_question ILIKE $${queryParams.length})`;
    }

    sql += ' ORDER BY w.created_at DESC';

    const result = await db.query(sql, queryParams);
    return res.json({ workspaces: result.rows });
  } catch (err: any) {
    console.error('Fetch workspaces error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch workspaces.' });
  }
});

// POST /api/workspaces (Create a new workspace)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const parseResult = createWorkspaceSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.issues.map((e: any) => e.message)
      });
    }

    const { title, domain, research_question, working_hypothesis, default_synthesis_mode } = parseResult.data;

    const result = await db.query(
      `INSERT INTO workspaces (user_id, title, domain, research_question, working_hypothesis, default_synthesis_mode)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        userId,
        title,
        domain,
        research_question,
        working_hypothesis || null,
        default_synthesis_mode || 'systematic_review'
      ]
    );

    const workspace = result.rows[0];
    return res.status(201).json({
      workspace: {
        ...workspace,
        source_count: '0',
        claim_count: '0',
        synthesis_count: '0'
      }
    });
  } catch (err: any) {
    console.error('Create workspace error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Unable to create research workspace.' });
  }
});

// GET /api/workspaces/:id (Get full workspace details)
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.id;

    // Check workspace ownership
    const wsRes = await db.query('SELECT * FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
    if (wsRes.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Research workspace not found or unauthorized.' });
    }

    const workspace = wsRes.rows[0];

    // Fetch sources
    const sourcesRes = await db.query(
      'SELECT * FROM sources WHERE workspace_id = $1 AND user_id = $2 ORDER BY created_at DESC',
      [workspaceId, userId]
    );

    // Fetch claims count
    const claimsRes = await db.query(
      'SELECT id FROM extracted_claims WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, userId]
    );

    // Fetch synthesis reports
    const synthesesRes = await db.query(
      'SELECT * FROM synthesis_reports WHERE workspace_id = $1 AND user_id = $2 ORDER BY created_at DESC',
      [workspaceId, userId]
    );

    return res.json({
      workspace: {
        ...workspace,
        sources: sourcesRes.rows,
        claim_count: claimsRes.rows.length,
        synthesis_reports: synthesesRes.rows
      }
    });
  } catch (err: any) {
    console.error('Get workspace details error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to load workspace details.' });
  }
});

// DELETE /api/workspaces/:id (Delete a workspace)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.id;

    const check = await db.query('SELECT id FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Workspace not found or unauthorized.' });
    }

    await db.query('DELETE FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);

    return res.json({ success: true, message: 'Research workspace and all linked documents successfully deleted.' });
  } catch (err: any) {
    console.error('Delete workspace error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to delete workspace.' });
  }
});

export default router;
