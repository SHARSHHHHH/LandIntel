"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  { href: "/gov", key: "gov", label: "Government / Policy" },
  { href: "/research", key: "research", label: "Researcher / Academic" },
  { href: "/public", key: "public", label: "Public / Citizen" },
] as const;

const ROLE_LABEL: Record<string, string> = {
  GOV: "Government / Policy",
  RESEARCHER: "Researcher / Academic",
  PUBLIC: "Public / Citizen",
};

interface SessionUser {
  email: string;
  name: string;
  role: string;
  kind: "demo" | "account";
}

/**
 * Shared top-level portal switcher, rendered once in the root layout. Now
 * that all three portals run in the same Next.js process, this uses
 * ordinary client-side <Link> navigation (no full page reload needed
 * between portals) and figures out the active tab from the URL itself.
 *
 * It also shows who is currently logged in (from the central /login system)
 * and offers a logout / switch-account action.
 */
export function GlobalNav({ active: activeOverride }: { active?: "gov" | "research" | "public" }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const active =
    activeOverride ??
    (pathname.startsWith("/research")
      ? "research"
      : pathname.startsWith("/public")
        ? "public"
        : pathname.startsWith("/gov")
          ? "gov"
          : null);

  if (pathname === "/login") return null;

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      try {
        localStorage.removeItem("land_intel_token");
      } catch {
        /* ignore */
      }
      router.push("/login");
    }
  }

  return (
    <div className="w-full bg-slate-900 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-2 text-sm">
        <span className="mr-3 whitespace-nowrap font-semibold tracking-wide text-slate-300">
          Land Intelligence Platform
        </span>
        <div className="flex items-center gap-1">
          {TABS.map((tab) => {
            const isActive = tab.key === active;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={
                  "whitespace-nowrap rounded px-3 py-1.5 font-medium transition-colors " +
                  (isActive
                    ? "bg-white text-slate-900"
                    : "text-slate-200 hover:bg-slate-700")
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2 whitespace-nowrap text-xs sm:flex-nowrap">
          {user === undefined ? null : user === null ? (
            <Link href="/login" className="rounded px-3 py-1.5 font-medium text-slate-200 hover:bg-slate-700">
              Log in
            </Link>
          ) : (
            <>
              <span className="hidden text-slate-300 sm:inline">
                Signed in as <span className="font-semibold text-white">{user.name}</span>
                {" · "}
                {ROLE_LABEL[user.role] ?? user.role}
                {user.kind === "demo" ? " (demo)" : ""}
              </span>
              <button
                onClick={handleLogout}
                className="rounded bg-slate-700 px-3 py-1.5 font-medium text-white transition-colors hover:bg-slate-600"
              >
                Log out / switch account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
