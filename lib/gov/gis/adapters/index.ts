import type { LandRecordAdapter } from "./types";
import { sampleDataAdapter } from "./sampleDataAdapter";

/**
 * Adapter registry, keyed by state code. Today every state resolves to the
 * sample adapter. A real state adapter is added here (see README.md) without
 * touching the UI or the API routes in app/api/gov/gis/*.
 */
const ADAPTERS: Record<string, LandRecordAdapter> = {};

export function getLandRecordAdapter(stateCode?: string | null): LandRecordAdapter {
  if (stateCode && ADAPTERS[stateCode]) return ADAPTERS[stateCode];
  return sampleDataAdapter;
}

export type { LandRecordAdapter } from "./types";
