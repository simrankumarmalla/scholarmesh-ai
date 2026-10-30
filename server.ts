import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import db from './server/src/config/db.js';
import { seedDemoData } from './server/src/db/seed.js';

// Route imports
import authRoutes from './server/src/routes/authRoutes.js';
import workspaceRoutes from './server/src/routes/workspaceRoutes.js';
import sourceRoutes from './server/src/routes/sourceRoutes.js';
import claimsRoutes from './server/src/routes/claimsRoutes.js';
import synthesisRoutes from './server/src/routes/synthesisRoutes.js';
import copilotRoutes from './server/src/routes/copilotRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Security & Parsing Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check API
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'ScholarMesh AI',
    timestamp: new Date().toISOString(),
    engine: 'Google Gemini 2.5 Flash',
    db_mode: db.isRealPostgres ? 'PostgreSQL' : 'Resilient File/Memory Store'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/workspaces/:workspaceId/sources', sourceRoutes);
app.use('/api/workspaces/:workspaceId/claims', claimsRoutes);
app.use('/api/workspaces/:workspaceId/copilot', copilotRoutes);
app.use('/api', synthesisRoutes);

// Centralized Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred while processing your request.'
  });
});

async function startServer() {
  try {
    // 1. Initialize Database
    await db.initDb();

    // 2. Seed Demo Researcher Account & Pre-populated mRNA Workspace
    await seedDemoData();

    // 3. Mount Vite or Static Frontend
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      // Development mode: Mount Vite dev server middleware
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
      console.log('⚡ Vite dev middleware mounted');
    } else {
      // Production mode: Serve built assets from dist/
      const distPath = path.resolve(__dirname, 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
      console.log('📦 Production static assets mounted from dist/');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n========================================================`);
      console.log(`🚀 ScholarMesh AI Server running on port ${PORT}`);
      console.log(`🔬 URL: http://localhost:${PORT}`);
      console.log(`👤 Demo Account: demo@scholarmesh.ai / DemoPass123!`);
      console.log(`========================================================\n`);
    });
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
}

startServer();
