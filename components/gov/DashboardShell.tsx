"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import { useAreaContext } from "./area-context";
import { api } from "@/lib/gov/client";

interface NavItem {
  label: string;
  icon: JSX.Element;
  to: string;
  needsArea?: boolean;
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-[18px] w-[18px] shrink-0">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS = {
  dashboard: <Icon d="M3 10.5 10 4l7 6.5M5 9v7h10V9" />,
  area: <Icon d="M10 2 3 6v8l7 4 7-4V6l-7-4Zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />,
  gis: <Icon d="M3 5.5 7 4l6 2 4-1.5v10L13 16l-6-2-4 1.5v-10ZM7 4v12M13 6v10" />,
  evidence: <Icon d="M5 3h7l3 3v11H5V3Zm7 0v3h3M7.5 10h5M7.5 12.5h5M7.5 15h3" />,
  analytics: <Icon d="M4 16V9M9.5 16V4M15 16v-6" />,
  scenario: <Icon d="M3 15c2-5 4-5 6 0s4 5 6 0M3 15V5M17 15V5" />,
  schemes: <Icon d="M4 4h12v3H4V4Zm0 5h12v7H4V9Zm3 3h2m3 0h2" />,
  workspace: <Icon d="M3 6h5l2 2h7v8H3V6Z" />,
  reports: <Icon d="M6 3h6l3 3v11H6V3Zm6 0v3h3M8.5 9.5h4M8.5 12h4M8.5 14.5h2.5" />,
  notifications: <Icon d="M10 2.5a4 4 0 0 1 4 4v2.8l1.3 3.2H4.7L6 9.3V6.5a4 4 0 0 1 4-4ZM8.3 15a1.7 1.7 0 0 0 3.4 0" />,
  profile: <Icon d="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 7c1-3.3 3.3-5 6-5s5 1.7 6 5" />,
};

export function DashboardShell({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const { selectedArea, clearSelectedArea } = useAreaContext();
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.getDashboardSummary().then((d) => setUnread(d.unread_notification_count)).catch(() => {});
  }, [pathname]);

  const navSections: { label: string; items: NavItem[] }[] = [
    {
      label: "Overview",
      items: [{ label: "Dashboard", icon: ICONS.dashboard, to: "/gov/dashboard" }],
    },
    {
      label: "Land intelligence",
      items: [
        {
          label: "Area Intelligence",
          icon: ICONS.area,
          to: selectedArea ? `/gov/areas/${selectedArea.id}/overview` : "/gov/areas/select",
          needsArea: true,
        },
        {
          label: "GIS & Land Insights",
          icon: ICONS.gis,
          to: selectedArea ? `/gov/areas/${selectedArea.id}/gis` : "/gov/areas/select?next=gis",
          needsArea: true,
        },
        { label: "Evidence & Research", icon: ICONS.evidence, to: "/gov/documents" },
      ],
    },
    {
      label: "Analysis & policy",
      items: [
        { label: "Policy Analytics", icon: ICONS.analytics, to: "/gov/policy-analytics" },
        { label: "Scenario & Decision Support", icon: ICONS.scenario, to: "/gov/scenario" },
        { label: "Projects & Schemes", icon: ICONS.schemes, to: "/gov/schemes" },
      ],
    },
    {
      label: "Collaboration",
      items: [
        { label: "Collaborative Workspace", icon: ICONS.workspace, to: "/gov/workspaces" },
        { label: "Reports & Insights", icon: ICONS.reports, to: "/gov/reports" },
      ],
    },
  ];

  const utilityNav: NavItem[] = [
    { label: "Notifications", icon: ICONS.notifications, to: "/gov/notifications" },
    { label: "Profile & Access", icon: ICONS.profile, to: "/gov/profile" },
  ];

  function isActive(item: NavItem) {
    if (item.needsArea) {
      return pathname.startsWith("/gov/areas/") && pathname.includes(item.to.includes("gis") ? "/gis" : "/overview");
    }
    return pathname === item.to || pathname.startsWith(item.to + "/");
  }

  return (
    <div className="flex min-h-screen bg-register-bg">
      <aside className="flex w-[248px] shrink-0 flex-col border-r border-register-line bg-register-navy text-white">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/50">Department of Land Resources</p>
          <Link href="/gov/dashboard" className="mt-1 block font-serif-display text-base font-semibold leading-tight hover:text-white/90">
            Area &amp; Land Intelligence
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-4">
          {navSections.map((section) => (
            <div key={section.label} className="mb-4 last:mb-0">
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.to}
                      className={`flex items-center gap-2.5 rounded-sm px-3 py-2 text-[13px] transition-colors ${
                        isActive(item) ? "bg-white/12 text-white font-medium" : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {item.icon}
                      <span className="leading-tight">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="my-4 border-t border-white/10" />

          <ul className="space-y-0.5">
            {utilityNav.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.to}
                  className={`flex items-center justify-between gap-2.5 rounded-sm px-3 py-2 text-[13px] transition-colors ${
                    isActive(item) ? "bg-white/12 text-white font-medium" : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    {item.label}
                  </span>
                  {item.label === "Notifications" && unread > 0 && (
                    <span className="rounded-full bg-register-ochre px-1.5 py-0.5 text-[10px] font-semibold text-register-navy">
                      {unread}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {selectedArea && (
          <div className="border-t border-white/10 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-white/40">Current area</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="truncate text-[13px] text-white/90">{selectedArea.name}</span>
              <button
                onClick={() => {
                  clearSelectedArea();
                  router.push("/gov/areas/select");
                }}
                className="shrink-0 text-[11px] text-white/50 hover:text-white/80"
                title="Change area"
              >
                Change
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-white/10 px-4 py-3">
          <button
            onClick={() => {
              logout();
              router.push("/gov/login");
            }}
            className="w-full rounded-sm border border-white/20 px-3 py-1.5 text-[13px] text-white/80 transition-colors hover:border-white/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="h-[3px] shrink-0 bg-register-ochre" aria-hidden="true" />
        <main className="mx-auto w-full max-w-6xl flex-1 px-8 py-8">
          <div key={pathname} className="animate-fade-up">
            {children}
          </div>
        </main>
        <footer className="mx-auto w-full max-w-6xl px-8 pb-8 pt-2 text-xs leading-relaxed text-register-ink/45">
          <div className="border-t border-register-line pt-4">
            This is an integration and evidence-discovery layer. It does not replace authoritative
            government land-record, registration, or judicial systems, and does not establish land
            ownership, legal title, or the outcome of a court case.
          </div>
        </footer>
      </div>
    </div>
  );
}
