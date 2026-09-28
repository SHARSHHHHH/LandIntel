"use client";

import { useEffect, useState, FormEvent } from "react";
import { BellRing, CheckCircle2, Loader2, Mail } from "lucide-react";
import { BASE_PATH } from "@/lib/public/base-path";

interface Topic { id: string; category: string; label: string; }

export default function AlertsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [stateName, setStateName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(BASE_PATH + "/api/public/alerts/topics")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setTopics(d.data.topics);
        setStates(d.data.states);
      });
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setStatus("loading");
    const res = await fetch(BASE_PATH + "/api/public/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, category, state_name: stateName || undefined }),
    });
    const data = await res.json();
    if (data.success) {
      setStatus("done");
      setEmail("");
      setCategory("");
      setStateName("");
    } else {
      setStatus("error");
      setMessage(data.error || "Could not subscribe.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-land-green/10 text-land-green">
          <BellRing className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Land Topic Alerts</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Get a short digest whenever new research, policies or data are published for the topics and places you care about.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        {status === "done" ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <p className="mt-3 text-lg font-bold">You&apos;re subscribed!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ll email your digest when new content lands.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-land-green"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">Topic you care about</label>
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCategory(t.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      category === t.id
                        ? "border-land-green bg-land-green text-white"
                        : "border-border bg-background text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">State (optional — national if blank)</label>
              <select
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-land-green"
              >
                <option value="">All India</option>
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!email || !category || status === "loading"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-land-green py-3 text-sm font-bold text-white transition hover:bg-land-green-dark disabled:opacity-50"
            >
              {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
              Subscribe
            </button>

            {status === "error" && <p className="text-center text-sm font-medium text-red-600">{message}</p>}
          </form>
        )}
      </div>
    </div>
  );
}