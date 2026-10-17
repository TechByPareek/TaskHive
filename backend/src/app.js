/**
 * app.js
 * Configures the Express application:
 *  - CORS for the frontend origin
 *  - JSON body parsing
 *  - Task routes under /api/tasks
 *  - 404 and centralized error handling
 */

import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/task.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Explicit origins from env (use these in production), e.g.
// ALLOWED_ORIGINS=https://myapp.com,https://www.myapp.com
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

// In development, allow the frontend on ANY localhost port
// (Vite hops to 5174, 5175... when a port is busy)
const isProduction = process.env.NODE_ENV === 'production';
const localhostPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, etc.)
      if (!origin) return callback(null, true);

      if (envOrigins.includes(origin)) return callback(null, true);

      if (!isProduction && localhostPattern.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS: Origin "${origin}" is not allowed.`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Reject malformed JSON
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body.' });
  }
  next(err);
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/tasks', taskRoutes);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Centralized error handler ─────────────────────────────────────────────────
app.use(errorHandler);

export default app;