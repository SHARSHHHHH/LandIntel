import type { DataStatus } from "@/lib/gov/types";

const CONFIG: Record<DataStatus, { label: string; color: string; dot: string; explanation: string }> = {
  OFFICIAL: {
    label: "Official",
    color: "text-register-official border-register-official/40 bg-register-official/[0.07]",
    dot: "bg-register-official",
    explanation: "Sourced directly from a verified government system or publication.",
  },
  SAMPLE: {
    label: "Sample",
    color: "text-register-sample border-register-sample/40 bg-register-sample/[0.08]",
    dot: "bg-register-sample",
    explanation: "Demonstration data only, standing in until a verified live source is connected.",
  },
  DERIVED: {
    label: "Derived",
    color: "text-register-derived border-register-derived/40 bg-register-derived/[0.07]",
    dot: "bg-register-derived",
    explanation: "Calculated from one or more source datasets using a documented method.",
  },
  HISTORICAL: {
    label: "Historical",
    color: "text-register-historical border-register-historical/40 bg-register-historical/[0.08]",
    dot: "bg-register-historical",
    explanation: "A real, verified value from a past reference period -- not current.",
  },
};

export function DataStatusBadge({ status, className = "" }: { status: DataStatus; className?: string }) {
  const cfg = CONFIG[status];
  return (
    <span
      role="status"
      title={cfg.explanation}
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium tracking-wide ${cfg.color} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

export function DataStatusLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-register-ink/70">
      {(Object.keys(CONFIG) as DataStatus[]).map((status) => (
        <div key={status} className="flex items-center gap-1.5">
          <DataStatusBadge status={status} />
          <span>{CONFIG[status].explanation}</span>
        </div>
      ))}
    </div>
  );
}
