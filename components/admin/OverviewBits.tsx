import type { Provenance, Tone } from "@/lib/admin/overview-types";

export const toneAccent: Record<Tone, string> = {
  navy: "border-l-register-navy",
  green: "border-l-[#1F4D3A]",
  teal: "border-l-[#17605E]",
  ochre: "border-l-register-ochre",
  red: "border-l-[#9A2B2B]",
};

export const provenanceStyle: Record<Provenance, string> = {
  OFFICIAL: "border-[#1F4D3A]/50 text-[#1F4D3A] bg-[#1F4D3A]/5",
  SAMPLE: "border-register-ochre/60 text-[#8A6516] bg-register-ochre/10",
  DERIVED: "border-[#17605E]/50 text-[#17605E] bg-[#17605E]/5",
  SEED: "border-register-line text-register-ink/55 bg-register-ink/[0.03]",
  MIXED: "border-register-navy/40 text-register-navy bg-register-navy/5",
};

export function ProvenanceChip({ value, className = "" }: { value: Provenance; className?: string }) {
  return (
    <span
      className={`inline-flex items-center border px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-[0.1em] ${provenanceStyle[value]} ${className}`}
    >
      {value}
    </span>
  );
}

export function SectionHeading({
  index,
  title,
  hint,
  right,
}: {
  index: string;
  title: string;
  hint?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline gap-3">
      <span className="text-[10px] font-bold tabular-nums tracking-[0.18em] text-register-ochre">{index}</span>
      <h3 className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.14em] text-register-ink">{title}</h3>
      <span className="h-px min-w-6 flex-1 bg-register-line" />
      {hint && <span className="hidden text-[10px] text-register-ink/45 sm:block">{hint}</span>}
      {right}
    </div>
  );
}

export function Meter({
  fraction,
  tone = "navy",
  className = "",
}: {
  fraction: number;
  tone?: "navy" | "green" | "teal" | "ochre" | "red";
  className?: string;
}) {
  const bar =
    tone === "red"
      ? "bg-[#9A2B2B]"
      : tone === "ochre"
        ? "bg-register-ochre"
        : tone === "teal"
          ? "bg-[#17605E]"
          : tone === "green"
            ? "bg-[#1F4D3A]"
            : "bg-register-navy";
  const width = Math.max(2, Math.round(Math.min(1, Math.max(0, fraction)) * 100));
  return (
    <div className={`h-1.5 w-full bg-register-ink/10 ${className}`}>
      <div className={`h-full ${bar}`} style={{ width: `${width}%` }} />
    </div>
  );
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-IN");
}

export function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDateOnly(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
