import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";
import { getDatabase as getGovDatabase } from "@/lib/gov/db";
import { getDatabase as getResearchDatabase } from "@/lib/research/db";
import { getDatabase as getPublicDatabase } from "@/lib/public/db";
import type {
  ActivityEvent,
  AttentionItem,
  IssueRow,
  KpiCard,
  OverviewResponse,
  StateRow,
} from "@/lib/admin/overview-types";

const fmt = (n: number) => n.toLocaleString("en-IN");

function isoMax(values: Array<string | null | undefined>): string | null {
  let best: string | null = null;
  for (const v of values) {
    if (v && (!best || v > best)) best = v;
  }
  return best;
}

export async function GET(req: NextRequest) {
  try {
    requirePermission(req, "view_audit_logs");

    const degraded: string[] = [];

    // ---------------------------------------------------------------- GOV.DB
    let govStates = 0;
    let govDistricts = 0;
    let govDatasets = 0;
    let govSources = 0;
    let govSourcesUnconfigured = 0;
    let govPolicyDocuments = 0;
    let govSchemes: Array<{ name: string; department: string; launch_year: number | null; status_note: string; data_status: string }> = [];
    let govLatest: string | null = null;

    try {
      const db = getGovDatabase();
      govStates = (db.prepare("SELECT COUNT(*) c FROM geographic_units WHERE level = 'state'").get() as { c: number }).c;
      govDistricts = (db.prepare("SELECT COUNT(*) c FROM geographic_units WHERE level = 'district'").get() as { c: number }).c;
      govDatasets = (db.prepare("SELECT COUNT(*) c FROM datasets").get() as { c: number }).c;
      govSources = (db.prepare("SELECT COUNT(*) c FROM data_sources").get() as { c: number }).c;
      govSourcesUnconfigured = (db.prepare("SELECT COUNT(*) c FROM data_sources WHERE status = 'unconfigured'").get() as { c: number }).c;
      govPolicyDocuments = (db.prepare("SELECT COUNT(*) c FROM documents WHERE document_type = 'policy'").get() as { c: number }).c;
      govSchemes = db
        .prepare("SELECT name, department, launch_year, status_note, data_status FROM schemes ORDER BY launch_year DESC")
        .all() as Array<{ name: string; department: string; launch_year: number | null; status_note: string; data_status: string }>;
      govLatest = isoMax([
        (db.prepare("SELECT MAX(created_at) m FROM audit_logs").get() as { m: string | null }).m,
        (db.prepare("SELECT MAX(created_at) m FROM schemes").get() as { m: string | null }).m,
        (db.prepare("SELECT MAX(created_at) m FROM documents").get() as { m: string | null }).m,
        (db.prepare("SELECT MAX(created_at) m FROM datasets").get() as { m: string | null }).m,
      ]);
    } catch {
      degraded.push("gov");
    }

    // ------------------------------------------------------------- PUBLIC.DB
    interface PublicStatRow {
      state_name: string;
      state_code: string;
      disputes_total: number;
      disputes_trend: string;
      urbanshare_pct: number;
      agri_pct: number;
      climate_vulnerability: number;
      projects_active: number;
      villages_total: number;
    }
    let publicStats: PublicStatRow[] = [];

    try {
      const db = getPublicDatabase();
      publicStats = db
        .prepare(
          "SELECT state_name, state_code, disputes_total, disputes_trend, urbanshare_pct, agri_pct, climate_vulnerability, projects_active, villages_total FROM public_state_stats ORDER BY disputes_total DESC"
        )
        .all() as PublicStatRow[];
    } catch {
      degraded.push("public");
    }

    // ----------------------------------------------------------- RESEARCH.DB
    interface CountRow {
      c: number;
    }
    let researchUsers = 0;
    let researchFaculty = 0;
    let researchScholars = 0;
    let researchInstitutions: string[] = [];
    let researchActiveProjects = 0;
    let researchOutputs = 0;
    let researchPublished = 0;
    let researchUnderReview = 0;
    let researchDrafts = 0;
    let researchDatasets = 0;
    let researchDatasetsVerified = 0;
    let researchDatasetsLinked = 0;
    let researchGisLayers = 0;
    let researchQuestions = 0;
    let researchFindings = 0;
    let researchAnalyses = 0;
    let researchMembers = 0;
    let researchProfilesUnverified = 0;
    let researchSubmissionsSubmitted = 0;
    let researchCallsUnderReview = 0;
    let researchPilots: Array<{ title: string; status: string; institution: string | null; scope: string | null }> = [];
    let researchCalls: Array<{ title: string; type: string; organizer: string; deadline: string | null; status: string }> = [];
    let researchScopes: string[] = [];
    let researchLatest: string | null = null;
    let researchUnderReviewTitles: string[] = [];
    let researchDraftTitles: string[] = [];
    let researchDatasetNames: string[] = [];

    try {
      const db = getResearchDatabase();
      researchUsers = (db.prepare("SELECT COUNT(*) c FROM users").get() as CountRow).c;
      researchFaculty = (db.prepare("SELECT COUNT(*) c FROM research_profiles WHERE academic_type = 'FACULTY'").get() as CountRow).c;
      researchScholars = (db.prepare("SELECT COUNT(*) c FROM research_profiles WHERE academic_type = 'RESEARCH_SCHOLAR'").get() as CountRow).c;
      researchInstitutions = (db.prepare("SELECT DISTINCT institution FROM research_profiles WHERE institution IS NOT NULL").all() as Array<{ institution: string }>).map(
        (r) => r.institution
      );
      researchActiveProjects = (db.prepare("SELECT COUNT(*) c FROM research_projects WHERE status = 'ACTIVE'").get() as CountRow).c;
      researchOutputs = (db.prepare("SELECT COUNT(*) c FROM research_outputs").get() as CountRow).c;
      researchPublished = (db.prepare("SELECT COUNT(*) c FROM research_outputs WHERE review_status = 'PUBLISHED'").get() as CountRow).c;
      researchUnderReview = (db.prepare("SELECT COUNT(*) c FROM research_outputs WHERE review_status = 'UNDER_REVIEW'").get() as CountRow).c;
      researchDrafts = (db.prepare("SELECT COUNT(*) c FROM research_outputs WHERE review_status = 'DRAFT'").get() as CountRow).c;
      researchUnderReviewTitles = (db.prepare("SELECT title FROM research_outputs WHERE review_status = 'UNDER_REVIEW' ORDER BY created_at DESC").all() as Array<{ title: string }>).map(
        (r) => r.title
      );
      researchDraftTitles = (db.prepare("SELECT title FROM research_outputs WHERE review_status = 'DRAFT' ORDER BY created_at DESC").all() as Array<{ title: string }>).map(
        (r) => r.title
      );
      researchDatasets = (db.prepare("SELECT COUNT(*) c FROM datasets").get() as CountRow).c;
      researchDatasetsVerified = (db.prepare("SELECT COUNT(*) c FROM datasets WHERE quality_status = 'VERIFIED'").get() as CountRow).c;
      researchDatasetNames = (db.prepare("SELECT name FROM datasets WHERE quality_status <> 'VERIFIED'").all() as Array<{ name: string }>).map((r) => r.name);
      researchDatasetsLinked = (db.prepare("SELECT COUNT(*) c FROM project_datasets").get() as CountRow).c;
      researchGisLayers = (db.prepare("SELECT COUNT(*) c FROM gis_layers").get() as CountRow).c;
      researchQuestions = (db.prepare("SELECT COUNT(*) c FROM research_questions").get() as CountRow).c;
      researchFindings = (db.prepare("SELECT COUNT(*) c FROM findings").get() as CountRow).c;
      researchAnalyses = (db.prepare("SELECT COUNT(*) c FROM analyses").get() as CountRow).c;
      researchMembers = (db.prepare("SELECT COUNT(*) c FROM project_members").get() as CountRow).c;
      researchProfilesUnverified = (db.prepare("SELECT COUNT(*) c FROM research_profiles WHERE verification_status IS NOT 1").get() as CountRow).c;
      researchSubmissionsSubmitted = (db.prepare("SELECT COUNT(*) c FROM innovation_submissions WHERE status = 'SUBMITTED'").get() as CountRow).c;
      researchCallsUnderReview = (db.prepare("SELECT COUNT(*) c FROM innovation_opportunities WHERE status = 'UNDER_REVIEW'").get() as CountRow).c;
      const rawPilots = db
        .prepare("SELECT title, status, institution, geographic_scope FROM research_projects ORDER BY created_at DESC")
        .all() as Array<{ title: string; status: string; institution: string | null; geographic_scope: string | null }>;
      researchPilots = rawPilots.map((p) => ({ title: p.title, status: p.status, institution: p.institution, scope: p.geographic_scope }));
      researchCalls = db
        .prepare("SELECT title, type, organizer, deadline, status FROM innovation_opportunities ORDER BY deadline")
        .all() as Array<{ title: string; type: string; organizer: string; deadline: string | null; status: string }>;
      const scopeRows = [
        ...(db.prepare("SELECT state AS s FROM research_resources WHERE state IS NOT NULL").all() as Array<{ s: string }>),
        ...(db.prepare("SELECT state AS s FROM gis_layers WHERE state IS NOT NULL").all() as Array<{ s: string }>),
        ...(db.prepare("SELECT geographic_scope AS s FROM research_projects WHERE geographic_scope IS NOT NULL").all() as Array<{ s: string }>),
        ...(db.prepare("SELECT geographic_scope AS s FROM datasets WHERE geographic_scope IS NOT NULL").all() as Array<{ s: string }>),
      ];
      researchScopes = scopeRows.map((r) => r.s);
      researchLatest = isoMax([
        (db.prepare("SELECT MAX(created_at) m FROM research_projects").get() as { m: string | null }).m,
        (db.prepare("SELECT MAX(created_at) m FROM research_outputs").get() as { m: string | null }).m,
        (db.prepare("SELECT MAX(created_at) m FROM datasets").get() as { m: string | null }).m,
        (db.prepare("SELECT MAX(created_at) m FROM gis_layers").get() as { m: string | null }).m,
        (db.prepare("SELECT MAX(created_at) m FROM innovation_submissions").get() as { m: string | null }).m,
        (db.prepare("SELECT MAX(created_at) m FROM innovation_opportunities").get() as { m: string | null }).m,
      ]);
    } catch {
      degraded.push("research");
    }

    // ----------------------------------------------------------- DERIVATIONS
    const trackedStates = publicStats.length;
    const matchesResearch = (stateName: string) =>
      researchScopes.some((s) => s !== "All India" && s.toLowerCase().includes(stateName.toLowerCase()));

    const flagRising = publicStats.filter((s) => s.disputes_trend === "rising");
    const flagUrban = publicStats.filter((s) => s.urbanshare_pct >= 40);
    const flagAgri = publicStats.filter((s) => s.agri_pct >= 70);
    const flagClimate = publicStats.filter((s) => s.climate_vulnerability >= 60);
    const flaggedStates = publicStats.filter(
      (s) =>
        s.disputes_trend === "rising" ||
        s.urbanshare_pct >= 40 ||
        s.agri_pct >= 70 ||
        s.climate_vulnerability >= 60
    ).length;
    const risingWithoutResearch = flagRising.filter((s) => !matchesResearch(s.state_name));

    const issues: IssueRow[] = [];
    if (trackedStates > 0) {
      issues.push(
        {
          key: "disputes",
          label: "Land disputes rising",
          count: flagRising.length,
          denominator: trackedStates,
          unitLabel: "states",
          rule: "public_state_stats.disputes_trend = 'rising'",
          severity: "alert",
        },
        {
          key: "urban",
          label: "Urban expansion pressure",
          count: flagUrban.length,
          denominator: trackedStates,
          unitLabel: "states",
          rule: "urbanshare_pct ≥ 40%",
          severity: "watch",
        },
        {
          key: "agri",
          label: "Agricultural land pressure",
          count: flagAgri.length,
          denominator: trackedStates,
          unitLabel: "states",
          rule: "agri_pct ≥ 70% of area",
          severity: "watch",
        },
        {
          key: "climate",
          label: "High climate / land vulnerability",
          count: flagClimate.length,
          denominator: trackedStates,
          unitLabel: "states",
          rule: "climate_vulnerability ≥ 60",
          severity: "watch",
        }
      );
      if (flagRising.length > 0) {
        issues.push({
          key: "hotspot-research-gap",
          label: "Dispute hotspots without research linkage",
          count: risingWithoutResearch.length,
          denominator: flagRising.length,
          unitLabel: "hotspot states",
          rule: "rising-dispute states with no linked research record",
          severity: "alert",
        });
      }
    }
    if (govSources > 0 && govSourcesUnconfigured > 0) {
      issues.push({
        key: "source-gap",
        label: "Unconfigured data sources",
        count: govSourcesUnconfigured,
        denominator: govSources,
        unitLabel: "sources",
        rule: "gov data_sources.status = 'unconfigured'",
        severity: "watch",
      });
    }

    const trendSplit = {
      rising: publicStats.filter((s) => s.disputes_trend === "rising").length,
      stable: publicStats.filter((s) => s.disputes_trend === "stable").length,
      falling: publicStats.filter((s) => s.disputes_trend === "falling").length,
    };

    const STATES_SHOWN = 8;
    const states: StateRow[] = publicStats.slice(0, STATES_SHOWN).map((s) => ({
      name: s.state_name,
      code: s.state_code,
      disputes: s.disputes_total,
      trend: (s.disputes_trend === "rising" || s.disputes_trend === "falling" ? s.disputes_trend : "stable") as StateRow["trend"],
      programmes: s.projects_active,
      researchLinks: researchScopes.filter((scope) => scope !== "All India" && scope.toLowerCase().includes(s.state_name.toLowerCase())).length,
      villages: s.villages_total,
    }));

    // ------------------------------------------------------------- KPIS
    const kpis: KpiCard[] = [
      {
        key: "states",
        label: "States / regions monitored",
        value: fmt(govStates),
        sub: `${fmt(govDistricts)} districts mapped with indicator series`,
        provenance: "SEED",
        tone: "navy",
      },
      {
        key: "issues",
        label: "Land-governance issue signals",
        value: fmt(flaggedStates),
        sub: `of ${fmt(trackedStates)} tracked states trip ≥1 rule`,
        provenance: "DERIVED",
        tone: "red",
      },
      {
        key: "students",
        label: "Students / researchers",
        value: fmt(researchUsers),
        sub: `${researchFaculty} faculty · ${researchScholars} research scholars`,
        provenance: "SAMPLE",
        tone: "teal",
      },
      {
        key: "schemes",
        label: "Active schemes / interventions",
        value: fmt(govSchemes.length),
        sub: "central-sector land programmes on record",
        provenance: "OFFICIAL",
        tone: "green",
      },
      {
        key: "projects",
        label: "Active research projects",
        value: fmt(researchActiveProjects),
        sub: "academic pilots running on the platform",
        provenance: "SAMPLE",
        tone: "teal",
      },
      {
        key: "outputs",
        label: "Research outputs",
        value: fmt(researchOutputs),
        sub: `${researchPublished} published · ${researchUnderReview} in review · ${researchDrafts} draft`,
        provenance: "SAMPLE",
        tone: "teal",
      },
      {
        key: "attention",
        label: "Pending reviews / attention",
        value: "0",
        sub: "derived from platform records",
        provenance: "DERIVED",
        tone: "ochre",
      },
      {
        key: "datasets",
        label: "Datasets & sources",
        value: "0",
        sub: "catalogue coverage",
        provenance: "MIXED",
        tone: "navy",
      },
    ];

    // ----------------------------------------------------------- ATTENTION
    const attention: AttentionItem[] = [];
    if (researchUnderReview > 0) {
      attention.push({
        key: "outputs-review",
        title: "Research outputs awaiting review",
        detail: researchUnderReviewTitles.slice(0, 2).join(" · ") || "review_status = UNDER_REVIEW",
        count: researchUnderReview,
        severity: "alert",
        href: "/research/outputs",
        action: "Review outputs",
      });
    }
    if (researchDrafts > 0) {
      attention.push({
        key: "outputs-draft",
        title: "Draft outputs not yet submitted",
        detail: researchDraftTitles.slice(0, 2).join(" · ") || "review_status = DRAFT",
        count: researchDrafts,
        severity: "watch",
        href: "/research/outputs",
        action: "Open outputs",
      });
    }
    if (researchDatasets > researchDatasetsVerified) {
      attention.push({
        key: "datasets-verify",
        title: "Datasets requiring verification",
        detail: researchDatasetNames.join(" · ") || "quality_status ≠ VERIFIED",
        count: researchDatasets - researchDatasetsVerified,
        severity: "watch",
        href: "/research/datasets",
        action: "Verify datasets",
      });
    }
    if (researchSubmissionsSubmitted > 0) {
      attention.push({
        key: "submissions",
        title: "Innovation submissions needing triage",
        detail: "status = SUBMITTED",
        count: researchSubmissionsSubmitted,
        severity: "alert",
        href: "/research/innovation",
        action: "Triage submissions",
      });
    }
    if (researchCallsUnderReview > 0) {
      attention.push({
        key: "calls",
        title: "Innovation calls under review",
        detail: "status = UNDER_REVIEW",
        count: researchCallsUnderReview,
        severity: "watch",
        href: "/research/innovation",
        action: "Review calls",
      });
    }
    if (researchProfilesUnverified > 0) {
      attention.push({
        key: "profiles",
        title: "Research profiles awaiting verification",
        detail: "verification_status ≠ verified",
        count: researchProfilesUnverified,
        severity: "watch",
        href: "/research/settings",
        action: "Verify profiles",
      });
    }
    if (govSourcesUnconfigured > 0) {
      attention.push({
        key: "sources",
        title: "Data source not configured",
        detail: "gov data_sources.status = 'unconfigured'",
        count: govSourcesUnconfigured,
        severity: "alert",
        href: "/gov/dashboard",
        action: "Open data management",
      });
    }

    const attentionTotal = attention.reduce((sum, item) => sum + item.count, 0);
    const attentionKpi = kpis.find((k) => k.key === "attention");
    const datasetsKpi = kpis.find((k) => k.key === "datasets");
    if (attentionKpi) {
      attentionKpi.value = fmt(attentionTotal);
      attentionKpi.sub = `items across ${attention.length} review queue${attention.length === 1 ? "" : "s"}`;
    }
    if (datasetsKpi) {
      datasetsKpi.value = fmt(govDatasets + researchDatasets);
      datasetsKpi.sub = `${fmt(govDatasets)} gov · ${fmt(researchDatasets)} research — ${govSources} sources`;
    }

    // ----------------------------------------------------------- ACTIVITY
    const activity: ActivityEvent[] = [];

    const pushResearch = (
      table: string,
      kind: string,
      text: (row: Record<string, unknown>) => string,
      href: string,
      limit = 2
    ) => {
      try {
        const db = getResearchDatabase();
        const rows = db
          .prepare(`SELECT * FROM "${table}" ORDER BY created_at DESC LIMIT ?`)
          .all(limit) as Array<Record<string, unknown>>;
        for (const row of rows) {
          const at = String(row.created_at ?? "");
          if (!at) continue;
          activity.push({ at, tag: "RESEARCH", kind, text: text(row), href });
        }
      } catch {
        /* source already flagged in degraded */
      }
    };

    pushResearch("research_projects", "Project", (r) => `Research project created — ${String(r.title ?? "")}`, "/research/projects", 1);
    pushResearch("research_outputs", "Output", (r) => `Research output added — ${String(r.title ?? "")}`, "/research/outputs", 2);
    pushResearch("innovation_submissions", "Submission", (r) => `Innovation submission received — ${String(r.title ?? "")}`, "/research/innovation", 1);
    pushResearch("innovation_opportunities", "Call", (r) => `Innovation call published — ${String(r.title ?? "")}`, "/research/innovation", 1);
    pushResearch("datasets", "Dataset", (r) => `Research dataset registered — ${String(r.name ?? "")}`, "/research/datasets", 1);
    pushResearch("gis_layers", "GIS", (r) => `GIS layer catalogued — ${String(r.name ?? "")}`, "/research/gis", 1);
    pushResearch("research_resources", "Resource", (r) => `Repository resource added — ${String(r.title ?? "")}`, "/research/repository", 1);

    try {
      const db = getGovDatabase();
      const govEvents: Array<{ at: string; text: string; href: string }> = [];
      const latestScheme = db.prepare("SELECT name, created_at FROM schemes ORDER BY created_at DESC LIMIT 1").get() as { name: string; created_at: string } | undefined;
      if (latestScheme) {
        govEvents.push({ at: latestScheme.created_at, text: `Scheme register updated — ${latestScheme.name}`, href: "/gov/dashboard" });
      }
      const latestDoc = db.prepare("SELECT title, created_at FROM documents ORDER BY created_at DESC LIMIT 1").get() as { title: string; created_at: string } | undefined;
      if (latestDoc) {
        govEvents.push({ at: latestDoc.created_at, text: `Policy document indexed — ${latestDoc.title}`, href: "/gov/dashboard" });
      }
      if (govDatasets > 0) {
        const dsAt = (db.prepare("SELECT MAX(created_at) m FROM datasets").get() as { m: string | null }).m;
        if (dsAt) govEvents.push({ at: dsAt, text: `${fmt(govDatasets)} district datasets indexed into the catalogue`, href: "/gov/dashboard" });
      }
      activity.push(...govEvents.map((e) => ({ at: e.at, tag: "GOV" as const, kind: "Catalogue", text: e.text, href: e.href })));

      const adminAudit = db
        .prepare("SELECT action, created_at FROM audit_logs WHERE action NOT LIKE 'view_%' ORDER BY created_at DESC LIMIT 4")
        .all() as Array<{ action: string; created_at: string }>;
      const auditText: Record<string, string> = {
        bootstrap_admin_role: "Admin role bootstrap recorded",
        assign_user_roles: "User role assignments updated",
        update_role_permissions: "Role permissions updated",
        update_user: "User record updated",
        create_user: "User account created",
      };
      for (const row of adminAudit) {
        activity.push({
          at: row.created_at,
          tag: "ADMIN",
          kind: "Admin",
          text: auditText[row.action] ?? row.action.replace(/_/g, " "),
          href: "/admin/audit",
        });
      }
    } catch {
      /* gov source already flagged */
    }

    activity.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

    const response: OverviewResponse = {
      meta: {
        generatedAt: new Date().toISOString(),
        sourceAsOf: { gov: govLatest, research: researchLatest, public: null },
        degraded,
      },
      kpis,
      issues,
      trendSplit,
      trackedStates,
      states,
      statesShown: Math.min(STATES_SHOWN, trackedStates),
      research: {
        students: researchUsers,
        faculty: researchFaculty,
        scholars: researchScholars,
        institutions: researchInstitutions,
        activeProjects: researchActiveProjects,
        outputs: researchOutputs,
        publishedOutputs: researchPublished,
        underReviewOutputs: researchUnderReview,
        draftOutputs: researchDrafts,
        datasetsLinked: researchDatasetsLinked,
        datasetsTotal: researchDatasets,
        gisLayers: researchGisLayers,
        questions: researchQuestions,
        findings: researchFindings,
        analyses: researchAnalyses,
        members: researchMembers,
        asOf: researchLatest,
      },
      schemes: {
        government: govSchemes.map((s) => ({
          name: s.name,
          department: s.department,
          launchYear: s.launch_year,
          statusNote: s.status_note,
          dataStatus: s.data_status,
        })),
        pilots: researchPilots,
        calls: researchCalls,
        completed: govSchemes.filter((s) => /complete|concluded|closed/i.test(s.status_note)).length,
        policyDocuments: govPolicyDocuments,
      },
      attention,
      activity: activity.slice(0, 9),
    };

    return NextResponse.json(response);
  } catch (err) {
    return errorResponse(err);
  }
}
