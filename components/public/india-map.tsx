"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { mapToDb } from "@/lib/public/atlas/aliases";
import { BASE_PATH } from "@/lib/public/base-path";

export interface StateStatSummary {
  name: string;
  mapName: string;
  code: string;
  villages?: number | null;
  computerizedPct?: number | null;
  mapsDigitizedPct?: number | null;
  linkedPct?: number | null;
  ulpinPct?: number | null;
  disputes?: number | null;
  disputesTrend?: string | null;
  disputesPer1000?: number | null;
  urbanSharePct?: number | null;
  agriPct?: number | null;
  forestPct?: number | null;
  climateVulnerability?: number | null;
  projects?: number | null;
  story?: string | null;
  hasData: boolean;
}

type LayerMode = "records" | "disputes" | "urban";

function colorFor(mode: LayerMode, s?: StateStatSummary | null): string {
  if (!s || !s.hasData) return "#d6d3d1";
  if (mode === "records") {
    const v = s.computerizedPct ?? 0;
    if (v >= 95) return "#166534";
    if (v >= 85) return "#15803d";
    if (v >= 70) return "#4ade80";
    return "#facc15";
  }
  if (mode === "urban") {
    const v = s.urbanSharePct ?? 0;
    if (v >= 40) return "#7c2d12";
    if (v >= 25) return "#c2410c";
    if (v >= 15) return "#fb923c";
    return "#fed7aa";
  }
  const trend = s.disputesTrend;
  const v = s.disputes ?? (s.disputesPer1000 ?? 0);
  if (trend === "rising" || v >= 600000) return "#b91c1c";
  if (trend === "falling" || v === 0) return "#4ade80";
  return "#f59e0b";
}

export function DashboardMap({
  states,
  mode,
  onSelect,
  heightClass = "h-[480px]",
}: {
  states: StateStatSummary[];
  mode: LayerMode;
  onSelect?: (s: StateStatSummary) => void;
  heightClass?: string;
}) {
  const [geoJson, setGeoJson] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch(BASE_PATH + "/data/india-simplified.geojson")
      .then((r) => r.json())
      .then(setGeoJson)
      .catch(() => setGeoJson(null));
  }, []);

  const byName = useMemo(() => {
    const m: Record<string, StateStatSummary> = {};
    states.forEach((s) => {
      m[mapToDb(s.mapName || s.name)] = s;
      m[s.name] = s;
    });
    return m;
  }, [states]);

  const style = useMemo(
    () => (feature: any) => {
      const name = feature?.properties?.NAME_1 as string;
      const st = byName[mapToDb(name)];
      return {
        fillColor: colorFor(mode, st),
        weight: 0.6,
        opacity: 0.7,
        color: "#1c1917",
        fillOpacity: 0.75,
      };
    },
    [byName, mode]
  );

  if (typeof window === "undefined") {
    return <div className={`${heightClass} grid place-items-center text-muted-foreground`}>Loading map…</div>;
  }

  const handleClick = (feature: any) => {
    const name = feature?.properties?.NAME_1 as string;
    const st = byName[mapToDb(name)];
    setSelected(name);
    onSelect?.(st);
  };

  return (
    <MapContainer
      center={[22.5, 79]}
      zoom={4.4}
      zoomControl={true}
      scrollWheelZoom={true}
      className={heightClass}
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {geoJson && (
        <GeoJSON
          key={`${mode}-${geoJson?.features?.length ?? 0}`}
          data={geoJson}
          style={style as any}
          onEachFeature={(feature: any, layer: any) => {
            const name = feature?.properties?.NAME_1 as string;
            const st = byName[mapToDb(name)];
            layer.bindTooltip(
              `<strong>${name}</strong>` + (st?.computerizedPct != null && st.hasData ? ` — ${st.computerizedPct}% records` : ""),
              { sticky: true, direction: "top" }
            );
            layer.on({
              click: () => handleClick(feature),
              mouseover: () => layer.setStyle({ weight: 1.5, fillOpacity: 0.9 }),
              mouseout: () => layer.setStyle(style(feature) as any),
            });
          }}
        />
      )}
      {selected && (
        <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow">
          <MapPin className="h-3.5 w-3.5 text-land-green" /> {selected}
        </div>
      )}
    </MapContainer>
  );
}