"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { GeographicUnitOut, MapLayerOut } from "@/lib/gov/types";
import { api } from "@/lib/gov/client";
import { DataStatusBadge } from "./DataStatusBadge";
import { LocateControl } from "./LocateControl";
import { MapLegend } from "./MapLegend";

interface LoadedLayer {
  id: string;
  name: string;
  data_status: MapLayerOut["data_status"];
  layer_type: string;
  geojson: any;
  style: Record<string, unknown> | null;
}

const BASEMAPS = {
  streets: {
    label: "Streets",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  light: {
    label: "Light",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
} as const;

type BasemapKey = keyof typeof BASEMAPS;

interface SimpleFeature {
  type: "Feature";
  properties: Record<string, any>;
  geometry: { type: string; coordinates: any };
}

export default function MapView({ area }: { area: GeographicUnitOut }) {
  const [available, setAvailable] = useState<MapLayerOut[]>([]);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState<Record<string, LoadedLayer>>({});
  const [basemap, setBasemap] = useState<BasemapKey>("streets");
  const [fillOpacity, setFillOpacity] = useState(0.35);
  const [showLocation, setShowLocation] = useState(false);

  useEffect(() => {
    api.getAreaMapLayers(area.id).then((layers) => {
      setAvailable(layers);
      const withGeometry = layers.filter((l) => l.has_geometry);
      setActiveIds(new Set(withGeometry.map((l) => l.id)));
    });
  }, [area.id]);

  useEffect(() => {
    activeIds.forEach((id) => {
      if (loaded[id]) return;
      api.getMapLayerGeometry(area.id, id).then((res) => {
        const meta = available.find((l) => l.id === id);
        setLoaded((prev) => ({
          ...prev,
          [id]: {
            id: res.id,
            name: res.name,
            data_status: res.data_status as MapLayerOut["data_status"],
            layer_type: meta?.layer_type ?? "boundary",
            geojson: res.geojson,
            style: res.style,
          },
        }));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIds, area.id]);

  function toggleLayer(id: string, hasGeometry: boolean) {
    if (!hasGeometry) return;
    setActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const center: [number, number] =
    area.centroid_lat && area.centroid_lng ? [area.centroid_lat, area.centroid_lng] : [22.9734, 78.6569];

  const activeLayers = useMemo(
    () => Array.from(activeIds).map((id) => loaded[id]).filter(Boolean) as LoadedLayer[],
    [activeIds, loaded]
  );
  const hasZoneLayer = activeLayers.some((l) => l.layer_type === "landuse");
  const hasPointLayer = activeLayers.some((l) => l.layer_type === "point");
  const bm = BASEMAPS[basemap];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      <div className="space-y-4">
        <div className="rounded-sm border border-register-line bg-register-panel p-4">
          <h3 className="font-serif-display text-base font-semibold text-register-navy">Layers</h3>
          <p className="mt-1 text-xs text-register-ink/60">
            Carried over from the Area Overview's GIS entry point.
          </p>
          <ul className="mt-4 space-y-2">
            {available.map((layer) => (
              <li key={layer.id}>
                <label
                  className={`flex items-center justify-between gap-2 rounded-sm border px-3 py-2 text-sm transition-colors ${
                    layer.has_geometry
                      ? "cursor-pointer border-register-line hover:border-register-navy/40"
                      : "cursor-not-allowed border-register-line/60 opacity-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={activeIds.has(layer.id)}
                      disabled={!layer.has_geometry}
                      onChange={() => toggleLayer(layer.id, layer.has_geometry)}
                    />
                    {layer.name}
                  </span>
                  <DataStatusBadge status={layer.data_status} />
                </label>
                {!layer.has_geometry && (
                  <p className="mt-1 pl-6 text-[11px] text-register-ink/40">No geometry stored yet</p>
                )}
              </li>
            ))}
            {available.length === 0 && (
              <p className="text-sm text-register-ink/50">No layers registered for this area.</p>
            )}
          </ul>
        </div>

        <div className="rounded-sm border border-register-line bg-register-panel p-4">
          <h3 className="font-serif-display text-base font-semibold text-register-navy">Your location</h3>
          <p className="mt-1 text-xs text-register-ink/60">
            Uses your browser's live GPS/network position — not a government record.
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showLocation}
              onChange={(e) => setShowLocation(e.target.checked)}
            />
            Show on map
          </label>
          {showLocation && (
            <p className="mt-2 text-[11px] text-register-ink/50">
              Use the controls in the top-right of the map to locate once or track live.
            </p>
          )}
        </div>

        <div className="rounded-sm border border-register-line bg-register-panel p-4">
          <h3 className="font-serif-display text-base font-semibold text-register-navy">Map display</h3>
          <div className="mt-3">
            <span className="mb-1.5 block text-xs font-medium text-register-ink/70">Basemap</span>
            <div className="flex gap-2">
              {(Object.keys(BASEMAPS) as BasemapKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setBasemap(key)}
                  className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors ${
                    basemap === key
                      ? "border-register-navy bg-register-navy text-white"
                      : "border-register-line text-register-ink/70 hover:border-register-navy/40"
                  }`}
                >
                  {BASEMAPS[key].label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-register-ink/70">
              <span>Zone fill opacity</span>
              <span>{Math.round(fillOpacity * 100)}%</span>
            </label>
            <input
              type="range"
              min={0.05}
              max={0.8}
              step={0.05}
              value={fillOpacity}
              onChange={(e) => setFillOpacity(Number(e.target.value))}
              className="w-full accent-register-navy"
            />
          </div>
        </div>
      </div>

      <div className="relative h-[600px] overflow-hidden rounded-sm border border-register-line">
        <MapContainer center={center} zoom={10} scrollWheelZoom={true} className="z-0">
          <TileLayer attribution={bm.attribution} url={bm.url} />

          {activeLayers.map((layer) => {
            if (layer.layer_type === "point") {
              const features = (layer.geojson?.features ?? []) as SimpleFeature[];
              return features.map((f, idx) => {
                if (f.geometry.type !== "Point") return null;
                const [lng, lat] = f.geometry.coordinates as [number, number];
                return (
                  <CircleMarker
                    key={`${layer.id}-${idx}`}
                    center={[lat, lng]}
                    radius={7}
                    pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#B8862B", fillOpacity: 1 }}
                  >
                    <Popup>
                      <div className="text-xs">
                        <p className="font-semibold text-register-navy">{f.properties?.name ?? layer.name}</p>
                        {f.properties?.office_type && <p className="text-register-ink/60">{f.properties.office_type}</p>}
                        <p className="mt-1 text-register-ink/50">
                          District headquarters town center — not a surveyed office footprint.
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              });
            }

            const style = (layer.style ?? {}) as { color?: string; weight?: number; fillOpacity?: number };
            return (
              <GeoJSON
                key={layer.id + fillOpacity}
                data={layer.geojson}
                style={(feature) => {
                  const featureColor = feature?.properties?.color as string | undefined;
                  return {
                    color: featureColor ?? style.color ?? "#1B2A4A",
                    weight: style.weight ?? 2,
                    fillColor: featureColor ?? style.color ?? "#1B2A4A",
                    fillOpacity: layer.layer_type === "landuse" ? fillOpacity : style.fillOpacity ?? 0.08,
                  };
                }}
                onEachFeature={(feature, leafletLayer) => {
                  const label = feature.properties?.label ?? feature.properties?.name;
                  if (label) leafletLayer.bindPopup(`<div class="text-xs"><strong>${label}</strong></div>`);
                }}
              />
            );
          })}

          {showLocation && <LocateControl />}
        </MapContainer>

        <MapLegend showZones={hasZoneLayer} showOffices={hasPointLayer} showLocation={showLocation} />
      </div>
    </div>
  );
}
