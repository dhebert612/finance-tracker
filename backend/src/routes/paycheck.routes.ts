import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { paycheckHandler } from '../handlers/paycheck.handler.js';

export async function paycheckRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/',      paycheckHandler.getAll);
  fastify.get('/:id',  paycheckHandler.getOne);
  fastify.post('/',    paycheckHandler.create);
  fastify.delete('/:id', paycheckHandler.remove);
}