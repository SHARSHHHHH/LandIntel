"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@/lib/gov/client";
import { useAreaContext } from "@/components/gov/area-context";
import type { GeographicUnitOut } from "@/lib/gov/types";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { RequireAuth } from "@/components/gov/RequireAuth";

// Leaflet needs `window`, so the map component is loaded client-side only.
const MapView = dynamic(() => import("@/components/gov/MapView"), {
  ssr: false,
  loading: () => <div className="h-[600px] animate-shimmer rounded-sm bg-register-line/40" />,
});

function GISInner() {
  const params = useParams<{ areaId: string }>();
  const areaId = params.areaId;
  const searchParams = useSearchParams();
  const initialParcelId = searchParams.get("parcelId");
  const [area, setArea] = useState<GeographicUnitOut | null>(null);
  const { setSelectedArea } = useAreaContext();

  useEffect(() => {
    if (!areaId) return;
    api.getGeography(areaId).then((a) => {
      setArea(a);
      setSelectedArea(a);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaId]);

  if (!area || !areaId) {
    return (
      <DashboardShell>
        <div className="h-3 w-24 animate-shimmer rounded-sm bg-register-line/50" />
        <div className="mt-2 h-8 w-72 animate-shimmer rounded-sm bg-register-line/50" />
        <div className="mt-6 h-[600px] animate-shimmer rounded-sm bg-register-line/40" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <Link
        href={`/gov/areas/${areaId}/overview`}
        className="text-xs font-medium text-register-navy/70 transition-colors hover:text-register-navy hover:underline"
      >
        Back to overview
      </Link>
      <h2 className="mt-1 mb-1 font-serif-display text-2xl font-semibold text-register-navy">
        GIS &amp; Land Insights — {area.name}
      </h2>
      <p className="mb-6 max-w-2xl text-sm text-register-ink/60">
        Reuses the geographic scope selected in the Area Overview, then drills down
        State &rarr; District &rarr; Tehsil/Taluk &rarr; Village &rarr; Land Parcel. Search records, toggle GIS
        layers, measure distance/area, and locate your own device live.
      </p>
      <MapView area={area} initialParcelId={initialParcelId} />
    </DashboardShell>
  );
}

export default function GISPage() {
  return (
    <RequireAuth>
      <GISInner />
    </RequireAuth>
  );
}
