"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/gov/client";
import type { UploadedDocumentOut } from "@/lib/gov/types";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { DocumentList } from "@/components/gov/DocumentList";
import { DocumentUpload } from "@/components/gov/DocumentUpload";
import { RequireAuth } from "@/components/gov/RequireAuth";

function Inner() {
  const params = useParams<{ areaId: string }>();
  const areaId = params.areaId;
  const [uploads, setUploads] = useState<UploadedDocumentOut[]>([]);

  const refreshUploads = useCallback(() => {
    if (!areaId) return;
    api.listUploadedDocuments(areaId).then(setUploads).catch(() => {});
  }, [areaId]);

  useEffect(() => {
    refreshUploads();
  }, [refreshUploads]);

  if (!areaId) return null;

  return (
    <DashboardShell>
      <Link href={`/gov/areas/${areaId}/overview`} className="text-xs font-medium text-register-navy hover:underline">
        ← Back to overview
      </Link>
      <h2 className="mt-1 mb-6 font-serif-display text-2xl font-semibold text-register-navy">
        Evidence &amp; research
      </h2>
      <div className="mb-6 rounded-sm border border-register-line bg-register-panel p-5">
        <DocumentUpload areaId={areaId} uploads={uploads} onUploaded={refreshUploads} />
      </div>
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
