import type {
  DistrictGisLayers,
  DistrictGisUnsupported,
  ParcelDetail,
  SearchResult,
  SubDistrictDetail,
  Terminology,
} from "../types";

/**
 * The contract every state/UT land-record backend must satisfy to plug into
 * the GIS & Land Insights UI. The UI (app/gov/areas/[areaId]/gis/*,
 * components/gov/gis/*) calls ONLY this interface -- it never reads a
 * state-specific field name or API shape directly. See README.md in this
 * folder for how a real state adapter (Bhoomi, Dharani, DILRMP, ...) would
 * be registered in place of, or alongside, sampleDataAdapter.
 */
export interface LandRecordAdapter {
  /** Per-state admin-level vocabulary (Tehsil/Taluk/Mandal, parcel ID label, ...). */
  getTerminology(stateCode: string): Terminology;

  /**
   * Tehsil/Taluk -> Village hierarchy below a district. `districtCode` is the
   * stable code already used for districts in lib/gov/db.ts (e.g. "RJ-JAIPUR").
   * Returns null if this adapter has no sub-district data for that district.
   */
  getHierarchy(districtCode: string): SubDistrictDetail[] | null;

  /** All map layers (parcels, land use, government land, roads, water, disputed) for a district. */
  getDistrictLayers(districtCode: string, districtName: string, stateName: string): DistrictGisLayers | DistrictGisUnsupported;

  /** Full parcel record for the info panel + history timeline. */
  getParcelDetail(parcelId: string): ParcelDetail | null;

  /** Search across survey/khasra/patta number, village name, owner name, record ID. */
  searchParcels(query: string): SearchResult[];

  /** District codes (matching lib/gov/db.ts DISTRICTS[].code) this adapter has parcel-level data for. */
  listSupportedDistrictCodes(): string[];
}
