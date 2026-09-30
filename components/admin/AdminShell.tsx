"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, KeyRound, ScrollText } from "lucide-react";
import { useAuth } from "@/components/gov/auth-context";
import { RequireAuth } from "@/components/gov/RequireAuth";

interface NavItem {
  label: string;
  icon: ReactNode;
  to: string;
  exact?: boolean;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { logout } = useAuth();

  const navItems: NavItem[] = [
    { label: "Overview", icon: <LayoutDashboard className="h-4 w-4" />, to: "/admin", exact: true },
    { label: "Users", icon: <Users className="h-4 w-4" />, to: "/admin/users" },
    { label: "Roles & permissions", icon: <KeyRound className="h-4 w-4" />, to: "/admin/roles" },
    { label: "Audit log", icon: <ScrollText className="h-4 w-4" />, to: "/admin/audit" },
  ];

  function isActive(item: NavItem) {
    return item.exact ? pathname === item.to : pathname.startsWith(item.to);
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-register-bg">
        <aside className="flex w-[248px] shrink-0 flex-col border-r border-register-line bg-register-navy text-white">
          <div className="border-b border-white/10 px-5 py-5">
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/50">
              Department of Land Resources
            </p>
            <Link
              href="/admin"
              className="mt-1 block font-serif-display text-base font-semibold leading-tight hover:text-white/90"
            >
              Administration
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto px-2.5 py-4">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
              Portal administration
            </p>
            <ul className="space-y-0.5">
              {navItems.map((item) => (
                <li key={item.to}>
                  <Link
                    href={item.to}
                    className={`flex items-center gap-2.5 rounded-sm px-3 py-2 text-[13px] transition-colors ${
                      isActive(item)
                        ? "bg-white/12 text-white font-medium"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.icon}
                    <span className="leading-tight">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-white/10 px-4 py-3">
            <button
              type="button"
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
              Administrative actions on this portal are recorded in the audit log.
            </div>
          </footer>
        </div>
      </div>
    </RequireAuth>
  );
}
