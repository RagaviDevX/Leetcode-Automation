import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import rateLimit from 'express-rate-limit';

import { agentRouter } from './routes/agent';
import { solutionsRouter } from './routes/solutions';
import { statsRouter } from './routes/stats';
import { settingsRouter } from './routes/settings';
import { wsHandler } from './services/websocket';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// --- Middleware ---
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Strict rate limit for AI solve endpoint
const solveLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: 'Solve rate limit exceeded. Max 5 per minute.' },
});
app.use('/api/agent/solve', solveLimiter);

// --- Health check ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// --- Routes ---
app.use('/api/agent', authMiddleware, agentRouter);
app.use('/api/solutions', authMiddleware, solutionsRouter);
app.use('/api/stats', authMiddleware, statsRouter);
app.use('/api/settings', authMiddleware, settingsRouter);

// --- WebSocket ---
wss.on('connection', wsHandler);

// --- Error Handler ---
app.use(errorHandler);

// --- Start ---
const PORT = Number(process.env.PORT) || 3001;
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║        🤖 LeetAI Agent Backend        ║
║                                       ║
║  Server  : http://localhost:${PORT}      ║
║  WS      : ws://localhost:${PORT}/ws    ║
║  Env     : ${process.env.NODE_ENV || 'development'}             ║
╚═══════════════════════════════════════╝
  `);
});

export { server, wss };
