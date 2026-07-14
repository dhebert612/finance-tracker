import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  server: {
    port: parseInt(getEnv('PORT', '8080')),
    nodeEnv: getEnv('NODE_ENV', 'development'),
  },
  db: {
    host:     requireEnv('DB_HOST'),
    port:     parseInt(getEnv('DB_PORT', '5432')),
    user:     requireEnv('DB_USER'),
    password: requireEnv('DB_PASSWORD'),
    name:     requireEnv('DB_NAME'),
    sslMode:  getEnv('DB_SSL_MODE', 'disable'),
  },
  jwt: {
    secret:              requireEnv('JWT_SECRET'),
    accessExpiryHours:   1,
    refreshExpiryDays:   30,
  },
} as const;