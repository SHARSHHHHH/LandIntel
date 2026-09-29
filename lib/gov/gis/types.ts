import type { DataStatus } from "@/lib/gov/types";

/**
 * Shared types for the GIS & Land Insights module (State -> District ->
 * Tehsil/Taluk -> Village -> Parcel). District and above reuse the real
 * geographic_units/map_layers tables already seeded in lib/gov/db.ts.
 * Tehsil/Village/Parcel below district are necessarily SAMPLE data in this
 * sandbox -- there is no real cadastral dataset available here -- and are
 * always tagged as such. See lib/gov/gis/adapters/README.md for how a real
 * state adapter would replace the sample one without changing the UI.
 */

/** Per-state vocabulary so the UI never hardcodes English admin-level names. */
export interface Terminology {
  stateName: string;
  stateCode: string;
  /** What this state calls the level below district: "Tehsil", "Taluk", "Mandal", "Block", ... */
  subDistrictTerm: string;
  /** What this state calls a village-level unit -- almost always "Village", kept configurable regardless. */
  villageTerm: string;
  /** What this state calls a land parcel identifier: "Khasra No.", "Survey No.", "Pattadar Passbook No.", ... */
  parcelIdLabel: string;
}

export interface Provenance {
  source_name: string;
  as_of_date: string | null;
  data_status: DataStatus;
  note: string;
}

export interface SubDistrictSummary {
  id: string;
  name: string;
  villageCount: number;
}

export interface VillageSummary {
  id: string;
  name: string;
  parcelCount: number;
  centroid: { lat: number; lng: number };
}

export interface SubDistrictDetail extends SubDistrictSummary {
  villages: VillageSummary[];
}

export type LandUseClass = "Agricultural" | "Residential" | "Commercial" | "Government" | "Vacant/Barren" | "Water body";
export type MutationStatus = "no_mutation" | "mutation_pending" | "mutated";
export type DisputeStatus = "none" | "open" | "closed";

export interface ParcelOwner {
  name: string;
  share: string;
}

export interface ParcelHistoryEntry {
  year: number;
  event: string;
  note: string;
  documentRef: string | null;
}

/**
 * Parcel field set is intentionally NOT uniform across states -- each sample
 * state adds its own `extraFields` entries (e.g. Telangana's Dharani
 * "encumbrance status", Tamil Nadu's "patta number") to prove the UI renders
 * whatever fields an adapter reports, and shows "not available" for fields a
 * given state's adapter does not supply, rather than assuming one schema.
 */
export interface ParcelSummary {
  id: string;
  villageId: string;
  subDistrictId: string;
  surveyNumber: string;
  areaHectares: number;
  landUse: LandUseClass;
  disputeStatus: DisputeStatus;
  centroid: { lat: number; lng: number };
}

export interface ParcelDetail extends ParcelSummary {
  villageName: string;
  subDistrictName: string;
  districtName: string;
  /** geographic_units.code for this parcel's district (e.g. "RJ-JAIPUR"), when the adapter knows it. */
  districtCode?: string;
  stateName: string;
  parcelIdLabel: string;
  owners: ParcelOwner[];
  recordId: string;
  mutationStatus: MutationStatus;
  extraFields: { label: string; value: string }[];
  history: ParcelHistoryEntry[];
  geometry: GeoJSON.Polygon;
  provenance: Provenance;
}

export interface SearchResult {
  parcelId: string;
  districtId: string;
  subDistrictId: string;
  villageId: string;
  surveyNumber: string;
  villageName: string;
  ownerNames: string[];
  recordId: string;
  matchedOn: "survey_number" | "village_name" | "owner_name" | "record_id";
  centroid: { lat: number; lng: number };
}

export type GisLayerKey =
  | "parcels"
  | "landuse"
  | "governmentLand"
  | "roads"
  | "water"
  | "disputed";

export interface DistrictGisLayers {
  supported: true;
  terminology: Terminology;
  layers: Record<GisLayerKey, GeoJSON.FeatureCollection>;
  provenance: Record<GisLayerKey, Provenance>;
}

export interface DistrictGisUnsupported {
  supported: false;
  terminology: Terminology;
  message: string;
}
