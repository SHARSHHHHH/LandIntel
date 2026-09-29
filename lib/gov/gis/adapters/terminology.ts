import type { Terminology } from "../types";

/**
 * Per-state admin-level vocabulary. Real Indian states use different names
 * for the level below district (and occasionally for the parcel identifier
 * itself); this keeps that out of hardcoded English strings in the UI.
 *
 * This list is illustrative, not exhaustive -- it covers the states with
 * seeded districts in lib/gov/db.ts. Any state not listed falls back to
 * DEFAULT_TERMINOLOGY below.
 */
const BY_STATE_CODE: Record<string, Omit<Terminology, "stateCode">> = {
  RJ: { stateName: "Rajasthan", subDistrictTerm: "Tehsil", villageTerm: "Village", parcelIdLabel: "Khasra No." },
  PB: { stateName: "Punjab", subDistrictTerm: "Tehsil", villageTerm: "Village", parcelIdLabel: "Khasra No." },
  HR: { stateName: "Haryana", subDistrictTerm: "Tehsil", villageTerm: "Village", parcelIdLabel: "Khasra No." },
  UP: { stateName: "Uttar Pradesh", subDistrictTerm: "Tehsil", villageTerm: "Village", parcelIdLabel: "Khasra/Gata No." },
  MP: { stateName: "Madhya Pradesh", subDistrictTerm: "Tehsil", villageTerm: "Village", parcelIdLabel: "Khasra No." },
  BR: { stateName: "Bihar", subDistrictTerm: "Circle (Anchal)", villageTerm: "Village (Mauza)", parcelIdLabel: "Khata/Khesra No." },
  JH: { stateName: "Jharkhand", subDistrictTerm: "Circle (Anchal)", villageTerm: "Village (Mauza)", parcelIdLabel: "Khata/Khesra No." },
  UK: { stateName: "Uttarakhand", subDistrictTerm: "Tehsil", villageTerm: "Village", parcelIdLabel: "Khasra No." },
  HP: { stateName: "Himachal Pradesh", subDistrictTerm: "Tehsil", villageTerm: "Village", parcelIdLabel: "Khasra No." },
  DL: { stateName: "Delhi", subDistrictTerm: "Tehsil", villageTerm: "Village", parcelIdLabel: "Khasra No." },

  TN: { stateName: "Tamil Nadu", subDistrictTerm: "Taluk", villageTerm: "Revenue Village", parcelIdLabel: "Survey No." },
  KA: { stateName: "Karnataka", subDistrictTerm: "Taluk", villageTerm: "Village", parcelIdLabel: "Survey No." },
  MH: { stateName: "Maharashtra", subDistrictTerm: "Taluka", villageTerm: "Village", parcelIdLabel: "Survey/Gat No." },
  GJ: { stateName: "Gujarat", subDistrictTerm: "Taluka", villageTerm: "Village", parcelIdLabel: "Survey No." },

  TS: { stateName: "Telangana", subDistrictTerm: "Mandal", villageTerm: "Village", parcelIdLabel: "Pattadar Passbook No." },
  AP: { stateName: "Andhra Pradesh", subDistrictTerm: "Mandal", villageTerm: "Village", parcelIdLabel: "Survey No." },

  WB: { stateName: "West Bengal", subDistrictTerm: "Block", villageTerm: "Mouza", parcelIdLabel: "Dag No." },
  OD: { stateName: "Odisha", subDistrictTerm: "Tehsil", villageTerm: "Village (Mouza)", parcelIdLabel: "Plot No." },
  AS: { stateName: "Assam", subDistrictTerm: "Revenue Circle", villageTerm: "Village (Mouza)", parcelIdLabel: "Dag No." },
  KL: { stateName: "Kerala", subDistrictTerm: "Taluk", villageTerm: "Village", parcelIdLabel: "Survey No./Re-survey No." },
  CG: { stateName: "Chhattisgarh", subDistrictTerm: "Tehsil", villageTerm: "Village", parcelIdLabel: "Khasra No." },
};

const DEFAULT_TERMINOLOGY: Omit<Terminology, "stateCode"> = {
  stateName: "State",
  subDistrictTerm: "Sub-district (Tehsil/Taluk equivalent)",
  villageTerm: "Village",
  parcelIdLabel: "Survey/Parcel No.",
};

export function getTerminology(stateCode: string): Terminology {
  const cfg = BY_STATE_CODE[stateCode] ?? DEFAULT_TERMINOLOGY;
  return { stateCode, ...cfg };
}
