"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Landmark, FlaskConical, Sprout, ShieldCheck } from "lucide-react";

type Portal = "gov" | "research" | "public";

/**
 * Visual identity for each portal, pulled from the real tokens each portal
 * already uses in production (not invented for this page):
 *  - gov: tailwind.config.ts `register` palette + components/gov/DashboardShell.tsx
 *    (register-navy sidebar, register-bg parchment page, ochre accent, serif
 *    display headings).
 *  - research: components/research/layout/Header.tsx (white header, slate
 *    background/text, blue-600 primary accent, emerald-600 secondary accent).
 *  - public: tailwind `land-green` token + app/globals.css `[data-portal="public"]`
 *    HSL variables + components/public/layout/header.tsx (Sprout mark).
 */
const THEME_BY_ROLE: Record<
  Portal,
  {
    label: string;
    icon: typeof Landmark;
    primary: string;
    primaryForeground: string;
    primaryHover: string;
    accent: string;
    background: string;
    panel: string;
    panelBorder: string;
    text: string;
    subtleText: string;
    fieldBg: string;
    fieldBorder: string;
    heading: string;
    ring: string;
  }
> = {
  gov: {
    label: "Government / Policy",
    icon: Landmark,
    primary: "#152238", // register.navy
    primaryForeground: "#FFFFFF",
    primaryHover: "#22345A", // register.navy2
    accent: "#A8752A", // register.ochre
    background: "#F5EFE3", // register.bg
    panel: "#FFFFFF", // register.panel
    panelBorder: "#E1D3B4", // register.line
    text: "#231F1A", // register.ink
    subtleText: "#6B5D45", // register.historical
    fieldBg: "#FFFFFF",
    fieldBorder: "#E1D3B4",
    heading: "font-serif-display",
    ring: "#A8752A",
  },
  research: {
    label: "Researcher / Academic",
    icon: FlaskConical,
    primary: "#2563EB", // tailwind blue-600, matches Header.tsx focus ring / notification dot
    primaryForeground: "#FFFFFF",
    primaryHover: "#1D4ED8", // blue-700
    accent: "#059669", // emerald-600, matches "Verified Researcher" badge
    background: "#F8FAFC", // slate-50
    panel: "#FFFFFF",
    panelBorder: "#E2E8F0", // slate-200
    text: "#0F172A", // slate-900
    subtleText: "#64748B", // slate-500
    fieldBg: "#F8FAFC",
    fieldBorder: "#E2E8F0",
    heading: "font-sans",
    ring: "#2563EB",
  },
  public: {
    label: "Public / Citizen",
    icon: Sprout,
    primary: "hsl(140 55% 28%)", // land-green DEFAULT
    primaryForeground: "#FFFFFF",
    primaryHover: "hsl(140 55% 22%)",
    accent: "hsl(140 55% 28%)",
    background: "hsl(0 0% 98%)", // [data-portal=public] --background
    panel: "#FFFFFF",
    panelBorder: "hsl(150 15% 88%)", // [data-portal=public] --border
    text: "hsl(150 30% 10%)", // [data-portal=public] --foreground
    subtleText: "hsl(150 10% 45%)",
    fieldBg: "#FFFFFF",
    fieldBorder: "hsl(150 15% 88%)",
    heading: "font-sans",
    ring: "hsl(140 45% 35%)",
  },
};

const NEUTRAL_THEME = {
  label: "Land Intelligence Platform",
  icon: ShieldCheck,
  primary: "#0F172A", // slate-900
  primaryForeground: "#FFFFFF",
  primaryHover: "#1E293B",
  accent: "#334155",
  background: "#F1F5F9", // slate-100
  panel: "#FFFFFF",
  panelBorder: "#E2E8F0",
  text: "#0F172A",
  subtleText: "#64748B",
  fieldBg: "#FFFFFF",
  fieldBorder: "#E2E8F0",
  heading: "font-sans",
  ring: "#334155",
};

const DEMOS: { portal: Portal; title: string; blurb: string }[] = [
  {
    portal: "gov",
    title: "Government / Policy",
    blurb: "Department of Land Resources evidence, GIS, reports and the scenario calculator.",
  },
  {
    portal: "research",
    title: "Researcher / Academic",
    blurb: "Research projects, datasets, GIS layers and the AI research assistant.",
  },
  {
    portal: "public",
    title: "Public / Citizen",
    blurb: "Open, plain-language land data, atlas and dashboards for every citizen.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState<Portal | null>(null);
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState<"PUBLIC" | "RESEARCHER">("PUBLIC");

  // The active theme is whichever portal is currently "selected" - a demo
  // box the user clicked, or (while on the signup tab) the role they picked
  // in the signup form. Nothing selected yet -> neutral platform theme.
  const activePortal: Portal | null =
    selectedPortal ?? (mode === "signup" ? (signupRole === "PUBLIC" ? "public" : "research") : null);
  const theme = activePortal ? THEME_BY_ROLE[activePortal] : NEUTRAL_THEME;
  const ThemeIcon = theme.icon;

  const cssVars = useMemo(
    () =>
      ({
        "--login-primary": theme.primary,
        "--login-primary-fg": theme.primaryForeground,
        "--login-primary-hover": theme.primaryHover,
        "--login-accent": theme.accent,
        "--login-bg": theme.background,
        "--login-panel": theme.panel,
        "--login-panel-border": theme.panelBorder,
        "--login-text": theme.text,
        "--login-subtle": theme.subtleText,
        "--login-field-bg": theme.fieldBg,
        "--login-field-border": theme.fieldBorder,
        "--login-ring": theme.ring,
      }) as React.CSSProperties,
    [theme]
  );

  async function goTo(redirect: string, govToken?: string | null) {
    if (govToken) {
      try {
        localStorage.setItem("land_intel_token", govToken);
      } catch {
        /* ignore */
      }
    }
    router.push(redirect);
  }

  async function handleDemo(portal: Portal) {
    setError(null);
    setSelectedPortal(portal);
    setDemoLoading(portal);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portal }),
      });
      if (!res.ok) throw new Error("Demo login failed.");
      const data = await res.json();
      await goTo(data.redirect, data.govToken);
    } catch {
      setError("Could not start the demo session. Please try again.");
      setDemoLoading(null);
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      await goTo(data.redirect);
    } catch (err: any) {
      setError(err.message || "Incorrect email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          role: signupRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign up failed.");
      await goTo(data.redirect);
    } catch (err: any) {
      setError(err.message || "Could not sign up.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{ ...cssVars, backgroundColor: "var(--login-bg)", color: "var(--login-text)" }}
      className="min-h-screen px-4 py-12 transition-colors duration-500"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <div
            style={{ backgroundColor: "var(--login-primary)", color: "var(--login-primary-fg)" }}
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-colors duration-500"
          >
            <ThemeIcon className="h-6 w-6" />
          </div>
          <p style={{ color: "var(--login-subtle)" }} className="text-xs uppercase tracking-[0.2em] transition-colors duration-500">
            Land Intelligence Platform
          </p>
          <h1
            className={`mt-2 text-3xl font-semibold sm:text-4xl transition-colors duration-500 ${theme.heading}`}
            style={{ color: "var(--login-text)" }}
          >
            {activePortal ? theme.label : "Sign in to continue"}
          </h1>
          <p style={{ color: "var(--login-subtle)" }} className="mx-auto mt-3 max-w-2xl text-sm transition-colors duration-500">
            One account system for all three portals — Government/Policy, Researcher/Academic and
            Public/Citizen. Use a demo account to jump straight in, or sign up for your own.
          </p>
        </div>

        {error && (
          <div className="mx-auto mb-6 max-w-xl rounded-md border border-red-500/40 bg-red-50 px-4 py-2.5 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Demo role picker - small selectable chips, not hero buttons */}
        <div className="mx-auto mb-10 flex max-w-xl flex-wrap items-stretch justify-center gap-2.5">
          {DEMOS.map((d) => {
            const t = THEME_BY_ROLE[d.portal];
            const Icon = t.icon;
            const isSelected = selectedPortal === d.portal;
            return (
              <button
                key={d.portal}
                type="button"
                title={d.blurb}
                onClick={() => handleDemo(d.portal)}
                disabled={demoLoading !== null}
                aria-pressed={isSelected}
                style={
                  isSelected
                    ? { backgroundColor: t.primary, borderColor: t.primary, color: t.primaryForeground }
                    : { borderColor: t.panelBorder, color: t.text, backgroundColor: t.panel }
                }
                className="flex min-w-[132px] flex-col items-center gap-1.5 rounded-lg border px-4 py-3 text-xs font-medium shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <Icon className="h-4 w-4" />
                <span className="text-[11px] font-semibold leading-tight">{d.title}</span>
                <span className="text-[10px] font-normal opacity-80">
                  {demoLoading === d.portal ? "Signing in…" : "Demo login"}
                </span>
              </button>
            );
          })}
        </div>

        <div
          style={{ backgroundColor: "var(--login-panel)", borderColor: "var(--login-panel-border)" }}
          className="mx-auto max-w-md rounded-xl border p-6 shadow-sm transition-colors duration-500"
        >
          <div
            style={{ backgroundColor: "var(--login-bg)" }}
            className="mb-5 flex gap-1 rounded-md p-1 text-sm transition-colors duration-500"
          >
            <button
              type="button"
              id="tab-login"
              onClick={() => setMode("login")}
              style={
                mode === "login"
                  ? { backgroundColor: "var(--login-primary)", color: "var(--login-primary-fg)" }
                  : { color: "var(--login-subtle)" }
              }
              className="flex-1 rounded px-3 py-1.5 font-medium transition-colors duration-300"
            >
              Log in
            </button>
            <button
              type="button"
              id="tab-signup"
              onClick={() => setMode("signup")}
              style={
                mode === "signup"
                  ? { backgroundColor: "var(--login-primary)", color: "var(--login-primary-fg)" }
                  : { color: "var(--login-subtle)" }
              }
              className="flex-1 rounded px-3 py-1.5 font-medium transition-colors duration-300"
            >
              Sign up
            </button>
          </div>

          {mode === "login" ? (
            <form id="login-form" onSubmit={handleLogin} className="space-y-3">
              <label className="block text-sm">
                <span style={{ color: "var(--login-subtle)" }} className="mb-1 block transition-colors duration-500">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{
                    backgroundColor: "var(--login-field-bg)",
                    borderColor: "var(--login-field-border)",
                    color: "var(--login-text)",
                  }}
                  className="w-full rounded-md border px-3 py-2 text-sm transition-colors duration-500 focus:outline-none"
                  onFocus={(e) => (e.currentTarget.style.borderColor = theme.ring)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = theme.fieldBorder)}
                />
              </label>
              <label className="block text-sm">
                <span style={{ color: "var(--login-subtle)" }} className="mb-1 block transition-colors duration-500">
                  Password
                </span>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{
                    backgroundColor: "var(--login-field-bg)",
                    borderColor: "var(--login-field-border)",
                    color: "var(--login-text)",
                  }}
                  className="w-full rounded-md border px-3 py-2 text-sm transition-colors duration-500 focus:outline-none"
                  onFocus={(e) => (e.currentTarget.style.borderColor = theme.ring)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = theme.fieldBorder)}
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: "var(--login-primary)", color: "var(--login-primary-fg)" }}
                className="w-full rounded-md px-3 py-2.5 text-sm font-semibold transition-colors duration-300 hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Signing in…" : "Log in"}
              </button>
              <p style={{ color: "var(--login-subtle)" }} className="text-center text-xs transition-colors duration-500">
                For accounts created with Sign up, above. Demo accounts use the chips above instead.
              </p>
            </form>
          ) : (
            <form id="signup-form" onSubmit={handleSignup} className="space-y-3">
              <label className="block text-sm">
                <span style={{ color: "var(--login-subtle)" }} className="mb-1 block transition-colors duration-500">
                  Name
                </span>
                <input
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  style={{
                    backgroundColor: "var(--login-field-bg)",
                    borderColor: "var(--login-field-border)",
                    color: "var(--login-text)",
                  }}
                  className="w-full rounded-md border px-3 py-2 text-sm transition-colors duration-500 focus:outline-none"
                />
              </label>
              <label className="block text-sm">
                <span style={{ color: "var(--login-subtle)" }} className="mb-1 block transition-colors duration-500">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  style={{
                    backgroundColor: "var(--login-field-bg)",
                    borderColor: "var(--login-field-border)",
                    color: "var(--login-text)",
                  }}
                  className="w-full rounded-md border px-3 py-2 text-sm transition-colors duration-500 focus:outline-none"
                />
              </label>
              <label className="block text-sm">
                <span style={{ color: "var(--login-subtle)" }} className="mb-1 block transition-colors duration-500">
                  Password
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  style={{
                    backgroundColor: "var(--login-field-bg)",
                    borderColor: "var(--login-field-border)",
                    color: "var(--login-text)",
                  }}
                  className="w-full rounded-md border px-3 py-2 text-sm transition-colors duration-500 focus:outline-none"
                />
              </label>
              <label className="block text-sm">
                <span style={{ color: "var(--login-subtle)" }} className="mb-1 block transition-colors duration-500">
                  I am a...
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(["PUBLIC", "RESEARCHER"] as const).map((role) => {
                    const roleTheme = THEME_BY_ROLE[role === "PUBLIC" ? "public" : "research"];
                    const RoleIcon = roleTheme.icon;
                    const isActive = signupRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSignupRole(role)}
                        style={
                          isActive
                            ? { backgroundColor: roleTheme.primary, borderColor: roleTheme.primary, color: roleTheme.primaryForeground }
                            : { borderColor: roleTheme.panelBorder, color: roleTheme.text, backgroundColor: roleTheme.panel }
                        }
                        className="flex items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs font-medium transition-colors duration-300"
                      >
                        <RoleIcon className="h-3.5 w-3.5" />
                        {role === "PUBLIC" ? "Public / Citizen" : "Researcher / Academic"}
                      </button>
                    );
                  })}
                </div>
                <span style={{ color: "var(--login-subtle)" }} className="mt-1 block text-xs transition-colors duration-500">
                  Government/Policy access is restricted to the demo login above — new accounts can&apos;t
                  self-register as a policy official.
                </span>
              </label>
              <button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: "var(--login-primary)", color: "var(--login-primary-fg)" }}
                className="w-full rounded-md px-3 py-2.5 text-sm font-semibold transition-colors duration-300 hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Creating account…" : "Sign up"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
