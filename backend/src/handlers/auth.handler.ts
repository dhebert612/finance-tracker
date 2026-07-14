import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';

// Zod schemas — validate and type the request body at the same time
const registerSchema = z.object({
  email:        z.string().email('Invalid email address'),
  password:     z.string().min(8, 'Password must be at least 8 characters'),
  display_name: z.string().min(1, 'Display name is required').max(50),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

// How long the refresh token cookie lives in the browser
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

function setRefreshCookie(reply: FastifyReply, token: string): void {
  reply.setCookie('refresh_token', token, {
    httpOnly: true,                          // JS cannot read this cookie
    secure:   process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict',                      // CSRF protection
    maxAge:   REFRESH_COOKIE_MAX_AGE,
    path:     '/api/v1/auth',               // cookie only sent to auth routes
  });
}

function clearRefreshCookie(reply: FastifyReply): void {
  reply.clearCookie('refresh_token', { path: '/api/v1/auth' });
}

export const authHandler = {

  async register(request: FastifyRequest, reply: FastifyReply) {
    // Validate request body
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        messages: parsed.error.errors.map(e => e.message),
      });
    }

    try {
      const { user, accessToken, refreshToken } = await authService.register(parsed.data);

      setRefreshCookie(reply, refreshToken);

      return reply.status(201).send({
        user,
        accessToken,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
        return reply.status(409).send({ error: 'Email is already in use' });
      }
      throw err;
    }
  },

  async login(request: FastifyRequest, reply: FastifyReply) {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        messages: parsed.error.errors.map(e => e.message),
      });
    }

    try {
      const { user, accessToken, refreshToken } = await authService.login(parsed.data);

      setRefreshCookie(reply, refreshToken);

      return reply.status(200).send({
        user,
        accessToken,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }
      throw err;
    }
  },

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = request.cookies?.refresh_token;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    clearRefreshCookie(reply);

    return reply.status(200).send({ message: 'Logged out' });
  },

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = request.cookies?.refresh_token;

    if (!refreshToken) {
      return reply.status(401).send({ error: 'No refresh token' });
    }

    try {
      const { accessToken } = await authService.refresh(refreshToken);
      return reply.status(200).send({ accessToken });
    } catch (err) {
      if (err instanceof Error && err.message === 'INVALID_REFRESH_TOKEN') {
        clearRefreshCookie(reply);
        return reply.status(401).send({ error: 'Invalid or expired refresh token' });
      }
      throw err;
    }
  },

};