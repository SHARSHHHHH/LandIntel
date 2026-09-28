"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/gov/client";
import type { ProfileOut } from "@/lib/gov/types";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { Skeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";

function Inner() {
  const [profile, setProfile] = useState<ProfileOut | null>(null);

  useEffect(() => {
    api.getProfile().then(setProfile);
  }, []);

  return (
    <DashboardShell>
      <h2 className="mb-6 font-serif-display text-2xl font-semibold text-register-navy">Profile &amp; Access</h2>

      {!profile ? (
        <Skeleton className="h-56 w-full max-w-xl" />
      ) : (
        <div className="max-w-xl space-y-6">
          <div className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-register-ink/50">Name</dt>
                <dd className="text-right text-register-ink/90">{profile.full_name ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-register-ink/50">Email</dt>
                <dd className="text-right text-register-ink/90">{profile.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-register-ink/50">Department</dt>
                <dd className="text-right text-register-ink/90">{profile.department ?? "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
            <h3 className="mb-3 font-serif-display text-base font-semibold text-register-navy">Roles</h3>
            <div className="flex flex-wrap gap-2">
              {profile.roles.map((r) => (
                <span key={r} className="rounded-sm border border-register-navy/20 px-2.5 py-1 text-xs text-register-navy">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}
