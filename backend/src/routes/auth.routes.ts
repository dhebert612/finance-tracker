import { FastifyInstance } from 'fastify';
import { authHandler } from '../handlers/auth.handler.js';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/register', authHandler.register);
  fastify.post('/login',    authHandler.login);
  fastify.post('/logout',   authHandler.logout);
  fastify.post('/refresh',  authHandler.refresh);
}