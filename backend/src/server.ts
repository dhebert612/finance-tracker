import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { config } from './config/config.js';
import { pool } from './db/pool.js';

const server = Fastify({
  logger: true,
});

// Plugins
await server.register(cookie);
await server.register(cors, {
  origin: config.server.nodeEnv === 'development' ? true : process.env.FRONTEND_URL,
  credentials: true,
});

// Health check
server.get('/health', async () => {
  return { status: 'ok' };
});

// API routes — v1
// routes will be registered here as we build them

// Start server
try {
  // Verify DB connection on startup
  const client = await pool.connect();
  client.release();
  console.log('✓ Database connected');

  await server.listen({ port: config.server.port, host: '0.0.0.0' });
  console.log(`✓ Server running on port ${config.server.port}`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}