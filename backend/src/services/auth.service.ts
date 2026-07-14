import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { userRepository } from '../repositories/user.repository.js';
import { config } from '../config/config.js';
import { UserPublic, RegisterInput, LoginInput } from '../models/user.js';

const SALT_ROUNDS = 12;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
}

// Strip password_hash before sending user to client
function toPublicUser(user: { id: string; email: string; display_name: string; family_id: string | null; family_role: 'admin' | 'member' | null }): UserPublic {
  return {
    id:           user.id,
    email:        user.email,
    display_name: user.display_name,
    family_id:    user.family_id,
    family_role:  user.family_role,
  };
}

function generateTokens(userId: string): TokenPair {
  const accessToken = jwt.sign(
    { sub: userId },
    config.jwt.secret,
    { expiresIn: `${config.jwt.accessExpiryHours}h` }
  );

  const refreshToken = jwt.sign(
    { sub: userId },
    config.jwt.secret,
    { expiresIn: `${config.jwt.refreshExpiryDays}d` }
  );

  return { accessToken, refreshToken };
}

async function storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
  // Hash the refresh token before storing — same principle as passwords
  const tokenHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshExpiryDays);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
}

export const authService = {

  async register(input: RegisterInput): Promise<AuthResult> {
    // Check if email is already taken
    const exists = await userRepository.emailExists(input.email);
    if (exists) {
      throw new Error('EMAIL_TAKEN');
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create the user
    const user = await userRepository.create(
      input.email.toLowerCase().trim(),
      passwordHash,
      input.display_name.trim()
    );

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token in DB
    await storeRefreshToken(user.id, refreshToken);

    return {
      user: toPublicUser(user),
      accessToken,
      refreshToken,
    };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    // Find user by email
    const user = await userRepository.findByEmail(input.email.toLowerCase().trim());
    if (!user) {
      // Use same error as wrong password — don't reveal which is wrong
      throw new Error('INVALID_CREDENTIALS');
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(input.password, user.password_hash);
    if (!passwordMatch) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token in DB
    await storeRefreshToken(user.id, refreshToken);

    return {
      user: toPublicUser(user),
      accessToken,
      refreshToken,
    };
  },

  async logout(refreshToken: string): Promise<void> {
    // Find all non-revoked tokens and check which one matches
    const result = await pool.query<{ id: string; token_hash: string }>(
      `SELECT id, token_hash FROM refresh_tokens
       WHERE revoked_at IS NULL AND expires_at > NOW()`,
    );

    for (const row of result.rows) {
      const match = await bcrypt.compare(refreshToken, row.token_hash);
      if (match) {
        await pool.query(
          `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`,
          [row.id]
        );
        return;
      }
    }
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    // Verify the JWT is valid and not expired
    let payload: { sub: string };
    try {
      payload = jwt.verify(refreshToken, config.jwt.secret) as { sub: string };
    } catch {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    // Check the token exists in DB and is not revoked
    const result = await pool.query<{ id: string; token_hash: string }>(
      `SELECT id, token_hash FROM refresh_tokens
       WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
      [payload.sub]
    );

    // Find matching token hash
    let tokenId: string | null = null;
    for (const row of result.rows) {
      const match = await bcrypt.compare(refreshToken, row.token_hash);
      if (match) {
        tokenId = row.id;
        break;
      }
    }

    if (!tokenId) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    // Issue new access token
    const accessToken = jwt.sign(
      { sub: payload.sub },
      config.jwt.secret,
      { expiresIn: `${config.jwt.accessExpiryHours}h` }
    );

    return { accessToken };
  },

};