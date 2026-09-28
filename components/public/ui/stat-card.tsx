import { ReactNode } from "react";
import { cn } from "@/lib/public/cn";

export function StatCard({
  label,
  value,
  context,
  emphasis = false,
  className,
}: {
  label: string;
  value: string;
  context?: string;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-md",
        emphasis && "border-land-green/40 bg-land-green/5",
        className
      )}
    >
      <p className="text-2xl font-extrabold tracking-tight text-land-green">{value}</p>
      <p className="mt-1 text-sm font-semibold">{label}</p>
      {context ? <p className="mt-0.5 text-xs text-muted-foreground">{context}</p> : null}
    </div>
  );
}

export function Pill({ children, active, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition",
        active
          ? "border-land-green bg-land-green text-white"
          : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function Takeaway({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border-l-4 border-land-green bg-land-green/5 px-4 py-3">
      <p className="text-sm font-medium">
        <span className="mr-1.5 font-bold text-land-green">Key takeaway ·</span>
        {children}
      </p>
    </div>
  );
}