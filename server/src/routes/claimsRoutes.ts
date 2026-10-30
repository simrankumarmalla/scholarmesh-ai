import { Router, Response } from 'express';
import db from '../config/db.js';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });
router.use(authenticateToken);

// GET /api/workspaces/:workspaceId/claims (Filterable Claims Matrix)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.workspaceId;
    const { category, confidence, search } = req.query;

    // Verify workspace ownership
    const ws = await db.query('SELECT id FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
    if (ws.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Workspace not found.' });
    }

    const queryParams: any[] = [workspaceId, userId];
    let sql = `
      SELECT 
        c.*,
        s.title AS source_title,
        s.authors AS source_authors,
        s.rigor_score AS source_rigor_score,
        s.source_type
      FROM extracted_claims c
      JOIN sources s ON s.id = c.source_id
      WHERE c.workspace_id = $1 AND c.user_id = $2
    `;

    if (category && typeof category === 'string' && category !== 'all') {
      queryParams.push(category);
      sql += ` AND c.claim_category = $${queryParams.length}`;
    }

    if (confidence && typeof confidence === 'string' && confidence !== 'all') {
      queryParams.push(confidence);
      sql += ` AND c.confidence_level = $${queryParams.length}`;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      queryParams.push(`%${search.trim()}%`);
      sql += ` AND (c.claim_text ILIKE $${queryParams.length} OR c.supporting_quote ILIKE $${queryParams.length} OR s.title ILIKE $${queryParams.length})`;
    }

    sql += ' ORDER BY c.created_at DESC';

    const result = await db.query(sql, queryParams);
    return res.json({ claims: result.rows });
  } catch (err: any) {
    console.error('Fetch claims error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve extracted claims.' });
  }
});

export default router;
