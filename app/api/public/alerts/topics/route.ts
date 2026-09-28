import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/public/db";

export async function GET() {
  const db = getDatabase();

  const topics = db
    .prepare("SELECT id, category, label, state_name FROM alert_topics")
    .all() as any[];

  const states = db
    .prepare("SELECT state_name FROM public_state_stats ORDER BY state_name")
    .all() as any[];

  return NextResponse.json({
    success: true,
    data: {
      topics: topics.map((t) => ({ id: t.id, category: t.category, label: t.label })),
      states: states.map((s) => s.state_name),
    },
  });
}