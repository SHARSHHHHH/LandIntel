export const RESEARCH_AREAS = [
  "Land Use Policy",
  "Forest & Environment",
  "Urban Planning",
  "Agriculture & Irrigation",
  "Revenue & Registration",
  "Infrastructure",
  "Socioeconomic Research",
  "Disaster & Risk Assessment",
  "Other",
];

export const RESEARCH_TYPES = [
  "Policy Study",
  "Field Survey",
  "Scheme Evaluation",
  "Litigation / Dispute Review",
  "Comparative Analysis",
  "Baseline Assessment",
  "Other",
];

export const VISIBILITY_OPTIONS: { value: "Private" | "Team" | "Public"; label: string; helper: string }[] = [
  { value: "Private", label: "Private", helper: "Only you and members you add can see this workspace." },
  { value: "Team", label: "Team", helper: "Visible to owner and invited members only (default)." },
  { value: "Public", label: "Public", helper: "Any signed-in officer on this platform can view it." },
];

export const MEMBER_ROLES: { value: string; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "researcher", label: "Researcher" },
  { value: "gis_analyst", label: "GIS Analyst" },
  { value: "policy_analyst", label: "Policy Analyst" },
  { value: "reviewer", label: "Reviewer" },
  { value: "viewer", label: "Viewer" },
];

export const ROLE_BADGE_STYLE: Record<string, string> = {
  owner: "border-register-ochre/50 bg-register-ochre/10 text-register-ochre",
  researcher: "border-register-navy/30 bg-register-navy/[0.06] text-register-navy",
  gis_analyst: "border-register-official/40 bg-register-official/[0.08] text-register-official",
  policy_analyst: "border-register-derived/40 bg-register-derived/[0.08] text-register-derived",
  reviewer: "border-register-sample/40 bg-register-sample/[0.08] text-register-sample",
  viewer: "border-register-line bg-register-bg text-register-ink/60",
};

export function roleLabel(role: string): string {
  return MEMBER_ROLES.find((r) => r.value === role)?.label ?? role;
}

export const TASK_STATUSES: { value: "todo" | "in_progress" | "done"; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];
