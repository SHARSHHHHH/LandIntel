import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  KeyRound,
  LayoutDashboard,
  ScrollText,
  TriangleAlert,
  Users,
} from "lucide-react";
import type { ActivityEvent, AttentionItem } from "@/lib/admin/overview-types";
import { formatWhen } from "@/components/admin/OverviewBits";

export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  return (
    <div className="h-full border border-register-line bg-register-panel shadow-card">
      <div className="flex items-center justify-between border-b border-register-line px-4 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-register-ink/50">
          Requires attention
        </span>
        <span className="text-[10px] tabular-nums text-register-ink/45">{items.length} open</span>
      </div>
      <div className="divide-y divide-register-line/70">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-register-ink/[0.02]"
          >
            <span
              className={`mt-0.5 shrink-0 ${
                item.severity === "alert" ? "text-[#9A2B2B]" : "text-register-ochre"
              }`}
            >
              {item.severity === "alert" ? (
                <TriangleAlert className="h-4 w-4" />
              ) : (
                <Clock3 className="h-4 w-4" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="truncate text-[13px] font-semibold text-register-ink">{item.title}</span>
                <span className="shrink-0 text-[11.5px] font-bold tabular-nums text-register-navy">
                  {item.count}
                </span>
              </span>
              <span className="mt-0.5 block line-clamp-2 text-[11px] leading-snug text-register-ink/55">
                {item.detail}
              </span>
            </span>
            <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-[10.5px] font-semibold text-register-navy opacity-70 transition-opacity group-hover:opacity-100">
              {item.action} <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
        {items.length === 0 && (
          <div className="flex items-center gap-2 px-4 py-6 text-sm text-register-ink/55">
            <span className="h-2 w-2 rounded-full bg-[#1F4D3A]" />
            No open attention items — all issue rules currently within threshold.
          </div>
        )}
      </div>
    </div>
  );
}

const tagStyle: Record<ActivityEvent["tag"], string> = {
  RESEARCH: "border-[#17605E]/40 bg-[#17605E]/5 text-[#17605E]",
  GOV: "border-[#1F4D3A]/40 bg-[#1F4D3A]/5 text-[#1F4D3A]",
  ADMIN: "border-register-ochre/60 bg-register-ochre/10 text-[#8A6516]",
};

export function RecentActivity({ events }: { events: ActivityEvent[] }) {
  const inner = (
    <ol className="divide-y divide-register-line/70">
      {events.map((event, i) => (
        <li key={`${event.at}-${i}`} className="flex items-start gap-3 px-4 py-2.5">
          <span className={`mt-0.5 shrink-0 border px-1.5 py-[1px] text-[9px] font-bold tracking-[0.06em] ${tagStyle[event.tag]}`}>
            {event.tag}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] text-register-ink">{event.text}</span>
            <span className="mt-0.5 block text-[10px] uppercase tracking-[0.06em] text-register-ink/45">
              {event.kind} · {formatWhen(event.at)}
            </span>
          </span>
        </li>
      ))}
      {events.length === 0 && (
        <li className="px-4 py-6 text-center text-sm text-register-ink/50">
          No recorded mutations yet — mutation audit events appear here (view events are excluded).
        </li>
      )}
    </ol>
  );

  return (
    <div className="h-full border border-register-line bg-register-panel shadow-card">
      <div className="border-b border-register-line px-4 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-register-ink/50">
          Recent activity · mutations only
        </span>
      </div>
      {events.length > 0 ? (
        <Link href="/admin/audit" className="group block">
          <div className="transition-opacity group-hover:opacity-80">{inner}</div>
          <div className="border-t border-register-line px-4 py-2 text-[10.5px] font-semibold text-register-navy">
            Open full audit log →
          </div>
        </Link>
      ) : (
        inner
      )}
    </div>
  );
}

const quickLinks = [
  {
    href: "/admin/users",
    icon: Users,
    title: "Users & access",
    desc: "Invite, verify, suspend platform accounts",
  },
  {
    href: "/admin/roles",
    icon: KeyRound,
    title: "Roles & permissions",
    desc: "Assign roles, review permission grants",
  },
  {
    href: "/admin/audit",
    icon: ScrollText,
    title: "Audit log",
    desc: "Full mutation history with filters",
  },
  {
    href: "/gov/dashboard",
    icon: LayoutDashboard,
    title: "Gov portal dashboard",
    desc: "Open the government operations view",
  },
];

export function QuickAdminNav() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {quickLinks.map(({ href, icon: Icon, title, desc }) => (
        <Link
          key={href}
          href={href}
          className="group flex items-center gap-3 border border-register-line bg-register-panel px-4 py-3 shadow-card transition-colors hover:border-register-navy/50 hover:bg-register-navy/[0.03]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-register-line bg-register-ink/[0.03] text-register-navy transition-colors group-hover:border-register-navy/40">
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-register-ink">{title}</span>
            <span className="block truncate text-[11px] text-register-ink/55">{desc}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-register-ink/35 transition-transform group-hover:translate-x-0.5 group-hover:text-register-navy" />
        </Link>
      ))}
    </div>
  );
}
