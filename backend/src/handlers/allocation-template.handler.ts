import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { allocationTemplateRepository } from '../repositories/allocation-template.repository.js';
import { splitPaycheck } from '../services/splitter.service.js';

const ruleSchema = z.object({
  bucket_name: z.string().min(1).max(100),
  split_type:  z.enum(['percent', 'fixed', 'remainder']),
  value:       z.number().min(0),
  sort_order:  z.number().int().min(0),
});

const saveSchema = z.object({
  rules: z.array(ruleSchema).min(1),
});

export const allocationTemplateHandler = {

  async getMine(request: FastifyRequest, reply: FastifyReply) {
    const template = await allocationTemplateRepository.findByUser(request.userId);
    return reply.send(template);
  },

  async saveMine(request: FastifyRequest, reply: FastifyReply) {
    const parsed = saveSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error:    'VALIDATION_ERROR',
        messages: parsed.error.errors.map(e => e.message),
      });
    }

    const template = await allocationTemplateRepository.upsert(request.userId, parsed.data.rules);
    return reply.send(template);
  },

  async preview(request: FastifyRequest, reply: FastifyReply) {
    // Preview resolves template rules against a given net amount
    const parsed = z.object({
      net_amount: z.number().positive(),
      rules: z.array(ruleSchema).min(1),
    }).safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR' });
    }

    try {
      const resolved = splitPaycheck(parsed.data.net_amount, parsed.data.rules);
      return reply.send({ resolved });
    } catch (err) {
      if (err instanceof Error) {
        return reply.status(400).send({ error: err.message });
      }
      throw err;
    }
  },

};