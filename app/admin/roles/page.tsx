"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { RoleMatrix, type RoleRow } from "@/components/admin/RoleMatrix";
import { Skeleton } from "@/components/gov/Skeleton";
import { clearToken, getToken } from "@/lib/gov/client";

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    clearToken();
    window.location.assign("/gov/login");
    throw new Error("Session expired");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.detail || `Request failed (${res.status})`);
  return body as T;
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [permissionCodes, setPermissionCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyRoleId, setBusyRoleId] = useState<string | null>(null);

  const [newRoleName, setNewRoleName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [roleList, permissions] = await Promise.all([
        adminFetch<RoleRow[]>("/roles"),
        adminFetch<{ id: string; code: string }[]>("/permissions"),
      ]);
      setRoles(roleList);
      setPermissionCodes(permissions.map((p) => p.code));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createRole(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      const created = await adminFetch<RoleRow>("/roles", {
        method: "POST",
        body: JSON.stringify({ name: newRoleName.trim(), permission_codes: [] }),
      });
      setRoles((prev) => [...prev, created]);
      setNewRoleName("");
      setNotice(`Role "${created.name}" created. Tick permissions below, then Save.`);
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function savePermissions(role: RoleRow, nextPermissions: string[]) {
    setBusyRoleId(role.id);
    setError(null);
    setNotice(null);
    try {
      const updated = await adminFetch<RoleRow>(`/roles/${role.id}`, {
        method: "PATCH",
        body: JSON.stringify({ permission_codes: nextPermissions }),
      });
      setRoles((prev) =>
        prev.map((r) =>
          r.id === updated.id ? { ...r, permissions: updated.permissions } : r
        )
      );
      setNotice(`Permissions updated for "${role.name}".`);
    } catch (err) {
      setError((err as Error).message);
      await load();
    } finally {
      setBusyRoleId(null);
    }
  }

  return (
    <AdminShell>
      <div className="mb-6">
        <h2 className="font-serif-display text-2xl font-semibold text-register-navy">
          Roles &amp; permissions
        </h2>
        <p className="mt-1 text-sm text-register-ink/60">
          Permission codes follow the platform&apos;s snake_case verb-first convention. Changes take
          effect on the next request.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.includes("Missing required permission")
            ? "Your account does not have permission to perform this action."
            : error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-sm border border-register-official/30 bg-register-official/5 px-4 py-3 text-sm text-register-official">
          {notice}
        </div>
      )}

      <form
        onSubmit={createRole}
        className="mb-6 flex flex-wrap items-end gap-3 rounded-sm border border-register-line bg-register-panel p-4 shadow-card"
      >
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-register-ink/80">New role name</span>
          <input
            type="text"
            required
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="e.g. data_steward"
            className="w-64 rounded-sm border border-register-line bg-white px-3 py-2 text-sm shadow-card focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
          />
        </label>
        <button
          type="submit"
          disabled={creating}
          className="rounded-sm bg-register-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-register-navy2 disabled:opacity-60"
        >
          {creating ? "Creating…" : "Create role"}
        </button>
        {createError && (
          <span className="text-sm text-red-700">{createError}</span>
        )}
      </form>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <RoleMatrix
          roles={roles}
          permissionCodes={permissionCodes}
          busyRoleId={busyRoleId}
          onSave={savePermissions}
        />
      )}

      {!loading && permissionCodes.length > 0 && (
        <p className="mt-3 text-xs text-register-ink/50">
          Available codes: {permissionCodes.join(", ")}
        </p>
      )}
    </AdminShell>
  );
}
