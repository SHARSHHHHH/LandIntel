"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/gov", key: "gov", label: "Government / Policy" },
  { href: "/research", key: "research", label: "Researcher / Academic" },
  { href: "/public", key: "public", label: "Public / Citizen" },
  { href: "/admin", key: "admin", label: "Admin" },
] as const;

/**
 * Shared top-level portal switcher, rendered once in the root layout. Now
 * that all three portals run in the same Next.js process, this uses
 * ordinary client-side <Link> navigation (no full page reload needed
 * between portals) and figures out the active tab from the URL itself.
 */
export function GlobalNav({ active: activeOverride }: { active?: "gov" | "research" | "public" | "admin" }) {
  const pathname = usePathname() ?? "/";
  const active =
    activeOverride ??
    (pathname.startsWith("/research")
      ? "research"
      : pathname.startsWith("/public")
        ? "public"
        : pathname.startsWith("/admin")
          ? "admin"
          : "gov");
  return (
    <div className="w-full bg-slate-900 text-white">
      <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 text-sm">
        <span className="mr-3 whitespace-nowrap font-semibold tracking-wide text-slate-300">
          Land Intelligence Platform
        </span>
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
    </div>
  );
}
