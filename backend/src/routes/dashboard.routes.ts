import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { dashboardHandler } from '../handlers/dashboard.handler.js';

export async function dashboardRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/summary', dashboardHandler.getSummary);
}