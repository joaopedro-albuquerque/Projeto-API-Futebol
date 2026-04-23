const { Pool } = require('pg');

const PLACEHOLDER_REGEX = /\$\{\{[^}]+\}\}/;

const hasPlaceholder = (value) => PLACEHOLDER_REGEX.test(String(value || ''));

const expandRailwayPlaceholders = (value) => {
  if (!value) return value;

  let result = String(value);
  for (let i = 0; i < 6; i += 1) {
    if (!hasPlaceholder(result)) break;

    result = result.replace(/\$\{\{([^}]+)\}\}/g, (match, varName) => {
      const replacement = process.env[varName];
      return replacement == null ? match : replacement;
    });
  }

  return result;
};

const resolveConnectionString = () => {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const candidates = isDevelopment
    ? [process.env.DATABASE_URL_LOCAL, process.env.DATABASE_PUBLIC_URL, process.env.DATABASE_URL]
    : [process.env.DATABASE_URL, process.env.DATABASE_PUBLIC_URL, process.env.DATABASE_URL_LOCAL];

  for (const candidate of candidates) {
    const expanded = expandRailwayPlaceholders(candidate);
    if (!expanded || hasPlaceholder(expanded)) continue;
    return expanded;
  }

  throw new Error(
    'No valid database URL found. Set DATABASE_URL_LOCAL (recommended for local tests) or provide a fully resolved DATABASE_URL.'
  );
};

const connectionString = resolveConnectionString();

const shouldUseSSL = () => {
  if (process.env.PGSSLMODE === 'disable') return false;
  if (process.env.PGSSLMODE === 'require') return true;

  const databaseUrl = connectionString || '';
  if (databaseUrl.includes('railway.app') || databaseUrl.includes('rlwy.net')) return true;

  return process.env.NODE_ENV === 'production';
};

const pool = new Pool({
  connectionString,
  ssl: shouldUseSSL() ? { rejectUnauthorized: false } : false,
});

const query = (text, params) => pool.query(text, params);

const testConnection = async () => {
  await query('SELECT 1');
};

const initDatabase = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS jogadores (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      idade INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS times (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      players JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS rodadas (
      id SERIAL PRIMARY KEY,
      data DATE NOT NULL,
      partidas JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await query('ALTER TABLE jogadores ADD COLUMN IF NOT EXISTS time_id INTEGER REFERENCES times(id) ON DELETE SET NULL;');
  await query('ALTER TABLE jogadores ADD COLUMN IF NOT EXISTS posicao TEXT;');
  await query('ALTER TABLE jogadores ADD COLUMN IF NOT EXISTS valor_mercado TEXT;');
  await query('ALTER TABLE jogadores DROP COLUMN IF EXISTS gols;');
  await query('ALTER TABLE jogadores DROP COLUMN IF EXISTS assistencias;');
  await query('ALTER TABLE jogadores DROP COLUMN IF EXISTS defesas;');
};

module.exports = {
  query,
  testConnection,
  initDatabase,
  resolveConnectionString,
};