"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/gov/client";
import type { NotificationOut } from "@/lib/gov/types";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { Skeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";

function Inner() {
  const [notifications, setNotifications] = useState<NotificationOut[]>([]);
  const [loading, setLoading] = useState(true);

  function refresh() {
    return api.listNotifications().then(setNotifications);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function handleRead(id: string) {
    await api.markNotificationRead(id);
    await refresh();
  }

  return (
    <DashboardShell>
      <h2 className="mb-1 font-serif-display text-2xl font-semibold text-register-navy">Notifications</h2>
      <p className="mb-6 max-w-2xl text-sm text-register-ink/60">
        System-generated notices only -- a document added to an area you follow, a report shared
        with you, a workspace change. Never a fabricated alert.
      </p>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : notifications.length === 0 ? (
        <p className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">
          No notifications.
        </p>
      ) : (
        <ul className="divide-y divide-register-line rounded-sm border border-register-line bg-register-panel shadow-card">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex items-start justify-between gap-4 px-5 py-4 ${!n.is_read ? "bg-register-navy/[0.03]" : ""}`}
            >
              <div>
                {n.related_url ? (
                  <Link href={n.related_url} className="text-sm text-register-ink/90 hover:underline">
                    {n.message}
                  </Link>
                ) : (
                  <p className="text-sm text-register-ink/90">{n.message}</p>
                )}
                <p className="mt-1 text-xs uppercase tracking-wide text-register-ink/40">
                  {n.category} · {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => handleRead(n.id)}
                  className="shrink-0 text-xs font-medium text-register-navy underline"
                >
                  Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}
