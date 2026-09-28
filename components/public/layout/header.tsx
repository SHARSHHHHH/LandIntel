import Link from "next/link";
import { Sprout, BookOpen, Map as MapIcon, LayoutDashboard, Bell } from "lucide-react";
import { cn } from "@/lib/public/cn";

const NAV = [
  { href: "/public", label: "Home", icon: Sprout },
  { href: "/public/research", label: "Research", icon: BookOpen },
  { href: "/public/atlas", label: "Atlas", icon: MapIcon },
  { href: "/public/dashboards", label: "Dashboards", icon: LayoutDashboard },
  { href: "/public/alerts", label: "Alerts", icon: Bell },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/public" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-land-green text-white">
            <Sprout className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Bhumi<span className="text-land-green">Kosh</span>
          </span>
          <span className="hidden rounded-full bg-land-green/10 px-2 py-0.5 text-[11px] font-medium text-land-green sm:inline">
            भारत ✓
          </span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}