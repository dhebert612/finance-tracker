import pg from 'pg';
import { config } from '../config/config.js';

const { Pool } = pg;

export const pool = new Pool({
  host:     config.db.host,
  port:     config.db.port,
  user:     config.db.user,
  password: config.db.password,
  database: config.db.name,
  ssl:      config.db.sslMode === 'require' ? { rejectUnauthorized: false } : false,
  max:      10,   // maximum connections in pool
  idleTimeoutMillis:    30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
  process.exit(1);
});