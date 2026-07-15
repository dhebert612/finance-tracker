import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { billRepository } from '../repositories/bill.repository.js';

const frequencyEnum = z.enum(['weekly', 'biweekly', 'monthly', 'yearly']);

const createSchema = z.object({
  name:      z.string().min(1, 'Name is required').max(100),
  amount:    z.number().positive('Amount must be positive'),
  frequency: frequencyEnum,
  due_day:   z.number().int().min(1).max(31).optional(),
  due_month: z.number().int().min(1).max(12).optional(),
  category:  z.string().max(100).optional(),
});

const updateSchema = z.object({
  name:      z.string().min(1).max(100).optional(),
  amount:    z.number().positive().optional(),
  frequency: frequencyEnum.optional(),
  due_day:   z.number().int().min(1).max(31).nullable().optional(),
  due_month: z.number().int().min(1).max(12).nullable().optional(),
  category:  z.string().max(100).nullable().optional(),
});

const markPaidSchema = z.object({
  paid_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  amount_paid: z.number().positive('Amount paid must be positive'),
});

export const billHandler = {

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const bills = await billRepository.findAllByUser(request.userId);
    return reply.send(bills);
  },

  async getOne(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const bill = await billRepository.findById(request.params.id, request.userId);
    if (!bill) return reply.status(404).send({ error: 'Bill not found' });
    return reply.send(bill);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', messages: parsed.error.errors.map(e => e.message) });
    }
    const bill = await billRepository.create(request.userId, parsed.data);
    return reply.status(201).send(bill);
  },

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', messages: parsed.error.errors.map(e => e.message) });
    }
    const bill = await billRepository.update(request.params.id, request.userId, parsed.data);
    if (!bill) return reply.status(404).send({ error: 'Bill not found' });
    return reply.send(bill);
  },

  async markPaid(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = markPaidSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', messages: parsed.error.errors.map(e => e.message) });
    }
    const payment = await billRepository.markPaid(request.params.id, request.userId, parsed.data);
    if (!payment) return reply.status(404).send({ error: 'Bill not found' });
    return reply.status(201).send(payment);
  },

  async unmarkPaid(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const success = await billRepository.unmarkPaid(request.params.id, request.userId);
    if (!success) return reply.status(404).send({ error: 'Bill not found or no payment to remove' });
    return reply.status(204).send();
  },

  async getPaymentHistory(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const payments = await billRepository.getPaymentHistory(request.params.id, request.userId);
    return reply.send(payments);
  },

  async remove(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const deleted = await billRepository.softDelete(request.params.id, request.userId);
    if (!deleted) return reply.status(404).send({ error: 'Bill not found' });
    return reply.status(204).send();
  },

};