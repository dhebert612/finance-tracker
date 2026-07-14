import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { incomeSourceHandler } from '../handlers/income-source.handler.js';

export async function incomeSourceRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/',       incomeSourceHandler.getAll);
  fastify.get('/:id',   incomeSourceHandler.getOne);
  fastify.post('/',     incomeSourceHandler.create);
  fastify.patch('/:id', incomeSourceHandler.update);
  fastify.delete('/:id', incomeSourceHandler.remove);
}