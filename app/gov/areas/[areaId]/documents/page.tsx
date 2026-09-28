"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { DocumentList } from "@/components/gov/DocumentList";
import { RequireAuth } from "@/components/gov/RequireAuth";

function Inner() {
  const params = useParams<{ areaId: string }>();
  const areaId = params.areaId;
  if (!areaId) return null;

  return (
    <DashboardShell>
      <Link href={`/gov/areas/${areaId}/overview`} className="text-xs font-medium text-register-navy hover:underline">
        ← Back to overview
      </Link>
      <h2 className="mt-1 mb-6 font-serif-display text-2xl font-semibold text-register-navy">
        Evidence &amp; research
      </h2>
      <div className="rounded-sm border border-register-line bg-register-panel p-5">
        <DocumentList areaId={areaId} />
      </div>
    </DashboardShell>
  );
}

export default function DocumentListingPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}
