import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { getDatabase } from "@/lib/public/db";

const subscribeSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  category: z.string().min(1, "Choose a topic"),
  state_name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = subscribeSchema.parse(body);

    const db = getDatabase();
    db.prepare(
      "INSERT INTO public_subscriptions (id, email, category, state_name) VALUES (?, ?, ?, ?)"
    ).run(
      randomUUID(),
      validated.email.toLowerCase(),
      validated.category,
      validated.state_name || null
    );

    return NextResponse.json({
      success: true,
      data: { message: "Subscription added. Digest emails will start soon." },
    });
  } catch (e: any) {
    if (e?.errors) {
      return NextResponse.json({ success: false, error: e.errors[0]?.message || "Validation failed" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Could not subscribe" }, { status: 500 });
  }
}