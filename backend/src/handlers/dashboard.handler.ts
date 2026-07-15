import { FastifyRequest, FastifyReply } from 'fastify';
import { dashboardRepository } from '../repositories/dashboard.repository.js';

export const dashboardHandler = {

  async getSummary(request: FastifyRequest, reply: FastifyReply) {
    const summary = await dashboardRepository.getSummary(request.userId);
    return reply.send(summary);
  },

};