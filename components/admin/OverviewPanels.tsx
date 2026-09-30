import {
  Building2,
  CircleDot,
  Database,
  FileText,
  FolderKanban,
  GraduationCap,
  Landmark,
  Layers,
  Sparkles,
} from "lucide-react";
import type { IssueRow, ResearchImpact, SchemesPanelData } from "@/lib/admin/overview-types";
import { Meter, ProvenanceChip, formatDateOnly, formatNumber } from "@/components/admin/OverviewBits";

export function IssueMonitor({ issues, trackedStates }: { issues: IssueRow[]; trackedStates: number }) {
  return (
    <div className="h-full border border-register-line bg-register-panel shadow-card">
      <div className="border-b border-register-line px-4 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-register-ink/50">
          Issue rules · transparent thresholds
        </span>
      </div>
      <div className="divide-y divide-register-line/70">
        {issues.map((issue) => (
          <div key={issue.key} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-[13px] font-semibold text-register-ink">{issue.label}</p>
              <p className="shrink-0 text-[12.5px] font-bold tabular-nums text-register-navy">
                {formatNumber(issue.count)}
                <span className="font-normal text-register-ink/45">
                  {" / "}
                  {formatNumber(issue.denominator)} {issue.unitLabel}
                </span>
              </p>
            </div>
            <div className="mt-1.5">
              <Meter
                fraction={issue.denominator ? issue.count / issue.denominator : 0}
                tone={issue.severity === "alert" ? "red" : "ochre"}
              />
            </div>
            <p className="mt-1.5 font-mono text-[9.5px] leading-tight text-register-ink/45">rule: {issue.rule}</p>
          </div>
        ))}
        {issues.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-register-ink/50">No issue rules currently trigger.</p>
        )}
      </div>
      <p className="border-t border-register-line px-4 py-2.5 text-[10px] text-register-ink/50">
        Denominators: {trackedStates} tracked states (public portal sample) and registered data sources (gov seed).
        Thresholds are derived platform rules, not official risk classifications.
      </p>
    </div>
  );
}

function ImpactTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border border-register-line bg-register-panel px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-register-ink/50">
        {icon}
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em]">{label}</span>
      </div>
      <p className="mt-1.5 font-serif-display text-xl font-semibold tabular-nums text-register-navy">{value}</p>
      {sub && <p className="mt-0.5 truncate text-[10px] text-register-ink/50">{sub}</p>}
    </div>
  );
}

export function ResearchImpactPanel({ impact }: { impact: ResearchImpact }) {
  return (
    <div className="flex h-full flex-col border border-register-line bg-register-panel shadow-card">
      <div className="flex items-center justify-between border-b border-register-line px-4 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-register-ink/50">
          Student & research impact
        </span>
        <ProvenanceChip value="SAMPLE" />
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
        <ImpactTile
          icon={<GraduationCap className="h-3.5 w-3.5" />}
          label="Researchers"
          value={formatNumber(impact.students)}
          sub={`${impact.faculty} faculty · ${impact.scholars} scholars`}
        />
        <ImpactTile
          icon={<Building2 className="h-3.5 w-3.5" />}
          label="Institutions"
          value={formatNumber(impact.institutions.length)}
          sub={impact.institutions[0] ? impact.institutions[0].split(" - ")[0] : "—"}
        />
        <ImpactTile
          icon={<FolderKanban className="h-3.5 w-3.5" />}
          label="Active projects"
          value={formatNumber(impact.activeProjects)}
          sub={`${formatNumber(impact.members)} member assignments`}
        />
        <ImpactTile
          icon={<FileText className="h-3.5 w-3.5" />}
          label="Outputs"
          value={formatNumber(impact.outputs)}
          sub={`${impact.publishedOutputs} published · ${impact.underReviewOutputs} in review`}
        />
        <ImpactTile
          icon={<Database className="h-3.5 w-3.5" />}
          label="Datasets used"
          value={`${formatNumber(impact.datasetsLinked)}/${formatNumber(impact.datasetsTotal)}`}
          sub="linked into projects"
        />
        <ImpactTile
          icon={<Layers className="h-3.5 w-3.5" />}
          label="GIS activity"
          value={formatNumber(impact.gisLayers)}
          sub="layers catalogued"
        />
      </div>

      <div className="mt-auto border-t border-register-line px-4 py-2.5">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-register-ink/60">
          <span className="inline-flex items-center gap-1">
            <CircleDot className="h-3 w-3" /> {impact.questions} research questions
          </span>
          <span className="inline-flex items-center gap-1">
            <CircleDot className="h-3 w-3" /> {impact.analyses} analyses
          </span>
          <span className="inline-flex items-center gap-1">
            <CircleDot className="h-3 w-3" /> {impact.findings} findings
          </span>
        </div>
        <p className="mt-1.5 text-[10px] leading-snug text-register-ink/45">
          Single seed snapshot ({formatDateOnly(impact.asOf)}) — no historical series exists in the dataset, so no
          trend line is shown. All figures are sample (demo) research records.
        </p>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const upper = status.toUpperCase();
  const cls =
    upper === "OPEN" || upper === "ACTIVE" || upper === "PUBLISHED"
      ? "border-[#1F4D3A]/45 bg-[#1F4D3A]/5 text-[#1F4D3A]"
      : upper === "UNDER_REVIEW" || upper === "SUBMITTED"
        ? "border-register-ochre/60 bg-register-ochre/10 text-[#8A6516]"
        : "border-register-line bg-register-ink/[0.03] text-register-ink/60";
  return (
    <span className={`border px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-[0.08em] ${cls}`}>{upper}</span>
  );
}

export function SchemesPanel({ data }: { data: SchemesPanelData }) {
  return (
    <div className="border border-register-line bg-register-panel shadow-card">
      <div className="grid grid-cols-1 divide-y divide-register-line lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Landmark className="h-4 w-4 text-[#1F4D3A]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-register-ink/55">
              Government schemes / interventions
            </span>
            <ProvenanceChip value="OFFICIAL" className="ml-auto" />
          </div>
          <div className="space-y-2.5">
            {data.government.map((scheme) => (
              <div key={scheme.name} className="border border-register-line border-l-2 border-l-[#1F4D3A] px-3 py-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-[13px] font-semibold leading-snug text-register-ink">{scheme.name}</p>
                  <span className="text-[10.5px] font-semibold tabular-nums text-register-ink/50">
                    {scheme.launchYear ?? "—"}
                  </span>
                </div>
                <p className="mt-0.5 text-[10.5px] text-register-ink/55">{scheme.department}</p>
                <p className="mt-1.5 text-[11px] leading-snug text-register-ink/70">{scheme.statusNote}</p>
              </div>
            ))}
            {data.government.length === 0 && (
              <p className="text-sm text-register-ink/50">No scheme records in the Gov database.</p>
            )}
          </div>
          <p className="mt-3 border-t border-register-line pt-2 text-[10.5px] text-register-ink/55">
            Completed initiatives recorded: <span className="font-semibold tabular-nums">{data.completed}</span>
            {" · "}
            Policy documents on file:{" "}
            <span className="font-semibold tabular-nums">{data.policyDocuments}</span>
          </p>
        </div>

        <div className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#17605E]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-register-ink/55">
              Research pilots & innovation calls
            </span>
            <ProvenanceChip value="SAMPLE" className="ml-auto" />
          </div>

          <div className="space-y-2">
            {data.pilots.map((pilot) => (
              <div key={pilot.title} className="border border-register-line border-l-2 border-l-[#17605E] px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold leading-snug text-register-ink">{pilot.title}</p>
                  <StatusChip status={pilot.status} />
                </div>
                <p className="mt-0.5 text-[10.5px] text-register-ink/55">
                  {pilot.institution ?? "Institution not recorded"}
                  {pilot.scope ? ` · ${pilot.scope}` : ""}
                </p>
              </div>
            ))}
            {data.pilots.length === 0 && (
              <p className="text-sm text-register-ink/50">No active research pilots.</p>
            )}
          </div>

          <div className="mt-3 space-y-1.5 border-t border-register-line pt-2.5">
            {data.calls.map((call) => (
              <div key={call.title} className="flex items-start justify-between gap-3 py-0.5">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-register-ink">{call.title}</p>
                  <p className="truncate text-[10px] text-register-ink/50">
                    {call.type} · {call.organizer} · deadline {formatDateOnly(call.deadline)}
                  </p>
                </div>
                <StatusChip status={call.status} />
              </div>
            ))}
            {data.calls.length === 0 && <p className="text-sm text-register-ink/50">No innovation calls listed.</p>}
          </div>
        </div>
      </div>
      <p className="border-t border-register-line px-4 py-2.5 text-[10px] text-register-ink/50">
        Schemes are official (gov seed) records. Pilots and innovation calls are demo research-platform content.
      </p>
    </div>
  );
}
