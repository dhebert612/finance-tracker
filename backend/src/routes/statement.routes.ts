import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { statementHandler, saveAnalysisHandler } from '../handlers/statement.handler.js';

export async function statementRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', authenticate);

  // Credit card accounts
  fastify.get('/accounts',          statementHandler.getAccounts);
  fastify.post('/accounts',         statementHandler.createAccount);
  fastify.delete('/accounts/:id',   statementHandler.deleteAccount);

  // Statements per account
  fastify.get('/accounts/:accountId/statements',        statementHandler.getStatements);
  fastify.post('/statements',                           statementHandler.createStatement);

  // Upload PDF and analyze in one step
  fastify.post('/accounts/:accountId/upload-analyze',   statementHandler.uploadAndAnalyze);

  // Analyze pasted text directly
  fastify.post('/accounts/:accountId/analyze-text',     statementHandler.analyzeText);

  // Save analysis results to DB
  fastify.post('/accounts/:accountId/save-analysis',    saveAnalysisHandler.saveAnalysis);
}