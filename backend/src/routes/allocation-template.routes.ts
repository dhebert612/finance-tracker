import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { allocationTemplateHandler } from '../handlers/allocation-template.handler.js';

export async function allocationTemplateRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/mine',        allocationTemplateHandler.getMine);
  fastify.put('/mine',        allocationTemplateHandler.saveMine);
  fastify.post('/preview',    allocationTemplateHandler.preview);
}