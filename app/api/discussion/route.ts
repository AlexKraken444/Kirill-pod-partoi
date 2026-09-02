import { createHash, randomUUID } from "node:crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SqlClient = NeonQueryFunction<false, false>;
let schemaReady: Promise<void> | null = null;

function getDatabase() {
  const connectionString = process.env.DATABASE_URL;
  return connectionString ? neon(connectionString) : null;
}

function ensureSchema(sql: SqlClient) {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS discussion_posts (
          id UUID PRIMARY KEY,
          parent_id UUID REFERENCES discussion_posts(id) ON DELETE CASCADE,
          name VARCHAR(40) NOT NULL,
          body VARCHAR(800) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          client_hash VARCHAR(64) NOT NULL
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS discussion_posts_created_at_idx
        ON discussion_posts (created_at DESC)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS discussion_posts_parent_id_idx
        ON discussion_posts (parent_id)
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

function databaseUnavailable() {
  return NextResponse.json({ error: "Discussion database is not configured" }, { status: 503 });
}

export async function GET() {
  const sql = getDatabase();
  if (!sql) return databaseUnavailable();

  try {
    await ensureSchema(sql);
    const rows = await sql`
      SELECT id, parent_id, name, body, created_at
      FROM discussion_posts
      ORDER BY created_at ASC
      LIMIT 300
    `;

    const posts = rows.map((row) => ({
      id: String(row.id),
      parentId: row.parent_id ? String(row.parent_id) : null,
      name: String(row.name),
      text: String(row.body),
      createdAt: new Date(row.created_at as string | Date).toISOString()
    }));

    return NextResponse.json({ posts }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to load discussion", error);
    return NextResponse.json({ error: "Failed to load discussion" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const sql = getDatabase();
  if (!sql) return databaseUnavailable();

  try {
    await ensureSchema(sql);
    const user = await getCurrentUser(sql);
    const payload = await request.json() as { name?: unknown; text?: unknown; parentId?: unknown; website?: unknown };
    if (payload.website) return NextResponse.json({ ok: true }, { status: 201 });

    if (!user) return NextResponse.json({ error: "Сначала зарегистрируйтесь или войдите" }, { status: 401 });
    const name = user.name;
    const text = typeof payload.text === "string" ? payload.text.trim() : "";
    const parentId = typeof payload.parentId === "string" && payload.parentId ? payload.parentId : null;

    if (!name || name.length > 40 || !text || text.length > 800) {
      return NextResponse.json({ error: "Некорректное имя или текст" }, { status: 400 });
    }
    if (parentId && !/^[0-9a-f-]{36}$/i.test(parentId)) {
      return NextResponse.json({ error: "Некорректный ответ" }, { status: 400 });
    }

    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const clientHash = createHash("sha256")
      .update(`${process.env.DISCUSSION_SALT || "kirill-discussion"}:${forwardedFor}`)
      .digest("hex");
    const recent = await sql`
      SELECT COUNT(*)::int AS count
      FROM discussion_posts
      WHERE client_hash = ${clientHash}
        AND created_at > NOW() - INTERVAL '1 minute'
    `;
    if (Number(recent[0]?.count || 0) >= 5) {
      return NextResponse.json({ error: "Слишком много сообщений. Попробуйте через минуту." }, { status: 429 });
    }

    if (parentId) {
      const parent = await sql`
        SELECT id FROM discussion_posts
        WHERE id = ${parentId} AND parent_id IS NULL
        LIMIT 1
      `;
      if (!parent.length) return NextResponse.json({ error: "Публикация не найдена" }, { status: 404 });
    }

    const id = randomUUID();
    const inserted = await sql`
      INSERT INTO discussion_posts (id, parent_id, name, body, client_hash)
      VALUES (${id}, ${parentId}, ${name}, ${text}, ${clientHash})
      RETURNING id, parent_id, name, body, created_at
    `;
    const post = inserted[0];

    return NextResponse.json({
      post: {
        id: String(post.id),
        parentId: post.parent_id ? String(post.parent_id) : null,
        name: String(post.name),
        text: String(post.body),
        createdAt: new Date(post.created_at as string | Date).toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create discussion post", error);
    return NextResponse.json({ error: "Не удалось отправить сообщение" }, { status: 500 });
  }
}
