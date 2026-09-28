import { indexAllArticles } from "../src/lib/rag/article-store";
import { getDatabase } from "../src/lib/db";

async function main() {
  console.log("[RAG] Starting article indexing...");

  const db = getDatabase();
  const count = (db.prepare("SELECT COUNT(*) as c FROM public_articles").get() as any).c;
  console.log(`[RAG] Found ${count} public articles`);

  const indexed = await indexAllArticles();
  console.log(`[RAG] Indexed ${indexed} article embeddings`);

  const total = (db.prepare("SELECT COUNT(*) as c FROM article_embeddings").get() as any).c;
  console.log(`[RAG] Total embeddings in vector store: ${total}`);
}

main().catch((e) => {
  console.error("[RAG] Indexing failed:", e);
  process.exit(1);
});