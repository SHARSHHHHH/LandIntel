"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AuditTable, type AuditRow } from "@/components/admin/AuditTable";
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

interface AuditResponse {
  items: AuditRow[];
  total: number;
  page: number;
  page_size: number;
}

export default function AdminAuditPage() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [action, setAction] = useState("");
  const [resource, setResource] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  async function load(currentPage: number, currentAction: string, currentResource: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("page_size", String(pageSize));
      if (currentAction.trim()) params.set("action", currentAction.trim());
      if (currentResource.trim()) params.set("resource", currentResource.trim());
      const res = await adminFetch<AuditResponse>(`/audit?${params.toString()}`);
      setData(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, action, resource);
  }, []);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <AdminShell>
      <div className="mb-6">
        <h2 className="font-serif-display text-2xl font-semibold text-register-navy">Audit log</h2>
        <p className="mt-1 text-sm text-register-ink/60">
          Recorded administrative actions. Entries are written by the server, not by the browser.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.includes("Missing required permission")
            ? "Your account does not have permission to view the audit log."
            : error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          load(1, action, resource);
        }}
        className="mb-4 flex flex-wrap items-end gap-3"
      >
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-register-ink/80">Action contains</span>
          <input
            type="text"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="e.g. user"
            className="w-52 rounded-sm border border-register-line bg-white px-3 py-2 text-sm shadow-card focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-register-ink/80">Resource contains</span>
          <input
            type="text"
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            placeholder="e.g. role"
            className="w-52 rounded-sm border border-register-line bg-white px-3 py-2 text-sm shadow-card focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
          />
        </label>
        <button
          type="submit"
          className="rounded-sm bg-register-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-register-navy2"
        >
          Filter
        </button>
        {(action || resource) && (
          <button
            type="button"
            onClick={() => {
              setAction("");
              setResource("");
              setPage(1);
              load(1, "", "");
            }}
            className="rounded-sm border border-register-line bg-white px-3 py-2 text-sm text-register-ink transition-colors hover:bg-register-bg"
          >
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : data ? (
        <>
          <AuditTable items={data.items} />
          <div className="mt-4 flex items-center justify-between text-xs text-register-ink/60">
            <span>
              {data.total} entr{data.total === 1 ? "y" : "ies"} · page {data.page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  const next = page - 1;
                  setPage(next);
                  load(next, action, resource);
                }}
                className="rounded-sm border border-register-line bg-white px-3 py-1.5 text-register-ink transition-colors hover:bg-register-bg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  load(next, action, resource);
                }}
                className="rounded-sm border border-register-line bg-white px-3 py-1.5 text-register-ink transition-colors hover:bg-register-bg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : null}
    </AdminShell>
  );
}
