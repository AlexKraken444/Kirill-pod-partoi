import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";
import { getDatabase } from "@/lib/database";

export async function POST() {
  await clearSession(getDatabase());
  return NextResponse.json({ ok: true });
}
