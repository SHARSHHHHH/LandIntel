import { pipeline, env } from "@xenova/transformers";

env.allowLocalModels = true;
env.cacheDir = "./data/models";

let embedder: any = null;

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";
export const EMBEDDING_DIM = 384;

export async function getEmbedder() {
  if (embedder) return embedder;

  console.log("[RAG] Loading embedding model:", MODEL_NAME);
  embedder = await pipeline("feature-extraction", MODEL_NAME);
  console.log("[RAG] Embedding model loaded");
  return embedder;
}

export async function embedText(text: string): Promise<number[]> {
  const model = await getEmbedder();
  const output = await model(text, {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(output.data) as number[];
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const model = await getEmbedder();
  const results: number[][] = [];

  for (const text of texts) {
    const output = await model(text, {
      pooling: "mean",
      normalize: true,
    });
    results.push(Array.from(output.data) as number[]);
  }

  return results;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}