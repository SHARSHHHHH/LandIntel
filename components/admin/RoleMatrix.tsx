"use client";

import { useEffect, useState } from "react";

export interface RoleRow {
  id: string;
  name: string;
  permissions: string[];
  user_count: number;
}

interface RoleMatrixProps {
  roles: RoleRow[];
  permissionCodes: string[];
  busyRoleId: string | null;
  onSave: (role: RoleRow, nextPermissions: string[]) => void;
}

function RoleRowEditor({
  role,
  permissionCodes,
  busy,
  onSave,
}: {
  role: RoleRow;
  permissionCodes: string[];
  busy: boolean;
  onSave: (role: RoleRow, nextPermissions: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(role.permissions);

  useEffect(() => {
    setSelected(role.permissions);
  }, [role.permissions]);

  const dirty =
    selected.length !== role.permissions.length ||
    selected.some((code) => !role.permissions.includes(code));

  function toggle(code: string) {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  return (
    <tr className="border-b border-register-line/70 last:border-b-0 align-top">
      <td className="px-4 py-3">
        <p className="font-medium text-register-ink">{role.name}</p>
        <p className="text-xs text-register-ink/50">
          {role.user_count} user{role.user_count === 1 ? "" : "s"}
        </p>
      </td>
      <td className="px-4 py-3" colSpan={permissionCodes.length}>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {permissionCodes.map((code) => (
            <label key={code} className="flex items-center gap-1.5 text-xs text-register-ink/80">
              <input
                type="checkbox"
                checked={selected.includes(code)}
                onChange={() => toggle(code)}
                disabled={busy}
                className="h-3.5 w-3.5 accent-[#1B2A4A]"
              />
              <span className="font-mono">{code}</span>
            </label>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => onSave(role, selected)}
          disabled={!dirty || busy}
          className="rounded-sm bg-register-navy px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-register-navy2 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </td>
    </tr>
  );
}

export function RoleMatrix({ roles, permissionCodes, busyRoleId, onSave }: RoleMatrixProps) {
  if (roles.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-register-line bg-register-panel px-6 py-10 text-center">
        <p className="text-sm text-register-ink/60">No roles defined yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-register-line bg-register-panel shadow-card">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-register-line bg-register-bg/60 text-[11px] uppercase tracking-wide text-register-ink/55">
            <th className="px-4 py-2.5 font-semibold">Role</th>
            <th className="px-4 py-2.5 font-semibold">Permissions</th>
            <th className="px-4 py-2.5 text-right font-semibold">Changes</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <RoleRowEditor
              key={`${role.id}:${role.permissions.join(",")}`}
              role={role}
              permissionCodes={permissionCodes}
              busy={busyRoleId === role.id}
              onSave={onSave}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
