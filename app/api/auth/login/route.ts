import { NextResponse } from "next/server";
import { createSession, normalizeUsername, verifyPassword } from "@/lib/auth";
import { ensureAccountSchema, getDatabase } from "@/lib/database";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const sql = getDatabase();
  if (!sql) return NextResponse.json({ error: "База данных пока не подключена" }, { status: 503 });
  try {
    await ensureAccountSchema(sql);
    const body = await request.json() as { username?: unknown; password?: unknown };
    const username = normalizeUsername(typeof body.username === "string" ? body.username : "");
    const password = typeof body.password === "string" ? body.password : "";
    const rows = await sql`SELECT id, display_name, username, password_hash FROM app_users WHERE username = ${username} LIMIT 1`;
    if (!rows.length || !(await verifyPassword(password, String(rows[0].password_hash)))) {
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }
    await createSession(sql, String(rows[0].id));
    return NextResponse.json({ user: { id: String(rows[0].id), name: String(rows[0].display_name), username: String(rows[0].username) } });
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "Не удалось войти" }, { status: 500 });
  }
}
