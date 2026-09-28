"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/gov/client";
import { useAreaContext } from "@/components/gov/area-context";
import type { WorkspaceOut } from "@/lib/gov/types";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { Skeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";

function Inner() {
  const [workspaces, setWorkspaces] = useState<WorkspaceOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const { selectedArea } = useAreaContext();

  function refresh() {
    return api.listWorkspaces().then(setWorkspaces);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.createWorkspace({
        name: name.trim(),
        description: description.trim() || undefined,
        geographic_unit_id: selectedArea?.id,
      });
      setName("");
      setDescription("");
      await refresh();
    } finally {
      setCreating(false);
    }
  }

  return (
    <DashboardShell>
      <h2 className="mb-1 font-serif-display text-2xl font-semibold text-register-navy">Collaborative Workspace</h2>
      <p className="mb-6 max-w-2xl text-sm text-register-ink/60">
        Shared spaces to collect notes, documents and indicators around a piece of work. Items you
        add here reference real documents and indicator values already in the platform.
      </p>

      <form
        onSubmit={handleCreate}
        className="mb-8 grid grid-cols-1 gap-3 rounded-sm border border-register-line bg-register-panel p-5 shadow-card sm:grid-cols-[1fr_1fr_auto]"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workspace name"
          required
          className="rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
        />
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="rounded-sm bg-register-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-register-navy2 disabled:cursor-not-allowed disabled:bg-register-ink/20"
        >
          {creating ? "Creating…" : "New workspace"}
        </button>
      </form>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : workspaces.length === 0 ? (
        <p className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">
          No workspaces yet. Create one above.
        </p>
      ) : (
        <ul className="divide-y divide-register-line rounded-sm border border-register-line bg-register-panel shadow-card">
          {workspaces.map((w) => (
            <li key={w.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <Link href={`/gov/workspaces/${w.id}`} className="font-medium text-register-navy hover:underline">
                  {w.name}
                </Link>
                {w.description && <p className="mt-0.5 text-sm text-register-ink/60">{w.description}</p>}
              </div>
              <span className="shrink-0 text-xs text-register-ink/50">{w.item_count} item(s)</span>
            </li>
          ))}
        </ul>
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
