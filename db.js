import pg from 'pg';
const { Pool } = pg;
export const db = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

export async function migrate() {
  await db.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK(kind IN ('demo','real')), currency TEXT NOT NULL DEFAULT 'USD',
      balance NUMERIC(18,2) NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(user_id,kind)
    );
    CREATE TABLE IF NOT EXISTS payment_events (
      reference TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id), account_id UUID NOT NULL REFERENCES accounts(id),
      direction TEXT NOT NULL CHECK(direction IN ('deposit','withdrawal')), amount NUMERIC(18,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', provider_payload JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), settled_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id), account_id UUID NOT NULL REFERENCES accounts(id),
      broker_order_id TEXT, symbol TEXT NOT NULL, side TEXT NOT NULL CHECK(side IN ('buy','sell')), order_type TEXT NOT NULL,
      amount NUMERIC(18,2) NOT NULL, status TEXT NOT NULL, provider_payload JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS webhook_events (
      event_id TEXT PRIMARY KEY, payload JSONB NOT NULL, received_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}
