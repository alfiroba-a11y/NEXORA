import pg from 'pg';
const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not configured. In Render, link it to your Render Postgres internal connection string.');
}
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
    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id),
      amount NUMERIC(18,2) NOT NULL, method TEXT NOT NULL CHECK(method IN ('mpesa','trc20')),
      destination TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'processing', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS withdrawal_method TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS withdrawal_destination TEXT;
    CREATE TABLE IF NOT EXISTS demo_trade_activity (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      contract_type TEXT NOT NULL, result TEXT NOT NULL, amount NUMERIC(18,2) NOT NULL,
      label TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS demo_trade_activity_user_created_idx ON demo_trade_activity(user_id, created_at DESC);
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      preferences JSONB NOT NULL DEFAULT '{}'::jsonb, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS deriv_oauth_states (
      state TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_verifier TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS deriv_connections (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      encrypted_access_token TEXT NOT NULL, connected_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}
