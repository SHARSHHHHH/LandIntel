import type { LandRecordAdapter } from "./types";
import { getTerminology } from "./terminology";
import { PARCEL_INDEX, PILOT_DATASET, toParcelSummary, toSubDistrictDetail } from "./sampleParcels";
import type {
  DistrictGisLayers,
  DistrictGisUnsupported,
  GisLayerKey,
  ParcelDetail,
  Provenance,
  SearchResult,
  SubDistrictDetail,
} from "../types";

const LANDUSE_COLOR: Record<string, string> = {
  Agricultural: "#8a9a5b",
  Residential: "#b8862b",
  Commercial: "#A8752A",
  Government: "#5b6b8a",
  "Vacant/Barren": "#9c9284",
  "Water body": "#2e6f9e",
};

function sampleProvenance(note: string): Provenance {
  return {
    source_name: "GIS module sample dataset (generated for this demo)",
    as_of_date: "2026-09-01",
    data_status: "SAMPLE",
    note,
  };
}

/**
 * Reference implementation of LandRecordAdapter backing this demo's
 * generated parcel-level data. See README.md for how a real state adapter
 * (Bhoomi, Dharani, DILRMP, ...) plugs in alongside/instead of this one.
 */
export const sampleDataAdapter: LandRecordAdapter = {
  getTerminology(stateCode: string) {
    return getTerminology(stateCode);
  },

  listSupportedDistrictCodes() {
    return PILOT_DATASET.map((d) => d.districtCode);
  },

  getHierarchy(districtCode: string): SubDistrictDetail[] | null {
    const district = PILOT_DATASET.find((d) => d.districtCode === districtCode);
    if (!district) return null;
    return district.subDistricts.map(toSubDistrictDetail);
  },

  getDistrictLayers(districtCode, districtName, stateName): DistrictGisLayers | DistrictGisUnsupported {
    const terminology = getTerminology(
      PILOT_DATASET.find((d) => d.districtCode === districtCode)?.stateCode ?? districtCode.split("-")[0]
    );
    const district = PILOT_DATASET.find((d) => d.districtCode === districtCode);
    if (!district) {
      return {
        supported: false,
        terminology,
        message: `No parcel-level sample data available yet for ${districtName}, ${stateName}. Pilot sample coverage currently exists for Jaipur (RJ), Ludhiana (PB), Chennai (TN), Bengaluru Urban (KA) and Hyderabad (TS).`,
      };
    }

    const parcelFeatures: GeoJSON.Feature[] = [];
    const landuseFeatures: GeoJSON.Feature[] = [];
    const govFeatures: GeoJSON.Feature[] = [];
    const disputedFeatures: GeoJSON.Feature[] = [];
    const roadFeatures: GeoJSON.Feature[] = [];
    const waterFeatures: GeoJSON.Feature[] = [];

    for (const sd of district.subDistricts) {
      for (const v of sd.villages) {
        // One illustrative road running through the village's parcel grid.
        const lats = v.parcels.map((p) => p.centroid.lat);
        const lngs = v.parcels.map((p) => p.centroid.lng);
        const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        roadFeatures.push({
          type: "Feature",
          properties: { name: `${v.name} approach road (illustrative)` },
          geometry: {
            type: "LineString",
            coordinates: [
              [Math.min(...lngs) - 0.001, midLat],
              [Math.max(...lngs) + 0.001, midLat],
            ],
          },
        });
        // One small illustrative pond/water body near the village.
        const wSouth = v.center.lat - 0.0009;
        const wWest = v.center.lng - 0.0012;
        waterFeatures.push({
          type: "Feature",
          properties: { name: `${v.name} pond (illustrative)` },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [wWest, wSouth],
                [wWest + 0.0006, wSouth],
                [wWest + 0.0006, wSouth + 0.0006],
                [wWest, wSouth + 0.0006],
                [wWest, wSouth],
              ],
            ],
          },
        });

        for (const p of v.parcels) {
          const label = `${terminology.parcelIdLabel} ${p.surveyNumber} - ${v.name}`;
          const feature = (color: string): GeoJSON.Feature => ({
            type: "Feature",
            properties: { parcelId: p.id, label, landUse: p.landUse, disputeStatus: p.disputeStatus, color },
            geometry: p.geometry,
          });
          parcelFeatures.push(feature("#152238"));
          landuseFeatures.push(feature(LANDUSE_COLOR[p.landUse] ?? "#152238"));
          if (p.landUse === "Government") govFeatures.push(feature("#5b6b8a"));
          if (p.disputeStatus === "open") disputedFeatures.push(feature("#b0392f"));
        }
      }
    }

    const layers: Record<GisLayerKey, GeoJSON.FeatureCollection> = {
      parcels: { type: "FeatureCollection", features: parcelFeatures },
      landuse: { type: "FeatureCollection", features: landuseFeatures },
      governmentLand: { type: "FeatureCollection", features: govFeatures },
      roads: { type: "FeatureCollection", features: roadFeatures },
      water: { type: "FeatureCollection", features: waterFeatures },
      disputed: { type: "FeatureCollection", features: disputedFeatures },
    };

    const provenance: Record<GisLayerKey, Provenance> = {
      parcels: sampleProvenance("Generated sample parcel boundaries -- simplified rectangles standing in for surveyed cadastral shapes."),
      landuse: sampleProvenance("Land-use classification assigned by a fixed generation rule for this demo, not a real land-use survey."),
      governmentLand: sampleProvenance("Subset of sample parcels tagged 'Government' land use; illustrative only, not a verified government land inventory."),
      roads: sampleProvenance("One illustrative road per pilot village, not a surveyed road network."),
      water: sampleProvenance("One illustrative pond per pilot village, not a surveyed water-body inventory."),
      disputed: sampleProvenance("Subset of sample parcels flagged with an open dispute status for this demo, not a real case registry."),
    };

    return { supported: true, terminology, layers, provenance };
  },

  getParcelDetail(parcelId: string): ParcelDetail | null {
    const p = PARCEL_INDEX.get(parcelId);
    return p ?? null;
  },

  searchParcels(query: string): SearchResult[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results: SearchResult[] = [];
    for (const d of PILOT_DATASET) {
      for (const sd of d.subDistricts) {
        for (const v of sd.villages) {
          for (const p of v.parcels) {
            let matchedOn: SearchResult["matchedOn"] | null = null;
            if (p.surveyNumber.toLowerCase().includes(q)) matchedOn = "survey_number";
            else if (v.name.toLowerCase().includes(q)) matchedOn = "village_name";
            else if (p.owners.some((o) => o.name.toLowerCase().includes(q))) matchedOn = "owner_name";
            else if (p.recordId.toLowerCase().includes(q)) matchedOn = "record_id";
            if (matchedOn) {
              results.push({
                parcelId: p.id,
                districtId: d.districtCode,
                subDistrictId: sd.id,
                villageId: v.id,
                surveyNumber: p.surveyNumber,
                villageName: v.name,
                ownerNames: p.owners.map((o) => o.name),
                recordId: p.recordId,
                matchedOn,
                centroid: p.centroid,
              });
            }
          }
        }
      }
    }
    return results.slice(0, 50);
  },
};

// toParcelSummary is re-exported for API routes that need lightweight
// parcel listings without the full detail/geometry payload.
export { toParcelSummary };
