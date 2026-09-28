'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Map, { NavigationControl, AttributionControl, Source, Layer as MapLayer, Popup, useMap } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { setWorkerUrl } from 'maplibre-gl';
import { Layers, MapPin, Loader2, AlertCircle, Eye, EyeOff, X, Search, Filter, FolderOpen, Globe, Navigation, Trash2, Satellite, FlaskConical } from 'lucide-react';
import { DataStatusBadge } from '@/components/research/projects/DataStatusBadge';
import { GISAnalysisContextForm } from '@/components/research/projects/GISAnalysisContextForm';
import { Button } from '@/components/research/ui/button';
import { BASE_PATH } from "@/lib/research/base-path";

// Next.js/webpack does not bundle maplibre's runtime worker URL (it is built
// with `new URL(...)` at runtime), so the worker file is served from /public
// and pointed to explicitly. Without this the worker 404s (text/html) and
// vector-tile parsing / queryRenderedFeatures never run.
setWorkerUrl('/maplibre-gl-worker.mjs');

const LIBERTY_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const INITIAL_VIEW_STATE = { longitude: 78.9629, latitude: 20.5937, zoom: 6 } as const;
const MAP_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://openfreemap.org/">OpenFreeMap</a>';

// Optional satellite basemap: EOxCloudless Sentinel-2 cloudless (2025 mosaic),
// advertised via the official WMTS GetCapabilities of tiles.maps.eox.at
// (layer s2cloudless-2025_3857, TileMatrixSet GoogleMapsCompatible). Free,
// no API key; tiles verified 200 over HTTPS with permissive CORS. Licence:
// CC BY-NC-SA 4.0 + Copernicus attribution (fine for this non-commercial
// prototype). Source max zoom verified as 18 (z19 returns 404).
const SATELLITE_TILE_URL =
  'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2025_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg';
const SATELLITE_ATTRIBUTION =
  'Satellite imagery © <a href="https://cloudless.eox.at">EOX IT Services</a> — contains modified Copernicus Sentinel data 2025 (<a rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a>)';

interface Project {
  id: string;
  title: string;
  status: string;
  geographicScope: string;
  _count: { gisLayers: number };
}

interface GISLayer {
  id: string;
  name: string;
  category: string;
  description: string | null;
  provider: string | null;
  sourceUrl: string | null;
  geoserverUrl: string | null;
  geometryType: string;
  state: string | null;
  district: string | null;
  dataStatus: string;
  createdAt: string;
}

interface LinkedGISLayer {
  layerId: string;
  layer: GISLayer;
}

type SourceReadiness = 'valid' | 'placeholder' | 'none';
type GeoJSONRenderState = 'idle' | 'loading' | 'loaded' | 'invalid' | 'error' | 'empty';

function detectSourceReadiness(sourceUrl: string | null): SourceReadiness {
  if (!sourceUrl) return 'none';
  const url = sourceUrl.toLowerCase();
  if (url.includes('example.org') || url.includes('localhost') || url.includes('127.0.0.1')) {
    return 'placeholder';
  }
  if (url.startsWith('/')) return 'valid';
  try {
    new URL(sourceUrl);
    return 'valid';
  } catch {
    return 'none';
  }
}

function isGeoJSONReady(sourceUrl: string | null): boolean {
  return detectSourceReadiness(sourceUrl) === 'valid';
}

function SourceReadinessBadge({ readiness }: { readiness: SourceReadiness }) {
  if (readiness === 'none') {
    return (
      <span className="text-[10px] font-mono bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
        NO SOURCE
      </span>
    );
  }
  if (readiness === 'placeholder') {
    return (
      <span className="text-[10px] font-mono bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">
        PLACEHOLDER URL
      </span>
    );
  }
  return (
    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
      GEOJSON READY
    </span>
  );
}

interface GISLayerInfoProps {
  layer: GISLayer;
  isAssociated: boolean;
  projectName?: string;
  geoJSONState: GeoJSONRenderState;
  onClose: () => void;
}

function GISLayerInfo({ layer, isAssociated, projectName, geoJSONState, onClose }: GISLayerInfoProps) {
  const readiness = detectSourceReadiness(layer.sourceUrl);
  const hasGeometry = layer.geometryType && layer.geometryType !== 'None';
  const canRender = readiness === 'valid' && hasGeometry;

  const stateLabels: Record<GeoJSONRenderState, string> = {
    idle: 'Not yet fetched',
    loading: 'Fetching GeoJSON...',
    loaded: 'GeoJSON rendered on map',
    invalid: 'Invalid GeoJSON format',
    error: 'Failed to load GeoJSON',
    empty: 'GeoJSON has no features',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-lg z-1000">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 truncate">{layer.name}</h3>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
              {layer.category}
            </span>
            {isAssociated && projectName && (
              <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                <FolderOpen className="w-2.5 h-2.5 inline mr-0.5" /> {projectName}
              </span>
            )}
            <SourceReadinessBadge readiness={readiness} />
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {layer.description && (
        <p className="text-xs text-slate-600 leading-relaxed">{layer.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <DataStatusBadge dataStatus={layer.dataStatus} />
        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
          {layer.geometryType}
        </span>
        {layer.state && (
          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
            {layer.state}
          </span>
        )}
        {layer.district && (
          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
            {layer.district}
          </span>
        )}
      </div>

      {layer.provider && (
        <p className="text-[10px] text-slate-500">Provider: <span className="text-slate-700">{layer.provider}</span></p>
      )}

      <div className="border-t border-slate-100 pt-2">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Globe className="w-3 h-3" /> Source
        </p>
        {layer.sourceUrl && (
          <p className="text-[10px] text-slate-600 break-all">
            {layer.sourceUrl}
            {readiness === 'placeholder' && (
              <span className="text-amber-600 font-medium ml-1">(placeholder — not fetched)</span>
            )}
            {readiness === 'valid' && (
              <span className="text-emerald-600 font-medium ml-1">(local API — fetchable)</span>
            )}
          </p>
        )}
        {!layer.sourceUrl && (
          <p className="text-[10px] text-red-500">No source URL configured</p>
        )}
      </div>

      <div className="border-t border-slate-100 pt-2">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">GeoJSON Status</p>
        <p className="text-[10px] text-slate-700">{stateLabels[geoJSONState]}</p>
      </div>

      <div className={`border rounded p-2 ${
        canRender ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
      }`}>
        <p className={`text-[10px] font-medium ${canRender ? 'text-emerald-700' : 'text-red-700'}`}>
          {canRender && geoJSONState === 'loaded'
            ? '✅ GeoJSON rendered on the map'
            : canRender
              ? 'GeoJSON source available — layer can be rendered'
              : '❌ Cannot render: no valid GeoJSON source available'}
        </p>
      </div>

      {isAssociated && (
        <div className="bg-emerald-50 border border-emerald-200 rounded p-2 mt-1">
          <p className="text-[10px] text-emerald-700 font-medium">
            ✅ Layer is associated with project <strong>{projectName}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

function computeGeoJsonBounds(features: any[]): [[number, number], [number, number]] | null {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const feature of features) {
    const box = extractBoundingBox(feature?.geometry);
    if (!box) continue;
    minLat = Math.min(minLat, box.minLat);
    maxLat = Math.max(maxLat, box.maxLat);
    minLng = Math.min(minLng, box.minLng);
    maxLng = Math.max(maxLng, box.maxLng);
  }

  if (!Number.isFinite(minLat) || !Number.isFinite(minLng)) return null;
  return [[minLng, minLat], [maxLng, maxLat]];
}

function FitBoundsOnLoad({ geoJson }: { geoJson: any }) {
  const map = useMap().current;

  useEffect(() => {
    if (!map) return;
    if (!geoJson || !geoJson.features || geoJson.features.length === 0) return;
    try {
      const bounds = computeGeoJsonBounds(geoJson.features);
      if (!bounds) return;
      map.fitBounds(bounds, { padding: { top: 50, right: 50, bottom: 50, left: 50 } });
    } catch { /* ignore bounds errors */ }
  }, [geoJson, map]);

  return null;
}

function BasemapSwitcher() {
  const [basemap, setBasemap] = useState<'streets' | 'satellite'>('streets');

  return (
    <>
      {/* Satellite raster sits above the Liberty basemap layers but below the
          GeoJSON layers (added later in the child list), so research layers,
          selection and popups are untouched. Tiles are only fetched while the
          layer is visible, so Streets (default) loads no satellite imagery. */}
      <Source
        id="satellite-basemap"
        type="raster"
        tiles={[SATELLITE_TILE_URL]}
        tileSize={256}
        maxzoom={18}
        attribution={SATELLITE_ATTRIBUTION}
      >
        <MapLayer
          id="satellite-basemap-layer"
          type="raster"
          layout={{ visibility: basemap === 'satellite' ? 'visible' : 'none' }}
        />
      </Source>
      <div
        className="absolute bottom-9 left-2 z-[1000] flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white/95 p-0.5 shadow-sm"
        data-testid="basemap-switcher"
        role="group"
        aria-label="Basemap"
      >
        <button
          type="button"
          onClick={() => setBasemap('streets')}
          aria-pressed={basemap === 'streets'}
          data-testid="basemap-streets"
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
            basemap === 'streets'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          Streets
        </button>
        <button
          type="button"
          onClick={() => setBasemap('satellite')}
          aria-pressed={basemap === 'satellite'}
          data-testid="basemap-satellite"
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
            basemap === 'satellite'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Satellite className="h-3.5 w-3.5" />
          Satellite
        </button>
      </div>
    </>
  );
}

function BasemapTweaks() {
  const map = useMap().current;

  useEffect(() => {
    if (!map) return;
    const apply = () => {
      try {
        // The OpenFreeMap Liberty basemap fades its shaded-relief raster to 10%
        // opacity at country-level zooms, leaving the map very pale. Raise the
        // opacity curve slightly so terrain/geographic context stays legible.
        // Style URL and layer set are unchanged.
        const raw = map.getMap();
        if (raw.getLayer('natural_earth')) {
          raw.setPaintProperty('natural_earth', 'raster-opacity', [
            'interpolate', ['exponential', 1.5], ['zoom'], 0, 0.6, 6, 0.35, 7, 0.3,
          ] as any);
        }
      } catch { /* basemap tweaks are best-effort */ }
    };

    if (map.isStyleLoaded()) {
      apply();
      return undefined;
    }
    map.once('load', apply);
    return () => { map.off('load', apply); };
  }, [map]);

  return null;
}

interface FeatureInfo {
  properties: Record<string, any>;
  geometryType: string;
  layerName: string;
  dataStatus: string;
  category: string;
  boundingBox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null;
  areaSqKm: number | null;
  areaMethod: string | null;
}

function extractBoundingBox(geometry: any): { minLat: number; maxLat: number; minLng: number; maxLng: number } | null {
  if (!geometry || !geometry.coordinates) return null;

  const coords: number[][] = [];

  function collect(geom: any) {
    if (!geom) return;
    if (geom.type === 'Point') {
      coords.push([geom.coordinates[1], geom.coordinates[0]]);
    } else if (geom.type === 'LineString') {
      coords.push(...geom.coordinates.map((c: number[]) => [c[1], c[0]]));
    } else if (geom.type === 'Polygon') {
      geom.coordinates.forEach((ring: number[][]) => {
        coords.push(...ring.map((c: number[]) => [c[1], c[0]]));
      });
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach((poly: number[][][]) => {
        poly.forEach((ring: number[][]) => {
          ring.forEach((c: number[]) => {
            coords.push([c[1], c[0]]);
          });
        });
      });
    } else if (geom.coordinates) {
      collect(geom.coordinates);
    }
  }

  collect(geometry);

  if (coords.length === 0) return null;

  const lats = coords.map((c) => c[0]);
  const lngs = coords.map((c) => c[1]);

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

function calculatePolygonAreaKm2(coordinates: number[][][]): number | null {
  if (!coordinates || coordinates.length === 0) return null;

  const ring = coordinates[0];
  if (!ring || ring.length < 3) return null;

  const R = 6371;
  const toRad = (deg: number) => deg * Math.PI / 180;

  let area = 0;
  const n = ring.length;
  for (let i = 0; i < n - 1; i++) {
    const lat1 = toRad(ring[i][1]);
    const lat2 = toRad(ring[i + 1][1]);
    const lng1 = toRad(ring[i][0]);
    const lng2 = toRad(ring[i + 1][0]);
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = Math.abs(area) * R * R / 2;

  return area > 0 ? area : null;
}

function computeFeatureArea(feature: any): { areaSqKm: number | null; method: string | null } {
  if (!feature || !feature.geometry) return { areaSqKm: null, method: null };

  const geom = feature.geometry;
  if (!geom.coordinates) return { areaSqKm: null, method: null };

  let area: number | null = null;
  let method: string | null = null;

  if (geom.type === 'Polygon') {
    area = calculatePolygonAreaKm2(geom.coordinates);
    method = 'Planar polygon area (deg→rad, spherical approximation)';
  } else if (geom.type === 'MultiPolygon') {
    let totalArea = 0;
    let valid = true;
    geom.coordinates.forEach((poly: number[][][]) => {
      const a = calculatePolygonAreaKm2(poly);
      if (a !== null) totalArea += a;
      else valid = false;
    });
    if (valid && totalArea > 0) {
      area = totalArea;
      method = 'Sum of planar polygon areas (deg→rad, spherical approximation)';
    }
  } else if (geom.type === 'Point') {
    area = 0;
    method = 'Point geometry — area not applicable';
  } else if (geom.type === 'LineString') {
    area = null;
    method = 'Line geometry — area not applicable';
  } else {
    area = null;
    method = 'Geometry type not supported for area calculation';
  }

  return { areaSqKm: area, method };
}

function FeatureInfoPanel({
  feature,
  layer,
  onClear,
  projectId,
  projectTitle,
}: {
  feature: any;
  layer: GISLayer;
  onClear: () => void;
  projectId: string | null;
  projectTitle?: string | null;
}) {
  const properties = feature?.properties || {};
  const geometryType = feature?.geometry?.type || 'Unknown';
  const { areaSqKm, method } = computeFeatureArea(feature);
  const bbox = extractBoundingBox(feature?.geometry);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);

  const propertyEntries = Object.entries(properties);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-lg z-1000 w-80">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-blue-600" /> Feature Properties
        </h3>
        <button onClick={onClear} className="text-slate-400 hover:text-red-600 flex-shrink-0" title="Clear selection">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded p-2">
        <p className="text-[10px] font-semibold text-slate-500 uppercase">Layer</p>
        <p className="text-xs text-slate-800">{layer.name}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          <DataStatusBadge dataStatus={layer.dataStatus} />
          {' '}{layer.dataStatus} provenance
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50 border border-slate-200 rounded p-2">
          <p className="text-[10px] font-semibold text-slate-500 uppercase">Geometry</p>
          <p className="text-xs text-slate-800 font-mono">{geometryType}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded p-2">
          <p className="text-[10px] font-semibold text-slate-500 uppercase">Features</p>
          <p className="text-xs text-slate-800">1 feature selected</p>
        </div>
      </div>

      {bbox && (
        <div className="bg-slate-50 border border-slate-200 rounded p-2">
          <p className="text-[10px] font-semibold text-slate-500 uppercase">Bounding Box</p>
          <p className="text-[10px] text-slate-700 font-mono">
            Lat: {bbox.minLat.toFixed(4)}° – {bbox.maxLat.toFixed(4)}°
          </p>
          <p className="text-[10px] text-slate-700 font-mono">
            Lng: {bbox.minLng.toFixed(4)}° – {bbox.maxLng.toFixed(4)}°
          </p>
        </div>
      )}

      {areaSqKm !== null && areaSqKm > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded p-2">
          <p className="text-[10px] font-semibold text-emerald-700 uppercase">Area</p>
          <p className="text-sm font-bold text-emerald-800">
            {areaSqKm.toFixed(2)} km²
          </p>
          <p className="text-[10px] text-emerald-600 mt-0.5">
            Method: {method}
          </p>
        </div>
      )}

      {areaSqKm === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded p-2">
          <p className="text-[10px] font-semibold text-amber-700 uppercase">Area</p>
          <p className="text-xs text-amber-800">0 km² (point geometry — area not applicable)</p>
        </div>
      )}

      {areaSqKm === null && geometryType !== 'Point' && geometryType !== 'LineString' && (
        <div className="bg-red-50 border border-red-200 rounded p-2">
          <p className="text-[10px] font-semibold text-red-700 uppercase">Area</p>
          <p className="text-xs text-red-600">Cannot calculate area for {geometryType} geometry</p>
        </div>
      )}

      {propertyEntries.length > 0 && (
        <div className="border-t border-slate-100 pt-2">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Properties ({propertyEntries.length})
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {propertyEntries.map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 text-[10px]">
                <span className="text-slate-500 font-mono shrink-0">{key}:</span>
                <span className="text-slate-800 break-all">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {propertyEntries.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded p-2">
          <p className="text-[10px] text-slate-500">No properties found</p>
        </div>
      )}

      {/* Research workflow: save this feature as an analysis on a project */}
      <div className="border-t border-slate-100 pt-2 space-y-1.5">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Research Workflow</p>
        {!projectId && (
          <p className="text-[10px] text-amber-600" data-testid="create-analysis-no-project">
            Select a research project above first to save this feature.
          </p>
        )}
        <Button
          size="sm"
          className="w-full"
          disabled={!projectId}
          onClick={() => setShowAnalysisForm(true)}
          data-testid="create-analysis-button"
          title={projectId ? 'Save this feature as an analysis' : 'Select a research project first'}
        >
          <FlaskConical className="w-4 h-4 mr-1.5" /> Create Analysis
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-1">
        <p className="text-[10px] text-blue-700">
          💡 Click another feature to select it. Click the trash icon above to clear the selection.
        </p>
      </div>

      {showAnalysisForm && projectId && (
        <GISAnalysisContextForm
          context={{
            feature,
            layer: {
              name: layer.name,
              category: layer.category,
              geometryType: layer.geometryType,
              dataStatus: layer.dataStatus,
            },
            bbox,
            areaSqKm,
            areaMethod: method,
          }}
          projectId={projectId}
          projectTitle={projectTitle ?? null}
          onClose={() => setShowAnalysisForm(false)}
        />
      )}
    </div>
  );
}

function GeoJSONLayer({ layer, visible, onStateChange }: {
  layer: GISLayer;
  visible: boolean;
  onStateChange: (layerId: string, state: GeoJSONRenderState) => void;
}) {
  const [geojson, setGeojson] = useState<any>(null);
  const [state, setState] = useState<GeoJSONRenderState>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !layer.sourceUrl || !isGeoJSONReady(layer.sourceUrl)) {
      setGeojson(null);
      setState('idle');
      onStateChange(layer.id, 'idle');
      return;
    }

    let cancelled = false;
    setState('loading');
    onStateChange(layer.id, 'loading');
    setLoadError(null);

    fetch(layer.sourceUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (!data || typeof data !== 'object') throw new Error('Response is not a valid JSON object');
        if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
          throw new Error('GeoJSON must be a FeatureCollection with features array');
        }
        if (data.features.length === 0) {
          setState('empty');
          onStateChange(layer.id, 'empty');
          setGeojson(null);
          return;
        }
        setGeojson(data);
        setState('loaded');
        onStateChange(layer.id, 'loaded');
      })
      .catch((err: any) => {
        if (cancelled) return;
        setLoadError(err.message || 'Failed to load GeoJSON');
        setState('error');
        onStateChange(layer.id, 'error');
      });

    return () => { cancelled = true; };
  }, [visible, layer.sourceUrl, layer.id, onStateChange]);

  if (!visible || state === 'idle') return null;
  if (state === 'loading') return null;
  if (state === 'error' || state === 'empty' || state === 'invalid') return null;
  if (!geojson) return null;

  const strokeColor = layer.dataStatus === 'REAL' ? '#059669' : layer.dataStatus === 'DERIVED' ? '#7c3aed' : '#2563eb';
  const isProvisional = layer.dataStatus !== 'REAL' && layer.dataStatus !== 'DERIVED';

  return (
    <>
      <FitBoundsOnLoad geoJson={geojson} />
      <Source id={`geojson-${layer.id}`} type="geojson" data={geojson}>
        <MapLayer
          id={`geojson-fill-${layer.id}`}
          type="fill"
          paint={{ 'fill-color': strokeColor, 'fill-opacity': 0.28 }}
        />
        <MapLayer
          id={`geojson-line-${layer.id}`}
          type="line"
          paint={{
            'line-color': strokeColor,
            'line-width': 2,
            'line-opacity': 0.9,
            ...(isProvisional ? { 'line-dasharray': [2, 1.5] } : {}),
          }}
        />
      </Source>
    </>
  );
}

function MapStatusChip({ visibleLayersData, geoJSONStates }: {
  visibleLayersData: GISLayer[];
  geoJSONStates: Record<string, GeoJSONRenderState>;
}) {
  const anyGeometryLoaded = visibleLayersData.some((l) => geoJSONStates[l.id] === 'loaded');
  const anyGeometryLoading = visibleLayersData.some((l) => geoJSONStates[l.id] === 'loading');
  const hasAnyValidSource = visibleLayersData.some((l) => isGeoJSONReady(l.sourceUrl));
  const hasAnyPlaceholder = visibleLayersData.some((l) => detectSourceReadiness(l.sourceUrl) === 'placeholder');
  const hasAnyNone = visibleLayersData.some((l) => detectSourceReadiness(l.sourceUrl) === 'none');

  // Empty-state treatment only: once any visible geometry has rendered, stay out of the map.
  if (anyGeometryLoaded) return null;

  const sourceConfigured = hasAnyValidSource;

  return (
    <div className="absolute top-3 left-3 z-300 pointer-events-none max-w-[22rem]">
      <div
        className={`rounded-md border px-3 py-2 shadow-sm ${
          sourceConfigured ? 'border-sky-200 bg-white/92' : 'border-amber-200 bg-amber-50/95'
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-2">
          {sourceConfigured ? (
            <Globe className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
          )}
          <div className="text-[11px] leading-snug">
            <p className={`font-semibold ${sourceConfigured ? 'text-slate-700' : 'text-amber-800'}`}>
              {sourceConfigured
                ? (anyGeometryLoading ? 'Fetching external GeoJSON…' : 'External GeoJSON source configured')
                : 'No geometry data available'}
            </p>
            <p className={`mt-0.5 ${sourceConfigured ? 'text-slate-500' : 'text-amber-700'}`}>
              {sourceConfigured
                ? 'Geometry may not be available yet — nothing has been imported locally; features render only if the source returns coordinates.'
                : 'Layers are metadata-only until geometry is imported.'}
            </p>
            {!sourceConfigured && hasAnyPlaceholder && (
              <p className="mt-0.5 text-amber-600">Some layers use placeholder source URLs (example.org).</p>
            )}
            {!sourceConfigured && hasAnyNone && (
              <p className="mt-0.5 text-amber-600">Some layers have no source URL configured.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GISMap() {
  const [layers, setLayers] = useState<GISLayer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showAssociatedOnly, setShowAssociatedOnly] = useState(false);
  const [geoJSONStates, setGeoJSONStates] = useState<Record<string, GeoJSONRenderState>>({});
  const [selectedFeature, setSelectedFeature] = useState<{ feature: any; layer: GISLayer } | null>(null);
  const [showFeaturePanel, setShowFeaturePanel] = useState(false);

  const fetchLayers = useCallback(async () => {
    try {
      const res = await fetch('/api/research/gis-layers');
      if (!res.ok) throw new Error('Failed to fetch GIS layers');
      const data = await res.json();
      const layerList: GISLayer[] = data.data || [];
      setLayers(layerList);
      const allVisible = new Set(layerList.map((l: GISLayer) => l.id));
      setVisibleLayers(allVisible);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);
      const res = await fetch('/api/research/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      const projectList: Project[] = data.data || [];
      setProjects(projectList);
    } catch (err: any) {
      setProjectsError(err.message || 'Failed to fetch projects');
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLayers();
  }, [fetchLayers]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  const [associatedLayerIds, setAssociatedLayerIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!selectedProjectId) {
      setAssociatedLayerIds(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BASE_PATH}/api/research/projects/${selectedProjectId}`);
        if (!res.ok) return;
        const data = await res.json();
        const project = data.data;
        if (!cancelled && project && project.gisLayers) {
          const ids: Set<string> = new Set(project.gisLayers.map((gl: LinkedGISLayer) => gl.layerId));
          setAssociatedLayerIds(ids);
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [selectedProjectId]);

  const toggleVisibility = (id: string) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredLayers = layers.filter((l) => {
    const matchesSearch = !filter || l.name.toLowerCase().includes(filter.toLowerCase()) || l.category.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = !statusFilter || l.dataStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const displayLayers = showAssociatedOnly && selectedProjectId
    ? filteredLayers.filter((l) => associatedLayerIds.has(l.id))
    : filteredLayers;

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;
  const isSelectedAssociated = selectedLayerId ? associatedLayerIds.has(selectedLayerId) : false;

  const [featurePopup, setFeaturePopup] = useState<{ lngLat: [number, number]; name: string; status: string } | null>(null);
  const [pointerOverFeature, setPointerOverFeature] = useState(false);

  const visibleLayerData = useMemo(() => {
    return layers.filter((l) => visibleLayers.has(l.id));
  }, [layers, visibleLayers]);

  const interactiveLayerIds = useMemo(() => {
    return displayLayers
      .filter((l) => visibleLayers.has(l.id) && geoJSONStates[l.id] === 'loaded')
      .map((l) => `geojson-fill-${l.id}`);
  }, [displayLayers, visibleLayers, geoJSONStates]);

  const handleFeatureSelect = useCallback((feature: any, layer: GISLayer) => {
    setSelectedFeature({ feature, layer });
    setShowFeaturePanel(true);
    setSelectedLayerId(layer.id);
  }, []);

  const handleGeoJSONStateChange = useCallback((layerId: string, state: GeoJSONRenderState) => {
    setGeoJSONStates((prev) => (prev[layerId] === state ? prev : { ...prev, [layerId]: state }));
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedFeature(null);
    setShowFeaturePanel(false);
  }, []);

  const handleMapClick = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features && e.features[0];
    if (!feature) {
      setFeaturePopup(null);
      return;
    }
    const sourceId = typeof feature.source === 'string' ? feature.source : '';
    const targetLayerId = sourceId.startsWith('geojson-') ? sourceId.slice('geojson-'.length) : '';
    const gisLayer = layers.find((l) => l.id === targetLayerId);
    if (!gisLayer) return;
    const properties = feature.properties || {};
    setFeaturePopup({
      lngLat: [e.lngLat.lng, e.lngLat.lat],
      name: properties.name || 'Unknown Feature',
      status: properties.dataStatus || gisLayer.dataStatus,
    });
    handleFeatureSelect(feature, gisLayer);
  }, [layers, handleFeatureSelect]);

  const handlePointerMove = useCallback((e: MapLayerMouseEvent) => {
    setPointerOverFeature(!!(e.features && e.features.length > 0));
  }, []);

  const handlePointerLeave = useCallback(() => {
    setPointerOverFeature(false);
  }, []);

  return (
    <div className="h-full flex flex-col bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">GIS Map Viewer</h2>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
            {layers.length} layer{layers.length !== 1 ? 's' : ''}
          </span>
          {selectedProject && (
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
              <FolderOpen className="w-2.5 h-2.5 inline mr-0.5" /> {selectedProject.title}
            </span>
          )}
          {selectedFeature && (
            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">
              <Navigation className="w-2.5 h-2.5 inline mr-0.5" /> Feature selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedFeature && (
            <Button variant="outline" size="sm" onClick={handleClearSelection}>
              <Trash2 className="w-3 h-3 mr-1" /> Clear Selection
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchLayers} disabled={loading}>
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden">
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="flex items-center gap-1.5">
              <FolderOpen className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Project</span>
            </div>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value || null)}
              disabled={projectsLoading}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">No project selected</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p._count.gisLayers} layers)
                </option>
              ))}
            </select>
            {projectsLoading && <p className="text-[10px] text-slate-400">Loading projects...</p>}
            {projectsError && <p className="text-[10px] text-red-500">{projectsError}</p>}
          </div>

          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search layers..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Status</option>
                <option value="REAL">REAL</option>
                <option value="SAMPLE">SAMPLE</option>
                <option value="DERIVED">DERIVED</option>
              </select>
            </div>
            {selectedProjectId && (
              <button
                onClick={() => setShowAssociatedOnly(!showAssociatedOnly)}
                className={`w-full text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                  showAssociatedOnly
                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {showAssociatedOnly ? '✓ Showing project layers only' : 'Show project-associated only'}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-6 h-6 text-red-500 mb-2" />
                <p className="text-xs text-red-600">{error}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={fetchLayers}>Retry</Button>
              </div>
            ) : displayLayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Layers className="w-6 h-6 text-slate-400 mb-2" />
                <p className="text-xs text-slate-500">
                  {showAssociatedOnly && selectedProjectId
                    ? 'No layers associated with this project match the filters'
                    : 'No layers match your filters'}
                </p>
              </div>
            ) : (
              displayLayers.map((layer) => {
                const isVisible = visibleLayers.has(layer.id);
                const isSelected = selectedLayerId === layer.id;
                const isAssociated = associatedLayerIds.has(layer.id);
                const readiness = detectSourceReadiness(layer.sourceUrl);
                const isFeatureSelected = selectedFeature?.layer.id === layer.id;
                return (
                  <div
                    key={layer.id}
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${
                      isSelected ? 'border-blue-300 bg-blue-50' : isFeatureSelected ? 'border-purple-300 bg-purple-50' : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }}
                      className="flex-shrink-0"
                    >
                      {isVisible ? (
                        <Eye className="w-4 h-4 text-blue-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${isVisible ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                        {layer.name}
                      </p>
                      <p className="text-[10px] text-slate-500">{layer.category} · {layer.geometryType}</p>
                      {isAssociated && (
                        <p className="text-[9px] text-blue-600 font-medium">✓ Associated with project</p>
                      )}
                      {isFeatureSelected && (
                        <p className="text-[9px] text-purple-600 font-medium">📍 Feature selected</p>
                      )}
                      <SourceReadinessBadge readiness={readiness} />
                    </div>
                    <DataStatusBadge dataStatus={layer.dataStatus} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 relative">
          {loading && !layers.length ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm text-slate-500">Loading GIS layers...</p>
              </div>
            </div>
          ) : error && !layers.length ? (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50">
              <div className="flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchLayers}>Retry</Button>
              </div>
            </div>
          ) : (
            <Map
              initialViewState={INITIAL_VIEW_STATE}
              mapStyle={LIBERTY_STYLE_URL}
              interactiveLayerIds={interactiveLayerIds}
              cursor={pointerOverFeature ? 'pointer' : undefined}
              attributionControl={false}
              onClick={handleMapClick}
              onMouseMove={handlePointerMove}
              onMouseLeave={handlePointerLeave}
              style={{ borderRadius: '0.75rem' }}
            >
              <BasemapTweaks />
              <NavigationControl position="top-right" />
              <AttributionControl customAttribution={MAP_ATTRIBUTION} />
              <BasemapSwitcher />
              {displayLayers.map((layer) => (
                <GeoJSONLayer
                  key={`geojson-${layer.id}`}
                  layer={layer}
                  visible={visibleLayers.has(layer.id)}
                  onStateChange={handleGeoJSONStateChange}
                />
              ))}
              {featurePopup && (
                <Popup
                  longitude={featurePopup.lngLat[0]}
                  latitude={featurePopup.lngLat[1]}
                  anchor="bottom"
                  onClose={() => setFeaturePopup(null)}
                >
                  <div className="text-xs">
                    <strong>{featurePopup.name}</strong>
                    <br />
                    Status: {featurePopup.status}
                  </div>
                </Popup>
              )}
            </Map>
          )}
          {!loading && !error && layers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
              <div className="flex flex-col items-center gap-2">
                <Layers className="w-8 h-8 text-slate-400" />
                <p className="text-sm text-slate-500">No GIS layers found</p>
              </div>
            </div>
          )}

          {/* Geometry status / empty-state chip (top-left, non-blocking) */}
          {!loading && !error && visibleLayerData.length > 0 && (
            <MapStatusChip visibleLayersData={visibleLayerData} geoJSONStates={geoJSONStates} />
          )}

          {/* Feature info panel */}
          {selectedFeature && showFeaturePanel && (
            <div className="absolute top-3 right-3 z-1000 max-h-[calc(100%-0.75rem)] overflow-y-auto">
              <FeatureInfoPanel
                feature={selectedFeature.feature}
                layer={selectedFeature.layer}
                onClear={handleClearSelection}
                projectId={selectedProjectId}
                projectTitle={selectedProject?.title}
              />
            </div>
          )}

          {/* Layer info panel (when no feature selected) */}
          {selectedLayer && !showFeaturePanel && (
            <div className="absolute top-3 right-3 z-1000 w-72">
              <GISLayerInfo
                layer={selectedLayer}
                isAssociated={isSelectedAssociated}
                projectName={selectedProject?.title}
                geoJSONState={geoJSONStates[selectedLayerId || ''] || 'idle'}
                onClose={() => setSelectedLayerId(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
