"use client";

import { useMemo } from "react";
import { Circle, Polygon, Polyline, useMapEvents } from "react-leaflet";

export type MeasureMode = "distance" | "area";

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two lat/lng points, in meters. */
function haversine(a: [number, number], b: [number, number]): number {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Polygon area in square meters via an equirectangular projection (fine at this zoom/scale) + shoelace formula. */
function polygonArea(points: [number, number][]): number {
  if (points.length < 3) return 0;
  const lat0 = toRad(points[0][0]);
  const projected = points.map(([lat, lng]) => [
    toRad(lng) * EARTH_RADIUS_M * Math.cos(lat0),
    toRad(lat) * EARTH_RADIUS_M,
  ]);
  let sum = 0;
  for (let i = 0; i < projected.length; i++) {
    const [x1, y1] = projected[i];
    const [x2, y2] = projected[(i + 1) % projected.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

export function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m.toFixed(0)} m`;
}

export function formatArea(sqm: number): string {
  const hectares = sqm / 10000;
  return hectares >= 1 ? `${hectares.toFixed(3)} ha` : `${sqm.toFixed(0)} m^2`;
}

export function measureResult(mode: MeasureMode, points: [number, number][]): string {
  if (mode === "distance") {
    let total = 0;
    for (let i = 1; i < points.length; i++) total += haversine(points[i - 1], points[i]);
    return formatDistance(total);
  }
  return formatArea(polygonArea(points));
}

/** Click-to-draw measurement overlay. Adds a point on each map click while `active`. */
export function MeasureLayer({
  active,
  mode,
  points,
  onAddPoint,
}: {
  active: boolean;
  mode: MeasureMode;
  points: [number, number][];
  onAddPoint: (p: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      // Handles clicks that land on empty map background. Clicks on a vector
      // layer (parcel/boundary polygon) are forwarded separately -- see the
      // per-layer click handlers in MapView, since Leaflet does not bubble
      // a layer's click event up to the map.
      if (!active) return;
      onAddPoint([e.latlng.lat, e.latlng.lng]);
    },
  });

  const shape = useMemo(() => points, [points]);

  if (shape.length === 0) return null;

  return (
    <>
      {mode === "distance" ? (
        <Polyline positions={shape} pathOptions={{ color: "#b0392f", weight: 3, dashArray: "6 4" }} />
      ) : (
        <Polygon positions={shape} pathOptions={{ color: "#b0392f", weight: 2, fillOpacity: 0.15 }} />
      )}
      {shape.map((p, i) => (
        <Circle key={i} center={p} radius={4} pathOptions={{ color: "#b0392f", fillColor: "#b0392f", fillOpacity: 1 }} />
      ))}
    </>
  );
}
