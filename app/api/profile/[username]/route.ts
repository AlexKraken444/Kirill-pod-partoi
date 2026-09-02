import { NextResponse } from "next/server";
import { getCurrentUser, isVerificationAdmin, normalizeUsername, validUsername } from "@/lib/auth";
import { ensureAccountSchema, getDatabase } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ username: string }> };

export async function GET(_request: Request, { params }: Context) {
  const sql = getDatabase();
  if (!sql) return NextResponse.json({ error: "База данных пока не подключена" }, { status: 503 });
  try {
    await ensureAccountSchema(sql);
    const username = normalizeUsername(decodeURIComponent((await params).username));
    if (!validUsername(username)) return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
    const [rows, viewer] = await Promise.all([
      sql`SELECT id, display_name, username, bio, avatar_data, verified, created_at FROM app_users WHERE username = ${username} LIMIT 1`,
      getCurrentUser(sql)
    ]);
    if (!rows.length) return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
    const row = rows[0];
    return NextResponse.json({
      profile: {
        name: String(row.display_name), username: String(row.username), bio: String(row.bio || ""),
        avatar: row.avatar_data ? String(row.avatar_data) : null,
        createdAt: new Date(row.created_at as string | Date).toISOString(),
        isOwn: viewer?.id === String(row.id), verified: Boolean(row.verified),
        canManageVerification: Boolean(viewer && isVerificationAdmin(viewer.username))
      }
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Profile load failed", error);
    return NextResponse.json({ error: "Не удалось загрузить профиль" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const sql = getDatabase();
  if (!sql) return NextResponse.json({ error: "База данных пока не подключена" }, { status: 503 });
  try {
    await ensureAccountSchema(sql);
    const user = await getCurrentUser(sql);
    if (!user) return NextResponse.json({ error: "Сначала войдите в аккаунт" }, { status: 401 });
    if (!isVerificationAdmin(user.username)) return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    const username = normalizeUsername(decodeURIComponent((await params).username));
    const body = await request.json() as { verified?: unknown };
    if (typeof body.verified !== "boolean") return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
    const rows = await sql`UPDATE app_users SET verified = ${body.verified} WHERE username = ${username} RETURNING id`;
    if (!rows.length) return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
    return NextResponse.json({ verified: body.verified });
  } catch (error) {
    console.error("Verification update failed", error);
    return NextResponse.json({ error: "Не удалось изменить галочку" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Context) {
  const sql = getDatabase();
  if (!sql) return NextResponse.json({ error: "База данных пока не подключена" }, { status: 503 });
  try {
    await ensureAccountSchema(sql);
    const user = await getCurrentUser(sql);
    const username = normalizeUsername(decodeURIComponent((await params).username));
    if (!user) return NextResponse.json({ error: "Сначала войдите в аккаунт" }, { status: 401 });
    if (user.username !== username) return NextResponse.json({ error: "Нельзя изменять чужой профиль" }, { status: 403 });
    const body = await request.json() as { bio?: unknown; avatar?: unknown };
    const bio = typeof body.bio === "string" ? body.bio.trim() : "";
    const avatar = body.avatar === null ? null : typeof body.avatar === "string" ? body.avatar : undefined;
    if (bio.length > 500) return NextResponse.json({ error: "Описание не может быть длиннее 500 символов" }, { status: 400 });
    if (avatar !== undefined && avatar !== null && (!/^data:image\/(?:png|jpeg|webp);base64,/i.test(avatar) || avatar.length > 700000)) {
      return NextResponse.json({ error: "Аватар должен быть изображением размером до 500 КБ" }, { status: 400 });
    }
    await sql`UPDATE app_users SET bio = ${bio}, avatar_data = ${avatar === undefined ? user.avatar : avatar} WHERE id = ${user.id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Profile update failed", error);
    return NextResponse.json({ error: "Не удалось сохранить профиль" }, { status: 500 });
  }
}
