import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureAccountSchema, getDatabase, type SqlClient } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function snapshot(sql: SqlClient, userId?: string) {
  const rows = await sql`
    SELECT p.slot, p.user_id, u.display_name, u.username
    FROM figurine_preorders p JOIN app_users u ON u.id = p.user_id
    ORDER BY p.slot ASC
  `;
  return {
    slots: rows.map((row) => ({ slot: Number(row.slot), name: String(row.display_name), username: String(row.username), mine: userId === String(row.user_id) })),
    remaining: Math.max(0, 5 - rows.length)
  };
}

export async function GET() {
  const sql = getDatabase();
  if (!sql) return NextResponse.json({ error: "База данных пока не подключена" }, { status: 503 });
  try {
    await ensureAccountSchema(sql);
    const user = await getCurrentUser(sql);
    return NextResponse.json({ user, ...(await snapshot(sql, user?.id)) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Preorder load failed", error);
    return NextResponse.json({ error: "Не удалось загрузить предзаказы" }, { status: 500 });
  }
}

export async function POST() {
  const sql = getDatabase();
  if (!sql) return NextResponse.json({ error: "База данных пока не подключена" }, { status: 503 });
  try {
    await ensureAccountSchema(sql);
    const user = await getCurrentUser(sql);
    if (!user) return NextResponse.json({ error: "Сначала войдите в аккаунт" }, { status: 401 });
    const existing = await sql`SELECT slot FROM figurine_preorders WHERE user_id = ${user.id} LIMIT 1`;
    if (!existing.length) {
      await sql`
        INSERT INTO figurine_preorders (user_id, slot)
        SELECT ${user.id}, candidate.slot
        FROM generate_series(1, 5) AS candidate(slot)
        WHERE NOT EXISTS (SELECT 1 FROM figurine_preorders p WHERE p.slot = candidate.slot)
        ORDER BY candidate.slot LIMIT 1
        ON CONFLICT DO NOTHING
      `;
    }
    const state = await snapshot(sql, user.id);
    const mine = state.slots.some((slot) => slot.mine);
    if (!mine) return NextResponse.json({ error: "Все пять фигурок уже забронированы", ...state }, { status: 409 });
    return NextResponse.json({ user, ...state });
  } catch (error) {
    console.error("Preorder failed", error);
    return NextResponse.json({ error: "Не удалось оформить предзаказ" }, { status: 500 });
  }
}
