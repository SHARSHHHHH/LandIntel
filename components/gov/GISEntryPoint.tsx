"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/gov/client";
import type { MapLayerOut } from "@/lib/gov/types";
import { DataStatusBadge } from "./DataStatusBadge";
import { Skeleton } from "./Skeleton";

export function GISEntryPoint({ areaId }: { areaId: string }) {
  const [layers, setLayers] = useState<MapLayerOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAreaMapLayers(areaId).then(setLayers).finally(() => setLoading(false));
  }, [areaId]);

  return (
    <div className="rounded-sm border border-register-line bg-register-panel p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-serif-display text-base font-semibold text-register-navy">
          GIS &amp; Land Insights
        </h3>
        <Link
          href={`/gov/areas/${areaId}/gis`}
          className="rounded-sm border border-register-navy/20 px-2.5 py-1 text-xs font-medium text-register-navy transition-colors hover:border-register-navy hover:bg-register-navy hover:text-white"
        >
          Open map view
        </Link>
      </div>
      <p className="mt-1 text-xs text-register-ink/60">
        Available layers for this area, plus live device-location tracking.
      </p>

      {loading ? (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : layers.length === 0 ? (
        <p className="mt-4 text-sm text-register-ink/50">No map layers registered for this area yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {layers.map((layer) => (
            <li
              key={layer.id}
              className="flex items-center justify-between gap-3 rounded-sm border border-register-line px-3 py-2 text-sm transition-colors hover:border-register-navy/30"
            >
              <div>
                <p className="font-medium">{layer.name}</p>
                <p className="text-xs text-register-ink/50">
                  {layer.layer_type}
                  {layer.source_name ? ` · ${layer.source_name}` : ""}
                  {layer.reference_year ? ` · ${layer.reference_year}` : ""}
                </p>
              </div>
              <DataStatusBadge status={layer.data_status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
