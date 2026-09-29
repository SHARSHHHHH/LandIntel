import type {
  DisputeStatus,
  LandUseClass,
  MutationStatus,
  ParcelDetail,
  ParcelHistoryEntry,
  ParcelOwner,
  ParcelSummary,
  SubDistrictDetail,
  VillageSummary,
} from "../types";

/**
 * Generated SAMPLE hierarchy (Tehsil/Taluk/Mandal -> Village -> Parcel) for
 * five pilot districts spanning three terminology zones. There is no real
 * cadastral dataset available in this sandbox below the district level, so
 * everything here is synthetic-but-structured demo data, deterministically
 * generated (not random per page load) so it's stable across requests.
 *
 * District/state names and codes match the REAL rows in lib/gov/db.ts
 * (DISTRICTS[].code) so this plugs into the real district picked upstream.
 */

interface VillageConfig {
  name: string;
  center: { lat: number; lng: number };
}

interface SubDistrictConfig {
  name: string;
  villages: VillageConfig[];
}

interface PilotDistrictConfig {
  districtCode: string;
  districtName: string;
  stateCode: string;
  stateName: string;
  parcelIdLabel: string;
  /** State-specific field this pilot district's records carry that others don't. */
  extraField: { label: string } | null;
  subDistricts: SubDistrictConfig[];
}

const PILOT_DISTRICTS: PilotDistrictConfig[] = [
  {
    districtCode: "RJ-JAIPUR",
    districtName: "Jaipur",
    stateCode: "RJ",
    stateName: "Rajasthan",
    parcelIdLabel: "Khasra No.",
    extraField: { label: "Jamabandi (record-of-rights) reference" },
    subDistricts: [
      {
        name: "Jaipur Tehsil",
        villages: [
          { name: "Achrol", center: { lat: 27.0464, lng: 75.9765 } },
          { name: "Bassi", center: { lat: 26.8339, lng: 76.0526 } },
        ],
      },
      {
        name: "Sanganer Tehsil",
        villages: [{ name: "Mahapura", center: { lat: 26.7801, lng: 75.7864 } }],
      },
    ],
  },
  {
    districtCode: "PB-LUDHIANA",
    districtName: "Ludhiana",
    stateCode: "PB",
    stateName: "Punjab",
    parcelIdLabel: "Khasra No.",
    extraField: { label: "Jamabandi year" },
    subDistricts: [
      {
        name: "Ludhiana East Tehsil",
        villages: [
          { name: "Sidhwan Bet", center: { lat: 30.9871, lng: 75.7601 } },
          { name: "Jodhan", center: { lat: 30.8321, lng: 75.7215 } },
        ],
      },
      {
        name: "Samrala Tehsil",
        villages: [{ name: "Sahnewal", center: { lat: 30.8069, lng: 75.9515 } }],
      },
    ],
  },
  {
    districtCode: "TN-CHENNAI",
    districtName: "Chennai",
    stateCode: "TN",
    stateName: "Tamil Nadu",
    parcelIdLabel: "Survey No.",
    extraField: { label: "Patta number" },
    subDistricts: [
      {
        name: "Mylapore Taluk",
        villages: [
          { name: "Mylapore", center: { lat: 13.0339, lng: 80.2619 } },
          { name: "Adyar", center: { lat: 13.0067, lng: 80.2569 } },
        ],
      },
      {
        name: "Egmore Taluk",
        villages: [{ name: "Egmore", center: { lat: 13.0732, lng: 80.2609 } }],
      },
    ],
  },
  {
    districtCode: "KA-BLRURBAN",
    districtName: "Bengaluru Urban",
    stateCode: "KA",
    stateName: "Karnataka",
    parcelIdLabel: "Survey No.",
    extraField: { label: "RTC (Record of Rights, Tenancy & Crops) number" },
    subDistricts: [
      {
        name: "Bengaluru North Taluk",
        villages: [
          { name: "Yelahanka", center: { lat: 13.1007, lng: 77.5963 } },
          { name: "Hebbal", center: { lat: 13.0358, lng: 77.5971 } },
        ],
      },
      {
        name: "Anekal Taluk",
        villages: [{ name: "Attibele", center: { lat: 12.7788, lng: 77.7716 } }],
      },
    ],
  },
  {
    districtCode: "TS-HYDERABAD",
    districtName: "Hyderabad",
    stateCode: "TS",
    stateName: "Telangana",
    parcelIdLabel: "Pattadar Passbook No.",
    extraField: { label: "Encumbrance status" },
    subDistricts: [
      {
        name: "Secunderabad Mandal",
        villages: [
          { name: "Marredpally", center: { lat: 17.4448, lng: 78.4988 } },
          { name: "Bowenpally", center: { lat: 17.4707, lng: 78.4842 } },
        ],
      },
      {
        name: "Charminar Mandal",
        villages: [{ name: "Chandrayangutta", center: { lat: 17.3384, lng: 78.4771 } }],
      },
    ],
  },
];

const LAND_USE_CYCLE: LandUseClass[] = ["Agricultural", "Residential", "Commercial", "Government", "Vacant/Barren"];
const OWNER_FIRST = ["Ramesh", "Sunita", "Anil", "Priya", "Manoj", "Kavita", "Suresh", "Lakshmi", "Vijay", "Geeta", "Arjun", "Meena"];
const OWNER_LAST = ["Sharma", "Verma", "Reddy", "Nair", "Singh", "Gupta", "Iyer", "Patel", "Yadav", "Kumar"];

function seededIndex(seed: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % mod;
}

function ownerName(seed: string): string {
  return `${OWNER_FIRST[seededIndex(seed + "f", OWNER_FIRST.length)]} ${OWNER_LAST[seededIndex(seed + "l", OWNER_LAST.length)]}`;
}

function buildHistory(seed: string, disputeStatus: DisputeStatus, mutationStatus: MutationStatus): ParcelHistoryEntry[] {
  const entries: ParcelHistoryEntry[] = [
    {
      year: 2014 + seededIndex(seed + "reg", 6),
      event: "Registered",
      note: "Initial registration of the parcel in the revenue record.",
      documentRef: `REG-${seededIndex(seed + "regdoc", 90000) + 10000}`,
    },
  ];
  if (mutationStatus !== "no_mutation") {
    entries.push({
      year: 2019 + seededIndex(seed + "mut", 6),
      event: mutationStatus === "mutated" ? "Mutation: ownership transfer completed" : "Mutation: transfer application pending",
      note:
        mutationStatus === "mutated"
          ? "Ownership transferred following a registered sale deed; revenue record updated."
          : "Transfer application filed; revenue record update pending verification.",
      documentRef: `MUT-${seededIndex(seed + "mutdoc", 90000) + 10000}`,
    });
  }
  if (disputeStatus !== "none") {
    entries.push({
      year: 2022 + seededIndex(seed + "dis", 3),
      event: disputeStatus === "open" ? "Dispute filed" : "Dispute resolved",
      note:
        disputeStatus === "open"
          ? "Boundary/ownership dispute filed at the revenue court; case is pending."
          : "Boundary/ownership dispute resolved by revenue court order; record updated.",
      documentRef: `CASE-${seededIndex(seed + "casedoc", 90000) + 10000}`,
    });
  }
  return entries.sort((a, b) => a.year - b.year);
}

export interface BuiltParcel extends ParcelDetail {}

export interface BuiltVillage {
  id: string;
  name: string;
  subDistrictId: string;
  center: { lat: number; lng: number };
  parcels: BuiltParcel[];
}

export interface BuiltSubDistrict {
  id: string;
  name: string;
  districtCode: string;
  villages: BuiltVillage[];
}

export interface BuiltDistrict {
  districtCode: string;
  districtName: string;
  stateCode: string;
  stateName: string;
  parcelIdLabel: string;
  subDistricts: BuiltSubDistrict[];
}

const LAT_STEP = 0.0016;
const LNG_STEP = 0.002;
const PARCEL_COLS = 3;
const PARCEL_ROWS = 2;

function buildVillageParcels(
  district: PilotDistrictConfig,
  subDistrictName: string,
  village: VillageConfig,
  villageId: string
): BuiltParcel[] {
  const parcels: BuiltParcel[] = [];
  let n = 0;
  for (let row = 0; row < PARCEL_ROWS; row++) {
    for (let col = 0; col < PARCEL_COLS; col++) {
      n++;
      const seed = `${district.districtCode}|${village.name}|${n}`;
      const south = village.center.lat + row * LAT_STEP;
      const north = south + LAT_STEP * 0.85;
      const west = village.center.lng + col * LNG_STEP;
      const east = west + LNG_STEP * 0.85;
      const centroid = { lat: (south + north) / 2, lng: (west + east) / 2 };
      const landUse = LAND_USE_CYCLE[seededIndex(seed + "lu", LAND_USE_CYCLE.length)];
      const disputeStatus: DisputeStatus =
        seededIndex(seed + "dispute", 5) === 0 ? "open" : seededIndex(seed + "dispute2", 6) === 0 ? "closed" : "none";
      const mutationStatus: MutationStatus =
        seededIndex(seed + "mutation", 3) === 0 ? "mutation_pending" : seededIndex(seed + "mutation2", 2) === 0 ? "mutated" : "no_mutation";
      const ownerCount = 1 + seededIndex(seed + "ownercount", 2);
      const owners: ParcelOwner[] = Array.from({ length: ownerCount }).map((_, i) => ({
        name: ownerName(seed + "owner" + i),
        share: ownerCount === 1 ? "100%" : `${Math.round(100 / ownerCount)}%`,
      }));
      const areaHectares = Math.round((0.4 + seededIndex(seed + "area", 40) / 20) * 100) / 100;
      const surveyNumber = `${seededIndex(seed + "survey", 400) + 100}${["", "/A", "/B"][seededIndex(seed + "sub", 3)]}`;
      const parcelId = `${district.districtCode}-${villageId}-P${n}`;
      const recordId = `${district.stateCode}-LR-${district.districtCode.split("-")[1]}-${seededIndex(seed + "record", 900000) + 100000}`;

      const extraFields = district.extraField
        ? [
            {
              label: district.extraField.label,
              value:
                district.extraField.label === "Encumbrance status"
                  ? disputeStatus === "open"
                    ? "Encumbered (dispute noted)"
                    : "Not encumbered"
                  : district.extraField.label === "Jamabandi year"
                  ? String(2018 + seededIndex(seed + "jy", 6))
                  : `${district.stateCode}-${seededIndex(seed + "ef", 90000) + 10000}`,
            },
          ]
        : [];

      const parcel: BuiltParcel = {
        id: parcelId,
        villageId,
        subDistrictId: villageId.split("-V")[0],
        surveyNumber,
        areaHectares,
        landUse,
        disputeStatus,
        centroid,
        villageName: village.name,
        subDistrictName,
        districtName: district.districtName,
        districtCode: district.districtCode,
        stateName: district.stateName,
        parcelIdLabel: district.parcelIdLabel,
        owners,
        recordId,
        mutationStatus,
        extraFields,
        history: buildHistory(seed, disputeStatus, mutationStatus),
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [west, south],
              [east, south],
              [east, north],
              [west, north],
              [west, south],
            ],
          ],
        },
        provenance: {
          source_name: "GIS module sample dataset (generated for this demo)",
          as_of_date: "2026-09-01",
          data_status: "SAMPLE",
          note: "Synthetic parcel record for demonstration only -- not a verified government land record. Structure mirrors typical state land-record fields; values are generated, not surveyed.",
        },
      };
      parcels.push(parcel);
    }
  }
  return parcels;
}

export const PILOT_DATASET: BuiltDistrict[] = PILOT_DISTRICTS.map((district) => ({
  districtCode: district.districtCode,
  districtName: district.districtName,
  stateCode: district.stateCode,
  stateName: district.stateName,
  parcelIdLabel: district.parcelIdLabel,
  subDistricts: district.subDistricts.map((sd, sdIdx) => {
    const subDistrictId = `${district.districtCode}-SD${sdIdx + 1}`;
    return {
      id: subDistrictId,
      name: sd.name,
      districtCode: district.districtCode,
      villages: sd.villages.map((v, vIdx) => {
        const villageId = `${subDistrictId}-V${vIdx + 1}`;
        return {
          id: villageId,
          name: v.name,
          subDistrictId,
          center: v.center,
          parcels: buildVillageParcels(district, sd.name, v, villageId),
        };
      }),
    };
  }),
}));

export const PARCEL_INDEX: Map<string, BuiltParcel> = new Map();
for (const d of PILOT_DATASET) {
  for (const sd of d.subDistricts) {
    for (const v of sd.villages) {
      for (const p of v.parcels) PARCEL_INDEX.set(p.id, p);
    }
  }
}

export function toParcelSummary(p: BuiltParcel): ParcelSummary {
  return {
    id: p.id,
    villageId: p.villageId,
    subDistrictId: p.subDistrictId,
    surveyNumber: p.surveyNumber,
    areaHectares: p.areaHectares,
    landUse: p.landUse,
    disputeStatus: p.disputeStatus,
    centroid: p.centroid,
  };
}

export function toVillageSummary(v: BuiltVillage): VillageSummary {
  return { id: v.id, name: v.name, parcelCount: v.parcels.length, centroid: v.center };
}

export function toSubDistrictDetail(sd: BuiltSubDistrict): SubDistrictDetail {
  return {
    id: sd.id,
    name: sd.name,
    villageCount: sd.villages.length,
    villages: sd.villages.map(toVillageSummary),
  };
}
