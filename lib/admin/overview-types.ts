export type Provenance = "OFFICIAL" | "SAMPLE" | "DERIVED" | "SEED" | "MIXED";

export type Tone = "navy" | "green" | "teal" | "ochre" | "red";

export interface KpiCard {
  key: string;
  label: string;
  value: string;
  sub: string;
  provenance: Provenance;
  tone: Tone;
}

export interface IssueRow {
  key: string;
  label: string;
  count: number;
  denominator: number;
  unitLabel: string;
  rule: string;
  severity: "alert" | "watch";
}

export interface TrendSplit {
  rising: number;
  stable: number;
  falling: number;
}

export interface StateRow {
  name: string;
  code: string;
  disputes: number;
  trend: "rising" | "stable" | "falling";
  programmes: number;
  researchLinks: number;
  villages: number;
}

export interface ResearchImpact {
  students: number;
  faculty: number;
  scholars: number;
  institutions: string[];
  activeProjects: number;
  outputs: number;
  publishedOutputs: number;
  underReviewOutputs: number;
  draftOutputs: number;
  datasetsLinked: number;
  datasetsTotal: number;
  gisLayers: number;
  questions: number;
  findings: number;
  analyses: number;
  members: number;
  asOf: string | null;
}

export interface SchemeRow {
  name: string;
  department: string;
  launchYear: number | null;
  statusNote: string;
  dataStatus: string;
}

export interface PilotRow {
  title: string;
  status: string;
  institution: string | null;
  scope: string | null;
}

export interface CallRow {
  title: string;
  type: string;
  organizer: string;
  deadline: string | null;
  status: string;
}

export interface SchemesPanelData {
  government: SchemeRow[];
  pilots: PilotRow[];
  calls: CallRow[];
  completed: number;
  policyDocuments: number;
}

export interface AttentionItem {
  key: string;
  title: string;
  detail: string;
  count: number;
  severity: "alert" | "watch";
  href: string;
  action: string;
}

export interface ActivityEvent {
  at: string;
  tag: "RESEARCH" | "GOV" | "ADMIN";
  kind: string;
  text: string;
  href: string | null;
}

export interface OverviewResponse {
  meta: {
    generatedAt: string;
    sourceAsOf: {
      gov: string | null;
      research: string | null;
      public: string | null;
    };
    degraded: string[];
  };
  kpis: KpiCard[];
  issues: IssueRow[];
  trendSplit: TrendSplit;
  trackedStates: number;
  states: StateRow[];
  statesShown: number;
  research: ResearchImpact;
  schemes: SchemesPanelData;
  attention: AttentionItem[];
  activity: ActivityEvent[];
}
