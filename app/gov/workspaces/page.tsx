"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/gov/client";
import type { WorkspaceOut } from "@/lib/gov/types";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { Skeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";
import { CreateWorkspaceModal } from "@/components/gov/workspace/CreateWorkspaceModal";
import { WorkspaceCard } from "@/components/gov/workspace/WorkspaceCard";
import { RESEARCH_AREAS, VISIBILITY_OPTIONS } from "@/components/gov/workspace/constants";

const FEATURES = [
  { icon: "📋", title: "Research board", text: "Track tasks across To Do, In Progress and Done with assignees and due dates." },
  { icon: "📚", title: "Shared evidence", text: "Pull in documents from Evidence & Research, or upload new ones scoped to the workspace." },
  { icon: "🗺️", title: "GIS-linked", text: "Attach real districts and sample parcels from the GIS module for spatial context." },
  { icon: "🤖", title: "Grounded assistant", text: "Ask questions and get answers drawn only from this workspace's own data — never fabricated." },
];

function Inner() {
  const [workspaces, setWorkspaces] = useState<WorkspaceOut[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  function refresh() {
    return api.listWorkspaces().then(setWorkspaces);
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    if (!workspaces) return [];
    const q = search.trim().toLowerCase();
    return workspaces.filter((w) => {
      if (q && !`${w.name} ${w.description ?? ""}`.toLowerCase().includes(q)) return false;
      if (areaFilter && w.research_area !== areaFilter) return false;
      if (visibilityFilter && w.visibility !== visibilityFilter) return false;
      if (statusFilter && w.status !== statusFilter) return false;
      return true;
    });
  }, [workspaces, search, areaFilter, visibilityFilter, statusFilter]);

  const areasInUse = useMemo(
    () => RESEARCH_AREAS.filter((a) => (workspaces ?? []).some((w) => w.research_area === a)),
    [workspaces]
  );
  const geographiesInUse = useMemo(
    () => Array.from(new Set((workspaces ?? []).map((w) => w.geography_name).filter(Boolean))) as string[],
    [workspaces]
  );

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="mb-1 font-serif-display text-2xl font-semibold text-register-navy">Collaborative Workspace</h2>
          <p className="max-w-2xl text-sm text-register-ink/60">
            Shared research spaces where a team plans work, gathers evidence, records findings and drafts
            policy analysis together — all grounded in this platform's real documents, indicators and GIS data.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="shrink-0 rounded-sm bg-register-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-register-navy2"
        >
          + Create workspace
        </button>
      </div>

      {workspaces === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-52 w-full" />
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="rounded-sm border border-register-line bg-register-panel p-8 shadow-card">
          <h3 className="font-serif-display text-lg font-semibold text-register-navy">What a workspace is for</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-register-ink/70">
            A workspace is a shared home for one piece of research or policy work — for example, a study of
            forest-cover conversion pressure in a district, or an evaluation of a scheme's land-record impact.
            Invite colleagues, assign tasks, link real documents and GIS data already in this platform, record
            findings as you go, and discuss them in one place — instead of scattering notes across email and
            spreadsheets.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-sm border border-register-line bg-register-bg/50 p-4">
                <span className="text-xl">{f.icon}</span>
                <p className="mt-2 text-sm font-semibold text-register-navy">{f.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-register-ink/60">{f.text}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 rounded-sm bg-register-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-register-navy2"
          >
            Create your first workspace
          </button>
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-2 rounded-sm border border-register-line bg-register-panel p-3 shadow-card">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workspaces by name or description…"
              className="min-w-[220px] flex-1 rounded-sm border border-register-line bg-white px-3 py-2 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
            />
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="rounded-sm border border-register-line bg-white px-2.5 py-2 text-xs text-register-ink/70 focus:border-register-navy focus:outline-none"
            >
              <option value="">All research areas</option>
              {areasInUse.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="rounded-sm border border-register-line bg-white px-2.5 py-2 text-xs text-register-ink/70 focus:border-register-navy focus:outline-none"
            >
              <option value="">All visibility</option>
              {VISIBILITY_OPTIONS.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-sm border border-register-line bg-white px-2.5 py-2 text-xs text-register-ink/70 focus:border-register-navy focus:outline-none"
            >
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            {(search || areaFilter || visibilityFilter || statusFilter) && (
              <button
                onClick={() => {
                  setSearch("");
                  setAreaFilter("");
                  setVisibilityFilter("");
                  setStatusFilter("");
                }}
                className="text-xs font-medium text-register-ink/40 hover:text-register-ink/70"
              >
                Clear filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-sm border border-dashed border-register-line px-4 py-10 text-center text-sm text-register-ink/50">
              No workspaces match these filters.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((w) => (
                <WorkspaceCard key={w.id} w={w} />
              ))}
            </div>
          )}
          {geographiesInUse.length > 0 && (
            <p className="mt-4 text-[11px] text-register-ink/40">Geographies in use: {geographiesInUse.join(", ")}</p>
          )}
        </>
      )}

      {showCreate && (
        <CreateWorkspaceModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            refresh();
          }}
        />
      )}
    </DashboardShell>
  );
}

export default function WorkspacesPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}
