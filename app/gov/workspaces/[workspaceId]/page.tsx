"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/gov/client";
import type { WorkspaceDetailOut, DirectoryUserOut } from "@/lib/gov/types";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { Skeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";
import { OverviewTab } from "@/components/gov/workspace/tabs/OverviewTab";
import { BoardTab } from "@/components/gov/workspace/tabs/BoardTab";
import { DocumentsTab } from "@/components/gov/workspace/tabs/DocumentsTab";
import { GisTab } from "@/components/gov/workspace/tabs/GisTab";
import { DiscussionsTab } from "@/components/gov/workspace/tabs/DiscussionsTab";
import { FindingsTab } from "@/components/gov/workspace/tabs/FindingsTab";
import { PolicyTab } from "@/components/gov/workspace/tabs/PolicyTab";
import { MembersTab } from "@/components/gov/workspace/tabs/MembersTab";
import { ActivityTab } from "@/components/gov/workspace/tabs/ActivityTab";
import { AssistantTab } from "@/components/gov/workspace/tabs/AssistantTab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "board", label: "Research Board" },
  { key: "documents", label: "Documents & Evidence" },
  { key: "gis", label: "Data & GIS" },
  { key: "discussions", label: "Discussions" },
  { key: "findings", label: "Findings" },
  { key: "policy", label: "Policy Analysis" },
  { key: "members", label: "Members" },
  { key: "activity", label: "Activity" },
  { key: "assistant", label: "AI Assistant" },
];

function Inner() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const [ws, setWs] = useState<WorkspaceDetailOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState<DirectoryUserOut[]>([]);

  async function refresh() {
    if (!workspaceId) return;
    try {
      const data = await api.getWorkspace(workspaceId);
      setWs(data);
    } catch {
      setNotFound(true);
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    api.listDirectoryUsers().then(setUsers).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  if (loading) {
    return (
      <DashboardShell>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-4 h-40 w-full" />
      </DashboardShell>
    );
  }

  if (notFound || !ws) {
    return (
      <DashboardShell>
        <p className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Workspace not found, or you don't have access to it.
        </p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <Link href="/gov/workspaces" className="text-xs font-medium text-register-navy/70 hover:text-register-navy hover:underline">
        ← All workspaces
      </Link>
      <div className="mt-1 mb-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif-display text-2xl font-semibold text-register-navy">{ws.name}</h2>
          {ws.description && <p className="mt-1 max-w-2xl text-sm text-register-ink/60">{ws.description}</p>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ws.research_area && <span className="rounded-sm border border-register-navy/20 bg-register-navy/[0.04] px-2 py-0.5 text-[11px] text-register-navy">{ws.research_area}</span>}
          {ws.geography_name && <span className="rounded-sm border border-register-ochre/30 bg-register-ochre/[0.06] px-2 py-0.5 text-[11px] text-register-ochre">{ws.geography_name}</span>}
          <span className="rounded-sm border border-register-line bg-register-bg px-2 py-0.5 text-[11px] text-register-ink/60">{ws.visibility}</span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-register-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-t-sm border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "border-register-navy text-register-navy" : "border-transparent text-register-ink/50 hover:text-register-ink/80"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab ws={ws} goTo={setTab} />}
      {tab === "board" && <BoardTab ws={ws} workspaceId={ws.id} users={users} refresh={refresh} />}
      {tab === "documents" && <DocumentsTab ws={ws} workspaceId={ws.id} refresh={refresh} />}
      {tab === "gis" && <GisTab ws={ws} workspaceId={ws.id} refresh={refresh} />}
      {tab === "discussions" && <DiscussionsTab ws={ws} workspaceId={ws.id} refresh={refresh} />}
      {tab === "findings" && <FindingsTab ws={ws} workspaceId={ws.id} refresh={refresh} />}
      {tab === "policy" && <PolicyTab ws={ws} workspaceId={ws.id} refresh={refresh} />}
      {tab === "members" && <MembersTab ws={ws} workspaceId={ws.id} users={users} refresh={refresh} />}
      {tab === "activity" && <ActivityTab ws={ws} />}
      {tab === "assistant" && <AssistantTab workspaceId={ws.id} workspaceName={ws.name} />}
    </DashboardShell>
  );
}

export default function WorkspaceDetailPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}
