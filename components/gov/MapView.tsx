"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { GeographicUnitOut, MapLayerOut } from "@/lib/gov/types";
import { api, type DistrictHierarchyOut, type GisSearchResultOut } from "@/lib/gov/client";
import type { DistrictGisLayers, DistrictGisUnsupported, GisLayerKey, ParcelDetail } from "@/lib/gov/gis/types";
import { DataStatusBadge } from "./DataStatusBadge";
import { LocateControl } from "./LocateControl";
import { MapLegend } from "./MapLegend";
import { SampleDataBanner } from "./gis/SampleDataBanner";
import { HierarchyDrilldown } from "./gis/HierarchyDrilldown";
import { ParcelSearchBox } from "./gis/ParcelSearchBox";
import { ParcelPanel } from "./gis/ParcelPanel";
import { MeasureLayer, measureResult, type MeasureMode } from "./gis/MeasureTool";

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

const SAMPLE_LAYER_META: Record<GisLayerKey, { label: string; color: string }> = {
  parcels: { label: "Land parcels", color: "#152238" },
  landuse: { label: "Land use", color: "#8a9a5b" },
  governmentLand: { label: "Government land", color: "#5b6b8a" },
  roads: { label: "Roads / infrastructure", color: "#6b6259" },
  water: { label: "Water bodies", color: "#2e6f9e" },
  disputed: { label: "Disputed parcels", color: "#b0392f" },
};

interface MapApi {
  flyTo: (center: [number, number], zoom?: number) => void;
  fitBounds: (bounds: [[number, number], [number, number]]) => void;
  resetView: () => void;
}

function MapController({ registerApi, initialCenter, initialZoom }: { registerApi: (api: MapApi) => void; initialCenter: [number, number]; initialZoom: number }) {
  const map = useMap();
  useEffect(() => {
    registerApi({
      flyTo: (center, zoom) => map.flyTo(center, zoom ?? 16),
      fitBounds: (bounds) => map.fitBounds(bounds, { padding: [40, 40] }),
      resetView: () => map.setView(initialCenter, initialZoom),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

export default function MapView({ area, initialParcelId }: { area: GeographicUnitOut; initialParcelId?: string | null }) {
  const router = useRouter();
  const didInitialFly = useRef(false);

  // --- Existing area-registered layers (district boundary, HQ point, etc.) ---
  const [available, setAvailable] = useState<MapLayerOut[]>([]);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState<Record<string, LoadedLayer>>({});
  const [basemap, setBasemap] = useState<BasemapKey>("streets");
  const [fillOpacity, setFillOpacity] = useState(0.35);
  const [showLocation, setShowLocation] = useState(false);

  // --- Hierarchical land-record navigation (Tehsil/Taluk -> Village -> Parcel) ---
  const [hierarchy, setHierarchy] = useState<DistrictHierarchyOut | null>(null);
  const [hierarchyLoading, setHierarchyLoading] = useState(true);
  const [gisLayers, setGisLayers] = useState<DistrictGisLayers | DistrictGisUnsupported | null>(null);
  const [activeSampleLayers, setActiveSampleLayers] = useState<Set<GisLayerKey>>(new Set(["parcels"]));
  const [selectedSubDistrictId, setSelectedSubDistrictId] = useState<string | null>(null);
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [parcelDetail, setParcelDetail] = useState<ParcelDetail | null>(null);
  const [parcelLoading, setParcelLoading] = useState(false);
  const [crossDistrictNotice, setCrossDistrictNotice] = useState<string | null>(null);

  // --- Measurement tool ---
  const [measureActive, setMeasureActive] = useState(false);
  const [measureMode, setMeasureMode] = useState<MeasureMode>("distance");
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);

  const mapApiRef = useRef<MapApi | null>(null);

  // Leaflet's GeoJSON `onEachFeature` only re-runs when the layer is
  // recreated (its React `key` changes), not on every parent re-render -- so
  // click handlers bound inside it would otherwise close over a stale
  // `measureActive`/`measureMode` value. A ref keeps those handlers reading
  // the live value without forcing every layer to remount on each toggle.
  const measureActiveRef = useRef(measureActive);
  useEffect(() => {
    measureActiveRef.current = measureActive;
  }, [measureActive]);

  useEffect(() => {
    api.getAreaMapLayers(area.id).then((layers) => {
      setAvailable(layers);
      const withGeometry = layers.filter((l) => l.has_geometry);
      setActiveIds(new Set(withGeometry.map((l) => l.id)));
    });
  }, [area.id]);

  useEffect(() => {
    setHierarchyLoading(true);
    setSelectedSubDistrictId(null);
    setSelectedVillageId(null);
    setSelectedParcelId(null);
    setParcelDetail(null);
    api
      .getDistrictHierarchy(area.id)
      .then(setHierarchy)
      .finally(() => setHierarchyLoading(false));
    api.getDistrictGisLayers(area.id).then(setGisLayers);
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

  // Deep link from Evidence & Research ("View on GIS"): preselect the parcel
  // named in ?parcelId= as soon as this district's hierarchy is ready.
  useEffect(() => {
    if (initialParcelId && !didInitialFly.current && hierarchy) {
      didInitialFly.current = true;
      setSelectedParcelId(initialParcelId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialParcelId, hierarchy]);

  useEffect(() => {
    if (!selectedParcelId) {
      setParcelDetail(null);
      return;
    }
    setParcelLoading(true);
    api
      .getParcelDetail(selectedParcelId)
      .then((p) => {
        setParcelDetail(p);
        // Sync the drilldown selects to whatever parcel was opened (map click or search).
        if (hierarchy) {
          const sd = hierarchy.subDistricts.find((s) => s.villages.some((v) => v.id === p.villageId));
          if (sd) {
            setSelectedSubDistrictId(sd.id);
            setSelectedVillageId(p.villageId);
          }
        }
        if (selectedParcelId === initialParcelId) {
          mapApiRef.current?.flyTo([p.centroid.lat, p.centroid.lng], 17);
        }
      })
      .catch(() => setParcelDetail(null))
      .finally(() => setParcelLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedParcelId]);

  function toggleLayer(id: string, hasGeometry: boolean) {
    if (!hasGeometry) return;
    setActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSampleLayer(key: GisLayerKey) {
    setActiveSampleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const handleLocate = useCallback(
    (result: GisSearchResultOut) => {
      setCrossDistrictNotice(null);
      if (result.districtGeoId && result.districtGeoId !== area.id) {
        if (result.districtGeoId) {
          router.push(`/gov/areas/${result.districtGeoId}/gis`);
        } else {
          setCrossDistrictNotice(`"${result.surveyNumber}" was found outside this district's sample coverage.`);
        }
        return;
      }
      setSelectedParcelId(result.parcelId);
      mapApiRef.current?.flyTo([result.centroid.lat, result.centroid.lng], 17);
    },
    [area.id, router]
  );

  const center: [number, number] =
    area.centroid_lat && area.centroid_lng ? [area.centroid_lat, area.centroid_lng] : [22.9734, 78.6569];

  const activeLayers = useMemo(
    () => Array.from(activeIds).map((id) => loaded[id]).filter(Boolean) as LoadedLayer[],
    [activeIds, loaded]
  );
  const hasZoneLayer = activeLayers.some((l) => l.layer_type === "landuse");
  const hasPointLayer = activeLayers.some((l) => l.layer_type === "point");
  const bm = BASEMAPS[basemap];

  const supportedGisLayers = gisLayers && gisLayers.supported ? gisLayers : null;
  const measureText = measurePoints.length > (measureMode === "distance" ? 1 : 2) ? measureResult(measureMode, measurePoints) : null;

  return (
    <div className="space-y-4">
      <SampleDataBanner />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <HierarchyDrilldown
            hierarchy={hierarchy}
            loading={hierarchyLoading}
            selectedSubDistrictId={selectedSubDistrictId}
            selectedVillageId={selectedVillageId}
            onSelectSubDistrict={(id) => {
              setSelectedSubDistrictId(id);
              const sd = hierarchy?.subDistricts.find((s) => s.id === id);
              if (sd && sd.villages[0]) {
                const c = sd.villages[0].centroid;
                mapApiRef.current?.flyTo([c.lat, c.lng], 14);
              }
            }}
            onSelectVillage={(id) => {
              setSelectedVillageId(id);
              const sd = hierarchy?.subDistricts.find((s) => s.id === selectedSubDistrictId);
              const v = sd?.villages.find((vv) => vv.id === id);
              if (v) mapApiRef.current?.flyTo([v.centroid.lat, v.centroid.lng], 16);
            }}
          />

          <ParcelSearchBox onLocate={handleLocate} />
          {crossDistrictNotice && <p className="text-xs text-register-ink/50">{crossDistrictNotice}</p>}

          {supportedGisLayers && (
            <div className="rounded-sm border border-register-line bg-register-panel p-4">
              <h3 className="font-serif-display text-base font-semibold text-register-navy">GIS layers</h3>
              <ul className="mt-3 space-y-2">
                {(Object.keys(SAMPLE_LAYER_META) as GisLayerKey[]).map((key) => {
                  const count = supportedGisLayers.layers[key].features.length;
                  const provenance = supportedGisLayers.provenance[key];
                  return (
                    <li key={key}>
                      <label
                        className={`flex items-center justify-between gap-2 rounded-sm border px-3 py-2 text-sm transition-colors ${
                          count > 0
                            ? "cursor-pointer border-register-line hover:border-register-navy/40"
                            : "cursor-not-allowed border-register-line/60 opacity-50"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={activeSampleLayers.has(key)}
                            disabled={count === 0}
                            onChange={() => toggleSampleLayer(key)}
                          />
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-sm border border-black/10"
                            style={{ backgroundColor: SAMPLE_LAYER_META[key].color }}
                          />
                          {SAMPLE_LAYER_META[key].label}
                        </span>
                        <DataStatusBadge status={provenance.data_status} />
                      </label>
                      {count === 0 && <p className="mt-1 pl-6 text-[11px] text-register-ink/40">No features for this district</p>}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[11px] text-register-ink/40">
                All layers above are SAMPLE/illustrative for this demo &mdash; see banner above the map.
              </p>
            </div>
          )}

          <div className="rounded-sm border border-register-line bg-register-panel p-4">
            <h3 className="font-serif-display text-base font-semibold text-register-navy">Administrative boundary layers</h3>
            <p className="mt-1 text-xs text-register-ink/60">Real district boundary &amp; headquarters, carried over from the Area Overview.</p>
            <ul className="mt-3 space-y-2">
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
            <h3 className="font-serif-display text-base font-semibold text-register-navy">Map tools</h3>
            <div className="mt-3 space-y-3">
              <div>
                <span className="mb-1.5 block text-xs font-medium text-register-ink/70">Measure</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (measureActive && measureMode === "distance") {
                        setMeasureActive(false);
                      } else {
                        setMeasureMode("distance");
                        setMeasureActive(true);
                        setMeasurePoints([]);
                      }
                    }}
                    className={`rounded-sm border px-2.5 py-1 text-xs font-medium ${
                      measureActive && measureMode === "distance"
                        ? "border-register-navy bg-register-navy text-white"
                        : "border-register-line text-register-ink/70 hover:border-register-navy/40"
                    }`}
                  >
                    Distance
                  </button>
                  <button
                    onClick={() => {
                      if (measureActive && measureMode === "area") {
                        setMeasureActive(false);
                      } else {
                        setMeasureMode("area");
                        setMeasureActive(true);
                        setMeasurePoints([]);
                      }
                    }}
                    className={`rounded-sm border px-2.5 py-1 text-xs font-medium ${
                      measureActive && measureMode === "area"
                        ? "border-register-navy bg-register-navy text-white"
                        : "border-register-line text-register-ink/70 hover:border-register-navy/40"
                    }`}
                  >
                    Area
                  </button>
                  <button
                    onClick={() => {
                      setMeasureActive(false);
                      setMeasurePoints([]);
                    }}
                    className="rounded-sm border border-register-line px-2.5 py-1 text-xs font-medium text-register-ink/70 hover:border-register-navy/40"
                  >
                    Clear
                  </button>
                </div>
                {measureActive && (
                  <p className="mt-1.5 text-[11px] text-register-ink/50">
                    Click points on the map ({measureMode === "distance" ? "a path" : "a polygon"}).{" "}
                    {measureText ? <strong className="text-register-navy">{measureText}</strong> : `${measurePoints.length} point(s) so far.`}
                  </p>
                )}
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-medium text-register-ink/70">View</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => mapApiRef.current?.resetView()}
                    className="rounded-sm border border-register-line px-2.5 py-1 text-xs font-medium text-register-ink/70 hover:border-register-navy/40"
                  >
                    Reset view
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-register-line bg-register-panel p-4">
            <h3 className="font-serif-display text-base font-semibold text-register-navy">Your location</h3>
            <p className="mt-1 text-xs text-register-ink/60">
              Uses your browser's live GPS/network position &mdash; not a government record.
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
                Use the controls in the top-right of the map to locate once or track live. If permission is denied, the
                map will note that instead of failing silently.
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
            <MapController registerApi={(a) => (mapApiRef.current = a)} initialCenter={center} initialZoom={10} />

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
                      pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#A8752A", fillOpacity: 1 }}
                    >
                      <Popup>
                        <div className="text-xs">
                          <p className="font-semibold text-register-navy">{f.properties?.name ?? layer.name}</p>
                          {f.properties?.office_type && <p className="text-register-ink/60">{f.properties.office_type}</p>}
                          <p className="mt-1 text-register-ink/50">
                            District headquarters town center &mdash; not a surveyed office footprint.
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
                      color: featureColor ?? style.color ?? "#152238",
                      weight: style.weight ?? 2,
                      fillColor: featureColor ?? style.color ?? "#152238",
                      fillOpacity: layer.layer_type === "landuse" ? fillOpacity : style.fillOpacity ?? 0.08,
                      // Let clicks fall through to the map (needed so the measure tool can
                      // register a point even when this layer covers the click location).
                      bubblingMouseEvents: true,
                    };
                  }}
                  onEachFeature={(feature, leafletLayer) => {
                    const label = feature.properties?.label ?? feature.properties?.name;
                    if (label) leafletLayer.bindPopup(`<div class="text-xs"><strong>${label}</strong></div>`);
                    // Leaflet does not bubble a layer's click up to the map's own click
                    // handler, so the measure tool (which listens on the map) would never
                    // see a click landing on this polygon without this explicit forward.
                    leafletLayer.on("click", (e: any) => {
                      if (measureActiveRef.current) setMeasurePoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
                    });
                  }}
                />
              );
            })}

            {supportedGisLayers &&
              (Object.keys(SAMPLE_LAYER_META) as GisLayerKey[]).map((key) => {
                if (!activeSampleLayers.has(key)) return null;
                const fc = supportedGisLayers.layers[key];
                if (fc.features.length === 0) return null;
                const isPolyLayer = fc.features[0].geometry.type === "LineString";
                return (
                  <GeoJSON
                    key={`gis-${key}-${selectedParcelId}`}
                    data={fc as any}
                    style={(feature) => {
                      const color = (feature?.properties?.color as string) ?? SAMPLE_LAYER_META[key].color;
                      const isSelected = feature?.properties?.parcelId === selectedParcelId;
                      return {
                        color: isSelected ? "#0e1a2e" : color,
                        weight: isSelected ? 4 : isPolyLayer ? 3 : 2,
                        fillColor: color,
                        fillOpacity: isPolyLayer ? 0 : key === "landuse" ? fillOpacity : isSelected ? 0.55 : 0.25,
                        // Let clicks fall through to the map even when landing on a
                        // parcel/layer shape, so the measure tool still registers a point.
                        bubblingMouseEvents: true,
                      };
                    }}
                    onEachFeature={(feature, leafletLayer) => {
                      const parcelId = feature.properties?.parcelId as string | undefined;
                      if (parcelId) {
                        leafletLayer.bindTooltip(feature.properties?.label ?? parcelId, { sticky: true });
                        leafletLayer.on("click", (e: any) => {
                          if (measureActiveRef.current) {
                            setMeasurePoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
                            return;
                          }
                          setSelectedParcelId(parcelId);
                        });
                      } else if (feature.properties?.name) {
                        leafletLayer.bindTooltip(feature.properties.name, { sticky: true });
                        leafletLayer.on("click", (e: any) => {
                          if (measureActiveRef.current) setMeasurePoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
                        });
                      }
                    }}
                  />
                );
              })}

            <MeasureLayer
              active={measureActive}
              mode={measureMode}
              points={measurePoints}
              onAddPoint={(p) => setMeasurePoints((prev) => [...prev, p])}
            />

            {showLocation && <LocateControl />}
          </MapContainer>

          <MapLegend
            showZones={hasZoneLayer}
            showOffices={hasPointLayer}
            showLocation={showLocation}
            sampleLayers={activeSampleLayers}
          />
        </div>
      </div>

      <ParcelPanel parcel={parcelDetail} loading={parcelLoading} onClose={() => setSelectedParcelId(null)} />
    </div>
  );
}
