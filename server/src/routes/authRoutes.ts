import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.issues.map((e: any) => e.message)
      });
    }

    const { full_name, email, password, institution, research_role } = parseResult.data;

    // Check if email already registered
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: 'Registration Error',
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (full_name, email, password_hash, institution, research_role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email, institution, research_role, created_at`,
      [
        full_name,
        email.toLowerCase().trim(),
        passwordHash,
        institution || 'Independent Research Institute',
        research_role || 'Principal Investigator'
      ]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        institution: user.institution,
        research_role: user.research_role
      }
    });
  } catch (err: any) {
    console.error('Registration failed:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Unable to complete registration. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.issues.map((e: any) => e.message)
      });
    }

    const { email, password } = parseResult.data;
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Invalid email or password.'
      });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        institution: user.institution,
        research_role: user.research_role
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Login could not be completed.' });
  }
});

// POST /api/auth/demo-login (1-Click instant demo login)
router.post('/demo-login', async (_req: Request, res: Response) => {
  try {
    let result = await db.query('SELECT * FROM users WHERE email = $1', ['demo@scholarmesh.ai']);
    
    if (result.rows.length === 0) {
      // Re-trigger seed if not yet present
      const { seedDemoData } = await import('../db/seed.js');
      await seedDemoData();
      result = await db.query('SELECT * FROM users WHERE email = $1', ['demo@scholarmesh.ai']);
    }

    const user = result.rows[0];
    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        institution: user.institution,
        research_role: user.research_role
      }
    });
  } catch (err: any) {
    console.error('Demo login error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Unable to access demo account.' });
  }
});

// GET /api/auth/me (Protected current user session & dashboard counts)
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Retrieve user and aggregate metrics
    const userRes = await db.query('SELECT id, full_name, email, institution, research_role, created_at FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'User profile not found.' });
    }

    const user = userRes.rows[0];
    const workspacesRes = await db.query('SELECT id FROM workspaces WHERE user_id = $1', [userId]);
    const sourcesRes = await db.query('SELECT id FROM sources WHERE user_id = $1', [userId]);
    const claimsRes = await db.query('SELECT id FROM extracted_claims WHERE user_id = $1', [userId]);
    const synthesesRes = await db.query('SELECT id FROM synthesis_reports WHERE user_id = $1', [userId]);

    return res.json({
      user: {
        ...user,
        workspace_count: workspacesRes.rows.length,
        source_count: sourcesRes.rows.length,
        claim_count: claimsRes.rows.length,
        synthesis_count: synthesesRes.rows.length
      }
    });
  } catch (err: any) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch user profile.' });
  }
});

export default router;
