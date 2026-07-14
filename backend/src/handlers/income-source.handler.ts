import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { incomeSourceRepository } from '../repositories/income-source.repository.js';

const incomeTypeEnum = z.enum(['employment', 'freelance', 'rental', 'investment', 'other']);

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: incomeTypeEnum,
});

const updateSchema = z.object({
  name:      z.string().min(1).max(100).optional(),
  type:      incomeTypeEnum.optional(),
  is_active: z.boolean().optional(),
});

export const incomeSourceHandler = {

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const sources = await incomeSourceRepository.findAllByUser(request.userId);
    return reply.send(sources);
  },

  async getOne(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const source = await incomeSourceRepository.findById(request.params.id, request.userId);
    if (!source) {
      return reply.status(404).send({ error: 'Income source not found' });
    }
    return reply.send(source);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error:    'VALIDATION_ERROR',
        messages: parsed.error.errors.map(e => e.message),
      });
    }

    const source = await incomeSourceRepository.create(request.userId, parsed.data);
    return reply.status(201).send(source);
  },

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error:    'VALIDATION_ERROR',
        messages: parsed.error.errors.map(e => e.message),
      });
    }

    const source = await incomeSourceRepository.update(request.params.id, request.userId, parsed.data);
    if (!source) {
      return reply.status(404).send({ error: 'Income source not found' });
    }
    return reply.send(source);
  },

  async remove(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const deleted = await incomeSourceRepository.softDelete(request.params.id, request.userId);
    if (!deleted) {
      return reply.status(404).send({ error: 'Income source not found' });
    }
    return reply.status(204).send();
  },

};