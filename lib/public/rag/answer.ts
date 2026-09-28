import { randomUUID } from "crypto";
import { getDatabase } from "@/lib/public/db";
import { searchArticles } from "./article-store";

export interface QAAnswer {
  question: string;
  bullets: string[];
  sourceCount: number;
  sources: {
    slug: string;
    title: string;
    source_type: string;
    category: string;
    summary: string;
  }[];
  metrics: { label: string; value: string; context: string }[];
}

function normalizeQ(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 300);
}

function getCached(q: string): QAAnswer | null {
  const db = getDatabase();
  const row = db.prepare("SELECT answer FROM qa_cache WHERE question = ?").get(normalizeQ(q)) as any;
  if (!row) return null;
  try {
    return JSON.parse(row.answer) as QAAnswer;
  } catch {
    return null;
  }
}

function setCached(q: string, answer: QAAnswer): void {
  const db = getDatabase();
  db.prepare("INSERT OR REPLACE INTO qa_cache (id, question, answer) VALUES (?, ?, ?)").run(
    `qa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    normalizeQ(q),
    JSON.stringify(answer)
  );
}

function matchMetrics(question: string) {
  const db = getDatabase();
  const q = question.toLowerCase();
  const rows = db
    .prepare("SELECT label, value, context, keywords FROM national_metrics")
    .all() as any[];

  return rows
    .filter((r) => {
      try {
        const kws = JSON.parse(r.keywords || "[]") as string[];
        return kws.some((k) => q.includes(k.toLowerCase()));
      } catch {
        return false;
      }
    })
    .map((r) => ({ label: r.label, value: r.value, context: r.context }));
}

export async function answerQuestion(question: string): Promise<QAAnswer> {
  const cached = getCached(question);
  if (cached) return cached;

  const hits = await searchArticles(question, 4);
  const metrics = matchMetrics(question);

  const db = getDatabase();

  const bullets: string[] = [];
  const sources: QAAnswer["sources"] = [];

  for (const hit of hits) {
    const article = db
      .prepare(
        "SELECT slug, title, source_type, category, summary_easy, takeaways FROM public_articles WHERE id = ?"
      )
      .get(hit.articleId) as any;
    if (!article) continue;

    let takeaways: string[] = [];
    try {
      takeaways = JSON.parse(article.takeaways || "[]");
    } catch {
      takeaways = [];
    }

    for (const t of takeaways) {
      if (bullets.length >= 3) break;
      if (!bullets.includes(t)) bullets.push(t);
    }

    let easy: string[] = [];
    try {
      easy = JSON.parse(article.summary_easy || "[]");
    } catch {
      easy = [];
    }

    if (bullets.length < 3) {
      for (const e of easy) {
        if (bullets.length >= 3) break;
        if (!bullets.includes(e)) bullets.push(e);
      }
    }

    sources.push({
      slug: article.slug,
      title: article.title,
      source_type: article.source_type,
      category: article.category,
      summary: takeaways[0] || easy[0] || article.title,
    });
  }

  if (bullets.length === 0) {
    bullets.push(
      "We do not have a direct answer for this question yet. Try asking about land records, disputes, ULPIN, maps, climate, or urbanisation.",
      "You can also browse the research library for papers and policies.",
      "The Atlas shows state-by-state land data for every state in India."
    );
  }

  while (bullets.length < 3 && bullets.length > 0) {
    bullets.push(sources[bullets.length]?.summary || "See the sources below for the full answer.");
  }

  const answer: QAAnswer = {
    question: question.trim().slice(0, 300),
    bullets: bullets.slice(0, 3),
    sourceCount: sources.length,
    sources,
    metrics,
  };

  setCached(question, answer);
  return answer;
}

export function clearQACache(): void {
  const db = getDatabase();
  db.prepare("DELETE FROM qa_cache").run();
}