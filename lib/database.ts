import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type SqlClient = NeonQueryFunction<false, false>;

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;
  return connectionString ? neon(connectionString) : null;
}

let accountSchemaReady: Promise<void> | null = null;

export function ensureAccountSchema(sql: SqlClient) {
  if (!accountSchemaReady) {
    accountSchemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS app_users (
          id UUID PRIMARY KEY,
          display_name VARCHAR(50) NOT NULL,
          username VARCHAR(30) NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS app_sessions (
          token_hash CHAR(64) PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS app_sessions_user_id_idx
        ON app_sessions (user_id)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS figurine_preorders (
          user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
          slot SMALLINT NOT NULL UNIQUE CHECK (slot BETWEEN 1 AND 5),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    })().catch((error) => {
      accountSchemaReady = null;
      throw error;
    });
  }
  return accountSchemaReady;
}
