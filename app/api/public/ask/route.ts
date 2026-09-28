import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/public/rag/answer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = (body?.question || "").trim();

    if (!question) {
      return NextResponse.json({ success: false, error: "Question required" }, { status: 400 });
    }
    if (question.length > 300) {
      return NextResponse.json({ success: false, error: "Question too long" }, { status: 400 });
    }

    const answer = await answerQuestion(question);

    return NextResponse.json({ success: true, data: { answer } });
  } catch (e) {
    console.error("[ask] failed:", e);
    return NextResponse.json({ success: false, error: "AI assistant unavailable" }, { status: 500 });
  }
}