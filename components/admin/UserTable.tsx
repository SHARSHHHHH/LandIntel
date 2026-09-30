"use client";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  is_active: number;
  created_at: string;
  roles: string[];
}

interface UserTableProps {
  users: AdminUser[];
  busyId: string | null;
  editingId: string | null;
  onEditRoles: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={`inline-block rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${
        isAdmin
          ? "bg-register-ochre/15 text-register-ochre"
          : "bg-register-navy/10 text-register-navy"
      }`}
    >
      {role}
    </span>
  );
}

export function UserTable({ users, busyId, editingId, onEditRoles, onToggleStatus }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-register-line bg-register-panel px-6 py-10 text-center">
        <p className="text-sm font-medium text-register-ink/70">No users found</p>
        <p className="mt-1 text-xs text-register-ink/50">
          Create a user to grant access to the platform.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-register-line bg-register-panel shadow-card">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-register-line bg-register-bg/60 text-[11px] uppercase tracking-wide text-register-ink/55">
            <th className="px-4 py-2.5 font-semibold">User</th>
            <th className="px-4 py-2.5 font-semibold">Department</th>
            <th className="px-4 py-2.5 font-semibold">Roles</th>
            <th className="px-4 py-2.5 font-semibold">Status</th>
            <th className="px-4 py-2.5 font-semibold">Created</th>
            <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className={`border-b border-register-line/70 last:border-b-0 ${
                editingId === user.id ? "bg-register-ochre/5" : ""
              }`}
            >
              <td className="px-4 py-3">
                <p className="font-medium text-register-ink">{user.email}</p>
                <p className="text-xs text-register-ink/55">{user.full_name || "—"}</p>
              </td>
              <td className="px-4 py-3 text-register-ink/75">{user.department || "—"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {user.roles.length > 0 ? (
                    user.roles.map((role) => <RoleBadge key={role} role={role} />)
                  ) : (
                    <span className="text-xs text-register-ink/45">No roles</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                {user.is_active ? (
                  <span className="inline-block rounded-sm bg-register-official/10 px-1.5 py-0.5 text-[11px] font-semibold text-register-official">
                    Active
                  </span>
                ) : (
                  <span className="inline-block rounded-sm bg-register-line px-1.5 py-0.5 text-[11px] font-semibold text-register-historical">
                    Inactive
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-register-ink/60">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEditRoles(user)}
                    disabled={busyId === user.id}
                    className="rounded-sm border border-register-line bg-white px-2.5 py-1 text-xs text-register-ink transition-colors hover:bg-register-bg disabled:opacity-60"
                  >
                    Roles
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleStatus(user)}
                    disabled={busyId === user.id}
                    className="rounded-sm border border-register-line bg-white px-2.5 py-1 text-xs text-register-ink transition-colors hover:bg-register-bg disabled:opacity-60"
                  >
                    {user.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
