"use client";

export interface AuditRow {
  id: string;
  user_id: string | null;
  user_email?: string | null;
  action: string;
  resource: string | null;
  resource_id: string | null;
  extra: string | null;
  created_at: string;
}

interface AuditTableProps {
  items: AuditRow[];
  emptyMessage?: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "—";
  return d.toLocaleString();
}

function shortId(id: string | null): string {
  if (!id) return "—";
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

export function AuditTable({ items, emptyMessage = "No audit entries found." }: AuditTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-register-line bg-register-panel px-6 py-10 text-center">
        <p className="text-sm text-register-ink/60">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-register-line bg-register-panel shadow-card">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-register-line bg-register-bg/60 text-[11px] uppercase tracking-wide text-register-ink/55">
            <th className="px-4 py-2.5 font-semibold">Time</th>
            <th className="px-4 py-2.5 font-semibold">User</th>
            <th className="px-4 py-2.5 font-semibold">Action</th>
            <th className="px-4 py-2.5 font-semibold">Resource</th>
            <th className="px-4 py-2.5 font-semibold">Resource ID</th>
            <th className="px-4 py-2.5 font-semibold">Details</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id} className="border-b border-register-line/70 last:border-b-0">
              <td className="whitespace-nowrap px-4 py-3 text-xs text-register-ink/65">
                {formatTime(row.created_at)}
              </td>
              <td className="px-4 py-3 text-xs text-register-ink">{row.user_email || "system"}</td>
              <td className="px-4 py-3">
                <span className="inline-block rounded-sm bg-register-navy/10 px-1.5 py-0.5 font-mono text-[11px] text-register-navy">
                  {row.action}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-register-ink/70">{row.resource || "—"}</td>
              <td className="px-4 py-3 font-mono text-xs text-register-ink/60">
                {shortId(row.resource_id)}
              </td>
              <td className="max-w-[240px] truncate px-4 py-3 text-xs text-register-ink/60">
                <span title={row.extra || ""}>{row.extra || "—"}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
