import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { ensureAccountSchema, getDatabase, type SqlClient } from "./database";

const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = "kirill_session";
const SESSION_DAYS = 30;
const VERIFICATION_ADMIN = "yahz";

export type AccountUser = { id: string; name: string; username: string; avatar: string | null; verified: boolean };

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const result = await scrypt(password, salt, 64) as Buffer;
  return `${salt.toString("hex")}:${result.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const result = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length) as Buffer;
  return expected.length === result.length && timingSafeEqual(expected, result);
}

export async function createSession(sql: SqlClient, userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await sql`
    INSERT INTO app_sessions (token_hash, user_id, expires_at)
    VALUES (${hashToken(token)}, ${userId}, ${expiresAt.toISOString()})
  `;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export async function clearSession(sql?: SqlClient | null) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && sql) await sql`DELETE FROM app_sessions WHERE token_hash = ${hashToken(token)}`;
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(sql = getDatabase()): Promise<AccountUser | null> {
  if (!sql) return null;
  await ensureAccountSchema(sql);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await sql`
    SELECT u.id, u.display_name, u.username, u.avatar_data, u.verified
    FROM app_sessions s
    JOIN app_users u ON u.id = s.user_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > NOW()
    LIMIT 1
  `;
  if (!rows.length) return null;
  return { id: String(rows[0].id), name: String(rows[0].display_name), username: String(rows[0].username), avatar: rows[0].avatar_data ? String(rows[0].avatar_data) : null, verified: Boolean(rows[0].verified) };
}

export function normalizeUsername(value: string) {
  return value.trim().toLocaleLowerCase("ru-RU");
}

export function validUsername(value: string) {
  return /^[a-zа-яё0-9._-]{3,30}$/iu.test(value);
}

export function isVerificationAdmin(value: string) {
  return normalizeUsername(value) === VERIFICATION_ADMIN;
}

export { randomUUID };
