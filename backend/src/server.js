/**
 * server.js
 * Entry point: loads environment configuration and starts the HTTP server.
 */

import 'dotenv/config';
import app from './app.js';

const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Task Management API running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Tasks API:    http://localhost:${PORT}/api/tasks`);
  console.log(`   Environment:  ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully…');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully…');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

export default server;
