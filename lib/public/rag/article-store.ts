import { getDatabase } from "@/lib/public/db";
import { embedText, cosineSimilarity } from "./embeddings";

function ensureTable() {
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS article_embeddings (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      embedding_json TEXT NOT NULL,
      content_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export interface ArticleSearchResult {
  articleId: string;
  score: number;
  title: string;
  source_type: string;
  category: string;
  slug: string;
  matchText: string;
}

export async function indexArticle(articleId: string, content: string): Promise<void> {
  ensureTable();
  const db = getDatabase();
  const embedding = await embedText(content);

  db.prepare("DELETE FROM article_embeddings WHERE article_id = ?").run(articleId);
  db.prepare(
    "INSERT INTO article_embeddings (id, article_id, embedding_json, content_text) VALUES (?, ?, ?, ?)"
  ).run(`emb_${articleId}`, articleId, JSON.stringify(embedding), content);
}

export async function indexAllArticles(): Promise<number> {
  ensureTable();
  const db = getDatabase();

  const articles = db
    .prepare(
      "SELECT id, title, category, source_type, slug, summary_simple, summary_deep, tags FROM public_articles WHERE is_public = 1"
    )
    .all() as any[];

  let indexed = 0;
  for (const a of articles) {
    const tags = JSON.parse(a.tags || "[]").join(" ");
    const contentText = [a.title, a.category, a.source_type, a.summary_simple, a.summary_deep, tags]
      .filter(Boolean)
      .join("\n");
    await indexArticle(a.id, contentText);
    indexed++;
  }

  return indexed;
}

export async function searchArticles(query: string, topK = 5): Promise<ArticleSearchResult[]> {
  ensureTable();
  const db = getDatabase();

  const rows = db
    .prepare(
      "SELECT a.id, a.title, a.source_type, a.category, a.slug, e.embedding_json, e.content_text FROM article_embeddings e JOIN public_articles a ON a.id = e.article_id"
    )
    .all() as any[];

  const queryEmbedding = await embedText(query);
  const results = rows
    .map((r) => ({
      articleId: r.id,
      score: cosineSimilarity(queryEmbedding, JSON.parse(r.embedding_json)),
      title: r.title,
      source_type: r.source_type,
      category: r.category,
      slug: r.slug,
      matchText: r.content_text,
    }))
    .sort((a, b) => b.score - a.score);

  return results.slice(0, topK);
}