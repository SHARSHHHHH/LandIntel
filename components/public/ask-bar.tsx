"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

const SUGGESTIONS = [
  "Why are land disputes rising in Bihar?",
  "What is ULPIN?",
  "Is it easy to check my land records online?",
  "How does urbanisation change land use?",
  "What is SVAMITVA?",
];

export function AskBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query || loading) return;
    setLoading(true);
    router.push(`/public/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div>
      <form
        onSubmit={submit}
        className={`relative flex items-center rounded-2xl border-2 border-land-green/30 bg-card shadow-lg focus-within:border-land-green ${
          compact ? "max-w-xl" : "max-w-2xl"
        }`}
      >
        <Search className="ml-4 h-5 w-5 shrink-0 text-land-green" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask anything about land in India…"
          className="w-full bg-transparent px-3 py-3.5 text-base outline-none placeholder:text-muted-foreground"
          aria-label="Ask about land"
        />
        <button
          type="submit"
          disabled={loading || !q.trim()}
          className="mr-2 flex items-center gap-1.5 rounded-xl bg-land-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-land-green-dark disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Ask</span>}
        </button>
      </form>

      {!compact && (
        <div className="mt-3 flex flex-wrap gap-2 max-w-2xl">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => router.push(`/public/search?q=${encodeURIComponent(s)}`)}
              className="rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-land-green/10 hover:text-land-green"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}