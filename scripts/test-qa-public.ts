import { answerQuestion } from "../lib/public/rag/answer";

async function main() {
  const qs = [
    "Why are land disputes rising in Bihar?",
    "What is ULPIN?",
    "How can satellite imagery help land governance?",
    "Is it easy to check my land records online?",
  ];

  for (const q of qs) {
    console.log("\nQ:", q);
    const a = await answerQuestion(q);
    a.bullets.forEach((b, i) => console.log(`  ${i + 1}. ${b}`));
    console.log("  Sources:", a.sources.map((s) => s.title).join(" | "));
    if (a.metrics.length) console.log("  Metrics:", a.metrics.map((m) => `${m.value} ${m.label}`).join(" | "));
  }
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});