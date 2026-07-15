import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { extractTextFromPdf } from '../services/pdf.service.js';
import { statementRepository } from '../repositories/statement.repository.js';
import { analyzeStatement } from '../services/groq.service.js';
import { config } from '../config/config.js';

const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
});

const createStatementSchema = z.object({
  account_id:      z.string().uuid(),
  statement_date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  due_date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  closing_balance: z.number().positive(),
  minimum_payment: z.number().positive().optional(),
});

export const statementHandler = {

  async getAccounts(request: FastifyRequest, reply: FastifyReply) {
    const accounts = await statementRepository.findAccountsByUser(request.userId);
    return reply.send(accounts);
  },

  async createAccount(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createAccountSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', messages: parsed.error.errors.map(e => e.message) });
    }
    const account = await statementRepository.createAccount(request.userId, parsed.data.name);
    return reply.status(201).send(account);
  },

  async deleteAccount(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const deleted = await statementRepository.deleteAccount(request.params.id, request.userId);
    if (!deleted) return reply.status(404).send({ error: 'Account not found' });
    return reply.status(204).send();
  },

  async getStatements(request: FastifyRequest<{ Params: { accountId: string } }>, reply: FastifyReply) {
    const statements = await statementRepository.findStatementsByAccount(request.params.accountId, request.userId);
    return reply.send(statements);
  },

  async createStatement(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createStatementSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', messages: parsed.error.errors.map(e => e.message) });
    }
    const { account_id, statement_date, due_date, closing_balance, minimum_payment } = parsed.data;
    const statement = await statementRepository.createStatement(
      account_id, statement_date, due_date, closing_balance, minimum_payment ?? null, null
    );
    return reply.status(201).send(statement);
  },

  // Upload PDF → extract text → analyze with Groq → return analysis
  async uploadAndAnalyze(request: FastifyRequest<{ Params: { accountId: string } }>, reply: FastifyReply) {
    if (!config.groq.apiKey) {
      return reply.status(503).send({ error: 'AI analysis not configured' });
    }

    const data = await request.file();
    if (!data) return reply.status(400).send({ error: 'No file uploaded' });

    if (!data.mimetype.includes('pdf')) {
      return reply.status(400).send({ error: 'Only PDF files are supported' });
    }

    // Read file into buffer
    const buffer = await data.toBuffer();

    // Save PDF to disk
    const uploadDir = path.join(config.uploads.dir, 'statements');
    await fs.mkdir(uploadDir, { recursive: true });
    const fileName = `${request.params.accountId}-${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    // Extract text from PDF
    let pdfText: string;
    try {
      pdfText = await extractTextFromPdf(buffer);
      console.log('Extracted text length:', pdfText.length);
      console.log('First 200 chars:', pdfText.slice(0, 200));
    } catch (err) {
      console.error('PDF extraction error:', err);
      return reply.status(422).send({ error: 'Could not extract text from PDF. Is it a text-based PDF?' });
    }

    if (!pdfText || pdfText.trim().length < 50) {
      return reply.status(422).send({ error: 'PDF appears to be image-based or empty. Try a text-based PDF.' });
    }

    // Send extracted text to Groq for analysis
    try {
      const analysis = await analyzeStatement(pdfText);
      return reply.send({ analysis, pdf_path: `/statements/${fileName}` });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'AI analysis failed' });
    }
  },

  // Analyze raw text directly (fallback for manual paste)
  async analyzeText(request: FastifyRequest<{ Params: { accountId: string } }>, reply: FastifyReply) {
    const body = request.body as { text: string };
    if (!body.text) return reply.status(400).send({ error: 'No text provided' });

    if (!config.groq.apiKey) {
      return reply.status(503).send({ error: 'AI analysis not configured' });
    }

    try {
      const analysis = await analyzeStatement(body.text);
      return reply.send({ analysis });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'AI analysis failed' });
    }
  },

};