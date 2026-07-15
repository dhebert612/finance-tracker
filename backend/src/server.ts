import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { config } from './config/config.js';
import { pool } from './db/pool.js';
import { authRoutes } from './routes/auth.routes.js';
import { incomeSourceRoutes } from './routes/income-source.routes.js';
import { paycheckRoutes } from './routes/paycheck.routes.js';
import { billRoutes } from './routes/bill.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';

const server = Fastify({
  logger: true,
});

// Plugins
await server.register(cookie);
await server.register(cors, {
  origin:      config.server.nodeEnv === 'development' ? true : process.env.FRONTEND_URL,
  credentials: true,
});

// Health check
server.get('/health', async () => {
  return { status: 'ok' };
});

// API routes — v1
await server.register(authRoutes,         { prefix: '/api/v1/auth' });
await server.register(incomeSourceRoutes, { prefix: '/api/v1/income-sources' });
await server.register(paycheckRoutes,     { prefix: '/api/v1/paychecks' });
await server.register(billRoutes,         { prefix: '/api/v1/bills' });
await server.register(dashboardRoutes,    { prefix: '/api/v1/dashboard' });

// Start server
try {
  const client = await pool.connect();
  client.release();
  console.log('✓ Database connected');

  await server.listen({ port: config.server.port, host: '0.0.0.0' });
  console.log(`✓ Server running on port ${config.server.port}`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}