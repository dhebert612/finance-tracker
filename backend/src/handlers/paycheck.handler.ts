import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { paycheckRepository } from '../repositories/paycheck.repository.js';
import { allocationTemplateRepository } from '../repositories/allocation-template.repository.js';
import { splitPaycheck } from '../services/splitter.service.js';

const createSchema = z.object({
  income_source_id: z.string().uuid('Invalid income source ID'),
  pay_date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  gross_amount:     z.number().positive('Gross amount must be positive'),
  net_amount:       z.number().positive('Net amount must be positive'),
  note:             z.string().max(500).optional(),
});

export const paycheckHandler = {

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const paychecks = await paycheckRepository.findAllByUser(request.userId);
    return reply.send(paychecks);
  },

  async getOne(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const paycheck = await paycheckRepository.findByIdWithAllocations(request.params.id, request.userId);
    if (!paycheck) {
      return reply.status(404).send({ error: 'Paycheck not found' });
    }
    return reply.send(paycheck);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error:    'VALIDATION_ERROR',
        messages: parsed.error.errors.map(e => e.message),
      });
    }

    const { income_source_id, pay_date, gross_amount, net_amount, note } = parsed.data;

    // Fetch user's saved template
    const template = await allocationTemplateRepository.findByUser(request.userId);
    if (!template || template.rules.length === 0) {
      return reply.status(400).send({
        error: 'No split template found. Please set up your bucket split template first.',
      });
    }

    // Run the splitter using the template rules
    let resolvedBuckets;
    try {
      resolvedBuckets = splitPaycheck(net_amount, template.rules);
    } catch (err) {
      if (err instanceof Error) {
        const messages: Record<string, string> = {
          MULTIPLE_REMAINDER_BUCKETS: 'Only one remainder bucket is allowed',
          ALLOCATION_EXCEEDS_NET:     'Total allocations exceed the net amount',
          INVALID_PERCENT:            'Percent values must be between 0 and 100',
          NEGATIVE_FIXED_AMOUNT:      'Fixed amounts cannot be negative',
        };
        const message = messages[err.message];
        if (message) {
          return reply.status(400).send({ error: message });
        }
      }
      throw err;
    }

    const paycheck = await paycheckRepository.create(
      request.userId,
      income_source_id,
      pay_date,
      gross_amount,
      net_amount,
      note,
      resolvedBuckets
    );

    return reply.status(201).send(paycheck);
  },

  async remove(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const deleted = await paycheckRepository.softDelete(request.params.id, request.userId);
    if (!deleted) {
      return reply.status(404).send({ error: 'Paycheck not found' });
    }
    return reply.status(204).send();
  },

};