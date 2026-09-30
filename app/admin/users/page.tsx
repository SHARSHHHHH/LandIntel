"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { UserTable, type AdminUser } from "@/components/admin/UserTable";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import type { RoleRow } from "@/components/admin/RoleMatrix";
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

const EMPTY_CREATE = {
  email: "",
  password: "",
  full_name: "",
  department: "",
  roles: [] as string[],
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleRows, setRoleRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ ...EMPTY_CREATE });
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState<AdminUser | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [userList, roles] = await Promise.all([
        adminFetch<AdminUser[]>("/users"),
        adminFetch<RoleRow[]>("/roles"),
      ]);
      setUsers(userList);
      setRoleRows(roles);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.email.toLowerCase().includes(q) ||
      (u.full_name ?? "").toLowerCase().includes(q) ||
      (u.department ?? "").toLowerCase().includes(q) ||
      u.roles.some((r) => r.toLowerCase().includes(q))
    );
  });

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      const created = await adminFetch<AdminUser>("/users", {
        method: "POST",
        body: JSON.stringify(createForm),
      });
      setUsers((prev) => [created, ...prev]);
      setCreateForm({ ...EMPTY_CREATE });
      setShowCreate(false);
      setNotice(`User ${created.email} created.`);
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  function openRoleEditor(user: AdminUser) {
    setEditingUser(user);
    setEditRoles(user.roles);
    setNotice(null);
  }

  async function saveRoles() {
    if (!editingUser) return;
    setSavingRoles(true);
    setError(null);
    try {
      const updated = await adminFetch<{ id: string; roles: string[] }>(
        `/users/${editingUser.id}/roles`,
        { method: "PUT", body: JSON.stringify({ roles: editRoles }) }
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, roles: updated.roles } : u))
      );
      setNotice(`Roles updated for ${editingUser.email}.`);
      setEditingUser(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingRoles(false);
    }
  }

  async function confirmToggleStatus() {
    if (!confirmTarget) return;
    setStatusBusy(true);
    setError(null);
    try {
      const nextActive = !confirmTarget.is_active;
      const updated = await adminFetch<AdminUser>(
        `/users/${confirmTarget.id}/status`,
        { method: "POST", body: JSON.stringify({ is_active: Boolean(nextActive) }) }
      );
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
      setNotice(
        `${updated.email} ${updated.is_active ? "activated" : "deactivated"}.`
      );
      setConfirmTarget(null);
    } catch (err) {
      setError((err as Error).message);
      setConfirmTarget(null);
    } finally {
      setStatusBusy(false);
      setBusyId(null);
    }
  }

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif-display text-2xl font-semibold text-register-navy">Users</h2>
          <p className="mt-1 text-sm text-register-ink/60">
            Create accounts, assign roles and activate or deactivate access.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreate((v) => !v);
            setCreateError(null);
          }}
          className="rounded-sm bg-register-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-register-navy2"
        >
          {showCreate ? "Close" : "Add user"}
        </button>
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

      {showCreate && (
        <form
          onSubmit={createUser}
          className="mb-6 rounded-sm border border-register-line bg-register-panel p-5 shadow-card"
        >
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-register-ink/55">
            New user
          </h3>
          {createError && (
            <p className="mt-3 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {createError}
            </p>
          )}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-register-ink/80">Email</span>
              <input
                type="email"
                required
                autoComplete="off"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full rounded-sm border border-register-line bg-white px-3 py-2 text-sm shadow-card focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-register-ink/80">
                Temporary password
              </span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="w-full rounded-sm border border-register-line bg-white px-3 py-2 text-sm shadow-card focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
              />
              <span className="mt-1 block text-xs text-register-ink/50">
                Minimum 8 characters. There is no password-reset workflow in this MVP.
              </span>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-register-ink/80">Full name</span>
              <input
                type="text"
                autoComplete="off"
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                className="w-full rounded-sm border border-register-line bg-white px-3 py-2 text-sm shadow-card focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-register-ink/80">Department</span>
              <input
                type="text"
                autoComplete="off"
                value={createForm.department}
                onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                className="w-full rounded-sm border border-register-line bg-white px-3 py-2 text-sm shadow-card focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
              />
            </label>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-register-ink/55">
              Roles
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {roleRows.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-1.5 text-sm text-register-ink/80"
                >
                  <input
                    type="checkbox"
                    checked={createForm.roles.includes(role.name)}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        roles: e.target.checked
                          ? [...prev.roles, role.name]
                          : prev.roles.filter((r) => r !== role.name),
                      }))
                    }
                    className="h-3.5 w-3.5 accent-[#1B2A4A]"
                  />
                  {role.name}
                </label>
              ))}
              {roleRows.length === 0 && (
                <span className="text-xs text-register-ink/50">No roles available.</span>
              )}
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-sm border border-register-line bg-white px-4 py-2 text-sm text-register-ink transition-colors hover:bg-register-bg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="rounded-sm bg-register-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-register-navy2 disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create user"}
            </button>
          </div>
        </form>
      )}

      {editingUser && (
        <div className="mb-6 rounded-sm border border-register-ochre/40 bg-register-ochre/5 p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-register-ink/55">
            Roles for {editingUser.email}
          </h3>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {roleRows.map((role) => (
              <label key={role.id} className="flex items-center gap-1.5 text-sm text-register-ink/80">
                <input
                  type="checkbox"
                  checked={editRoles.includes(role.name)}
                  onChange={(e) =>
                    setEditRoles((prev) =>
                      e.target.checked
                        ? [...prev, role.name]
                        : prev.filter((r) => r !== role.name)
                    )
                  }
                  disabled={savingRoles}
                  className="h-3.5 w-3.5 accent-[#1B2A4A]"
                />
                {role.name}
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              disabled={savingRoles}
              className="rounded-sm border border-register-line bg-white px-3 py-1.5 text-sm text-register-ink transition-colors hover:bg-register-bg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveRoles}
              disabled={savingRoles}
              className="rounded-sm bg-register-navy px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-register-navy2 disabled:opacity-60"
            >
              {savingRoles ? "Saving…" : "Save roles"}
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by email, name, department or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-sm border border-register-line bg-white px-3 py-2 text-sm shadow-card focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <UserTable
          users={filteredUsers}
          busyId={busyId}
          editingId={editingUser?.id ?? null}
          onEditRoles={openRoleEditor}
          onToggleStatus={(user) => {
            setConfirmTarget(user);
            setBusyId(user.id);
            setNotice(null);
          }}
        />
      )}

      <ConfirmAction
        open={confirmTarget !== null}
        title={confirmTarget?.is_active ? "Deactivate user" : "Activate user"}
        message={
          confirmTarget?.is_active
            ? `${confirmTarget?.email} will lose access immediately. Existing sessions keep working until their token expires.`
            : `${confirmTarget?.email} will be able to sign in again.`
        }
        confirmLabel={confirmTarget?.is_active ? "Deactivate" : "Activate"}
        busy={statusBusy}
        onConfirm={confirmToggleStatus}
        onCancel={() => {
          setConfirmTarget(null);
          setBusyId(null);
        }}
      />
    </AdminShell>
  );
}
