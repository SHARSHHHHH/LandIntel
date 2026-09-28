"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/gov/auth-context";
import { ContourField } from "@/components/gov/ContourField";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("policy.user@dolr.gov.in");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/gov/dashboard");
    } catch {
      setError("Incorrect email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-register-navy lg:flex lg:flex-col lg:justify-between">
        <ContourField className="absolute inset-0 h-full w-full text-white/[0.08]" />
        <div className="relative z-10 px-12 pt-14">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">
            Ministry of Rural Development
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/50">
            Department of Land Resources
          </p>
        </div>
        <div className="relative z-10 px-12 pb-14">
          <h1 className="max-w-md font-serif-display text-4xl font-semibold leading-[1.15] text-white">
            A national view of land data, evidence, and geography.
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/65">
            Area / Land Intelligence Overview brings together official records, research,
            and geospatial layers behind one source-linked view — built for the officers
            who plan and evaluate land governance programmes.
          </p>
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-white/15 pt-6 text-white/80">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-white/45">Coverage</dt>
              <dd className="mt-1 font-serif-display text-lg">State → Village</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-white/45">Every value</dt>
              <dd className="mt-1 font-serif-display text-lg">Source-linked</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-white/45">Access</dt>
              <dd className="mt-1 font-serif-display text-lg">Role-gated</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center bg-register-bg px-6 py-16">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 lg:hidden">
            <p className="text-[11px] uppercase tracking-[0.14em] text-register-ink/50">
              Department of Land Resources
            </p>
            <h1 className="mt-1 font-serif-display text-xl font-semibold text-register-navy">
              Area / Land Intelligence Overview
            </h1>
          </div>

          <h2 className="font-serif-display text-2xl font-semibold text-register-navy">Sign in</h2>
          <p className="mt-1.5 text-sm text-register-ink/60">
            For authorised Government &amp; Policy users.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-register-ink/80">Email</span>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-sm border border-register-line bg-white px-3.5 py-2.5 text-sm shadow-card transition-colors focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-register-ink/80">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-sm border border-register-line bg-white px-3.5 py-2.5 text-sm shadow-card transition-colors focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
              />
            </label>

            {error && (
              <p role="alert" className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-sm bg-register-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-register-navy2 focus:outline-none focus:ring-2 focus:ring-register-navy/30 focus:ring-offset-2 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 rounded-sm border border-register-line bg-register-panel px-3.5 py-3 text-xs text-register-ink/60">
            <p className="font-medium text-register-ink/80">Demo credentials</p>
            <p className="mt-0.5">policy.user@dolr.gov.in / ChangeMe123!</p>
            <p className="mt-1 text-register-ink/45">Ships pre-seeded — no setup step needed.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
