"use client";

import { useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { AreaSelector } from "@/components/gov/AreaSelector";
import { RequireAuth } from "@/components/gov/RequireAuth";

function AreaSelectInner() {
  const params = useSearchParams();
  const next = params.get("next");

  return (
    <DashboardShell>
      <h2 className="mb-1 font-serif-display text-2xl font-semibold text-register-navy">Select an area</h2>
      <p className="mb-6 max-w-2xl text-sm text-register-ink/60">
        This choice carries into every module — GIS, Evidence &amp; Research, Reports, and more —
        until you change it from the sidebar.
      </p>
      <AreaSelector destination={next === "gis" ? "gis" : "overview"} />
    </DashboardShell>
  );
}

export default function AreaSelectPage() {
  return (
    <RequireAuth>
      <AreaSelectInner />
    </RequireAuth>
  );
}
