import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { billHandler } from '../handlers/bill.handler.js';

export async function billRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/',                  billHandler.getAll);
  fastify.get('/:id',               billHandler.getOne);
  fastify.post('/',                 billHandler.create);
  fastify.patch('/:id',             billHandler.update);
  fastify.delete('/:id',            billHandler.remove);
  fastify.post('/:id/payments',     billHandler.markPaid);
  fastify.delete('/:id/payments',   billHandler.unmarkPaid);
  fastify.get('/:id/payments',      billHandler.getPaymentHistory);
}