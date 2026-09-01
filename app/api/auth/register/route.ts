import { NextResponse } from "next/server";
import { createSession, hashPassword, normalizeUsername, randomUUID, validUsername } from "@/lib/auth";
import { ensureAccountSchema, getDatabase } from "@/lib/database";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const sql = getDatabase();
  if (!sql) return NextResponse.json({ error: "База данных пока не подключена" }, { status: 503 });
  try {
    await ensureAccountSchema(sql);
    const body = await request.json() as { name?: unknown; username?: unknown; password?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const username = normalizeUsername(typeof body.username === "string" ? body.username : "");
    const password = typeof body.password === "string" ? body.password : "";
    if (name.length < 2 || name.length > 50) return NextResponse.json({ error: "Укажите имя от 2 до 50 символов" }, { status: 400 });
    if (!validUsername(username)) return NextResponse.json({ error: "Логин: 3–30 букв, цифр, точек, дефисов или подчёркиваний" }, { status: 400 });
    if (password.length < 8 || password.length > 128) return NextResponse.json({ error: "Пароль должен содержать от 8 до 128 символов" }, { status: 400 });
    const id = randomUUID();
    await sql`INSERT INTO app_users (id, display_name, username, password_hash) VALUES (${id}, ${name}, ${username}, ${await hashPassword(password)})`;
    await createSession(sql, id);
    return NextResponse.json({ user: { id, name, username } }, { status: 201 });
  } catch (error) {
    if (String(error).includes("app_users_username_key")) return NextResponse.json({ error: "Этот логин уже занят" }, { status: 409 });
    console.error("Registration failed", error);
    return NextResponse.json({ error: "Не удалось создать аккаунт" }, { status: 500 });
  }
}
