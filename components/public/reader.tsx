"use client";

import { useState, useCallback, useEffect } from "react";
import { Volume2, Square, Gauge } from "lucide-react";
import { cn } from "@/lib/public/cn";

export interface ArticleData {
  slug: string;
  title: string;
  source_type: string;
  category: string;
  organization?: string;
  year?: number;
  tags: string[];
  summary_easy: string[];
  summary_simple: string;
  summary_deep: string;
  key_stats: { label: string; value: string; context: string }[];
  takeaways: string[];
  content_doc?: string;
}

type Level = "easy" | "simple" | "deep";

export function Reader({ article }: { article: ArticleData }) {
  const [level, setLevel] = useState<Level>("easy");
  const [speaking, setSpeaking] = useState(false);

  const textFor = useCallback(
    (lvl: Level): string => {
      if (lvl === "easy") return article.summary_easy.join(". ") + ".";
      if (lvl === "simple") return article.summary_simple;
      return article.summary_deep;
    },
    [article]
  );

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  const speak = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    stop();
    const utterance = new SpeechSynthesisUtterance(textFor(level));
    utterance.rate = 0.95;
    utterance.lang = "en-IN";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [level, textFor, stop]);

  useEffect(() => stop, [stop]);

  const levelMeta: Record<Level, { label: string; hint: string }> = {
    easy: { label: "Easy", hint: "Short, simple words" },
    simple: { label: "Simple", hint: "A clear paragraph" },
    deep: { label: "Deep", hint: "Full detail with numbers" },
  };

  return (
    <article className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-full bg-secondary px-2 py-1">
          <Gauge className="h-4 w-4 text-land-green" />
          {(["easy", "simple", "deep"] as Level[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                if (speaking) stop();
                setLevel(lvl);
              }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition",
                level === lvl ? "bg-land-green text-white" : "text-muted-foreground hover:bg-secondary"
              )}
            >
              {levelMeta[lvl].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">{levelMeta[level].hint}</span>
          <button
            onClick={speaking ? stop : speak}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition",
              speaking ? "bg-destructive text-white" : "bg-land-green text-white hover:bg-land-green-dark"
            )}
          >
            {speaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {speaking ? "Stop" : "Listen"}
          </button>
        </div>
      </div>

      <div className="mt-6 min-h-[120px] text-[17px] leading-relaxed text-foreground/90">
        {level === "easy" ? (
          <ul className="space-y-3">
            {article.summary_easy.map((point, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-land-green/10 text-xs font-bold text-land-green">
                  {i + 1}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>{textFor(level)}</p>
        )}
      </div>

      {article.key_stats.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {article.key_stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-land-green/5 p-3">
              <p className="text-lg font-extrabold text-land-green">{s.value}</p>
              <p className="text-xs font-semibold">{s.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{s.context}</p>
            </div>
          ))}
        </div>
      )}

      {article.takeaways.length > 0 && (
        <div className="mt-6 rounded-xl border-l-4 border-land-green bg-land-green/5 p-4">
          <p className="text-sm font-bold text-land-green">Takeaways</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {article.takeaways.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-land-green">✓</span> {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {article.content_doc && (
        <div className="mt-6 border-t pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Full document (deep level)
          </p>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/80">
            {article.content_doc}
          </pre>
        </div>
      )}
    </article>
  );
}