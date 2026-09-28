import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export const DATA_DIR = path.join(process.cwd(), "data");

export const UPLOAD_DIR = path.join(process.cwd(), "uploads", "gov");
export const MAX_UPLOAD_SIZE_MB = 20;

export function uid(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  department TEXT,
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS geographic_units (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  parent_id TEXT,
  geometry_geojson TEXT,
  centroid_lat REAL,
  centroid_lng REAL,
  source_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS data_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  base_url TEXT,
  access_type TEXT NOT NULL,
  license TEXT,
  status TEXT NOT NULL DEFAULT 'unconfigured',
  config_ref TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS datasets (
  id TEXT PRIMARY KEY,
  data_source_id TEXT NOT NULL,
  name TEXT NOT NULL,
  data_status TEXT NOT NULL,
  reference_year INTEGER,
  last_updated TEXT,
  geographic_level TEXT,
  coverage_note TEXT,
  limitations TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dataset_fields (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  unit TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS indicators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT
);

CREATE TABLE IF NOT EXISTS indicator_values (
  id TEXT PRIMARY KEY,
  indicator_id TEXT NOT NULL,
  geographic_unit_id TEXT NOT NULL,
  dataset_id TEXT NOT NULL,
  value REAL,
  value_text TEXT,
  derivation_method TEXT,
  UNIQUE (indicator_id, geographic_unit_id, dataset_id)
);

CREATE TABLE IF NOT EXISTS map_layers (
  id TEXT PRIMARY KEY,
  geographic_unit_id TEXT NOT NULL,
  name TEXT NOT NULL,
  layer_type TEXT NOT NULL,
  data_status TEXT NOT NULL,
  dataset_id TEXT,
  geojson TEXT,
  style TEXT
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source_organization TEXT NOT NULL,
  publication_date TEXT,
  document_type TEXT,
  geographic_unit_id TEXT,
  source_url TEXT NOT NULL,
  data_status TEXT NOT NULL DEFAULT 'OFFICIAL',
  summary TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  extra TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  geographic_unit_id TEXT,
  owner_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_members (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor',
  added_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_items (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  reference_id TEXT,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  geographic_unit_id TEXT,
  workspace_id TEXT,
  owner_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS report_sections (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  section_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  reference_id TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS schemes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT NOT NULL,
  scheme_type TEXT,
  launch_year INTEGER,
  status_note TEXT,
  source_url TEXT NOT NULL,
  data_status TEXT NOT NULL DEFAULT 'OFFICIAL',
  as_of_date TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'system',
  related_url TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_searches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  query TEXT,
  geographic_unit_id TEXT,
  document_type TEXT,
  created_at TEXT NOT NULL
);
`;

let _db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (_db) return _db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(path.join(DATA_DIR, "gov.db"));
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);
  _db = db;
  seedIfEmpty(db);
  return db;
}

// ---------------------------------------------------------------------------
// Seed data: a runnable demo spanning 21 states/UTs (23 districts total).
// Ported faithfully from the original FastAPI backend's app/seed_data.py.
// Every row is explicit about whether it is OFFICIAL / HISTORICAL / DERIVED.
// ---------------------------------------------------------------------------

const PERMISSIONS = [
  "view_area_overview",
  "view_documents",
  "view_data_sources",
  "export_area_summary",
  "manage_workspaces",
  "manage_reports",
  "view_schemes",
];

interface DistrictRow {
  state: string;
  state_code: string;
  district: string;
  code: string;
  population: number;
  density: number;
  literacy: number;
  sex_ratio: number;
  area_sq_km: number;
  hq_lat: number;
  hq_lng: number;
  source_url: string;
  source_label: string;
  forest_pct?: number;
  forest_source_url?: string;
  forest_source_label?: string;
  geometry_key?: string;
  geometry_note?: string;
}

const DISTRICTS: DistrictRow[] = [
  { state: "Rajasthan", state_code: "RJ", district: "Jaipur", code: "RJ-JAIPUR", population: 6626178, density: 595, literacy: 76.0, sex_ratio: 910, area_sq_km: 11143, hq_lat: 26.9124, hq_lng: 75.7873, source_url: "https://data.gov.in/", source_label: "Census of India 2011 - District Census Handbook", forest_pct: 4.96, forest_source_url: "https://apfstatic.s3.ap-south-1.amazonaws.com/s3fs-public/Jaipur_0.pdf", forest_source_label: "Rajasthan district forest profile (state forest department)" },
  { state: "Rajasthan", state_code: "RJ", district: "Jodhpur", code: "RJ-JODHPUR", population: 3687165, density: 161.4, literacy: 67.09, sex_ratio: 915, area_sq_km: 22850, hq_lat: 26.2389, hq_lng: 73.0243, source_url: "https://en.wikipedia.org/wiki/Jodhpur_district", source_label: "Census of India 2011 (via Wikipedia district summary)" },
  { state: "Rajasthan", state_code: "RJ", district: "Udaipur", code: "RJ-UDAIPUR", population: 3068420, density: 242, literacy: 62.74, sex_ratio: 958, area_sq_km: 12692, hq_lat: 24.5854, hq_lng: 73.7125, source_url: "https://en.wikipedia.org/wiki/Udaipur_district", source_label: "Census of India 2011 (via Wikipedia district summary)" },
  { state: "Maharashtra", state_code: "MH", district: "Pune", code: "MH-PUNE", population: 9429408, density: 603, literacy: 87.19, sex_ratio: 919, area_sq_km: 15643, hq_lat: 18.5204, hq_lng: 73.8567, source_url: "https://en.wikipedia.org/wiki/Pune_district", source_label: "Census of India 2011 (via Wikipedia district summary)" },
  { state: "Karnataka", state_code: "KA", district: "Bengaluru Urban", code: "KA-BLRURBAN", population: 9621551, density: 4381, literacy: 88.48, sex_ratio: 908, area_sq_km: 2196, hq_lat: 12.9716, hq_lng: 77.5946, source_url: "https://en.wikipedia.org/wiki/Bengaluru_Urban_district", source_label: "Census of India 2011 (via Wikipedia district summary)" },
  { state: "Tamil Nadu", state_code: "TN", district: "Chennai", code: "TN-CHENNAI", population: 4646732, density: 26553, literacy: 90.18, sex_ratio: 989, area_sq_km: 175, hq_lat: 13.0827, hq_lng: 80.2707, source_url: "https://www.census2011.co.in/census/district/21-chennai.html", source_label: "Census of India 2011 (census2011.co.in tabulation)", forest_pct: 1.16, forest_source_url: "https://en.wikipedia.org/wiki/Chennai_district", forest_source_label: "Chennai district profile (Wikipedia, citing forest department figures)" },
  { state: "Uttar Pradesh", state_code: "UP", district: "Lucknow", code: "UP-LUCKNOW", population: 4589838, density: 1816, literacy: 82.0, sex_ratio: 910, area_sq_km: 2528, hq_lat: 26.8467, hq_lng: 80.9462, source_url: "https://en.wikipedia.org/wiki/Lucknow_district", source_label: "Census of India 2011 (via Wikipedia district summary)", forest_pct: 5.19, forest_source_url: "https://en.wikipedia.org/wiki/Lucknow_district", forest_source_label: "Lucknow district forest cover, 2008-09 (Wikipedia, citing forest department figures)" },
  { state: "Madhya Pradesh", state_code: "MP", district: "Bhopal", code: "MP-BHOPAL", population: 2371061, density: 855.4, literacy: 82.3, sex_ratio: 911, area_sq_km: 2772, hq_lat: 23.2599, hq_lng: 77.4126, source_url: "https://en.wikipedia.org/wiki/Bhopal_district", source_label: "Census of India 2011 (via Wikipedia district summary)" },
  { state: "Gujarat", state_code: "GJ", district: "Ahmedabad", code: "GJ-AHMEDABAD", population: 7214225, density: 892.1, literacy: 85.31, sex_ratio: 904, area_sq_km: 8087, hq_lat: 23.0225, hq_lng: 72.5714, source_url: "https://en.wikipedia.org/wiki/Ahmedabad_district", source_label: "Census of India 2011 (via Wikipedia district summary)" },
  { state: "West Bengal", state_code: "WB", district: "Kolkata", code: "WB-KOLKATA", population: 4496694, density: 24306, literacy: 86.31, sex_ratio: 908, area_sq_km: 185, hq_lat: 22.5726, hq_lng: 88.3639, source_url: "https://www.census2011.co.in/census/district/16-kolkata.html", source_label: "Census of India 2011 (census2011.co.in tabulation)" },
  { state: "Bihar", state_code: "BR", district: "Patna", code: "BR-PATNA", population: 5838465, density: 1823, literacy: 70.68, sex_ratio: 897, area_sq_km: 3202, hq_lat: 25.5941, hq_lng: 85.1376, source_url: "https://en.wikipedia.org/wiki/Patna_district", source_label: "Census of India 2011 (via Wikipedia district summary)" },
  { state: "Kerala", state_code: "KL", district: "Thiruvananthapuram", code: "KL-TVM", population: 3301427, density: 1509, literacy: 92.66, sex_ratio: 1088, area_sq_km: 2192, hq_lat: 8.5241, hq_lng: 76.9366, source_url: "https://en.wikipedia.org/wiki/Thiruvananthapuram_district", source_label: "Census of India 2011 (via Wikipedia district summary)" },
  { state: "Telangana", state_code: "TS", district: "Hyderabad", code: "TS-HYDERABAD", population: 3943323, density: 18200, literacy: 83.25, sex_ratio: 954, area_sq_km: 217, hq_lat: 17.385, hq_lng: 78.4867, source_url: "https://en.wikipedia.org/wiki/Hyderabad_district,_India", source_label: "Census of India 2011 (via Wikipedia district summary)" },
  { state: "Punjab", state_code: "PB", district: "Ludhiana", code: "PB-LUDHIANA", population: 3498739, density: 975, literacy: 73.5, sex_ratio: 873, area_sq_km: 3767, hq_lat: 30.901, hq_lng: 75.8573, source_url: "https://en.wikipedia.org/wiki/Ludhiana_district", source_label: "Census of India 2011 (via Wikipedia district summary)" },
  { state: "Haryana", state_code: "HR", district: "Gurugram", code: "HR-GURUGRAM", population: 1514432, density: 1204, literacy: 84.4, sex_ratio: 853, area_sq_km: 1258, hq_lat: 28.4595, hq_lng: 77.0266, source_url: "https://en.wikipedia.org/wiki/Gurgaon_district", source_label: "Census of India 2011 (via Wikipedia district summary)" },
  { state: "Odisha", state_code: "OD", district: "Khordha", code: "OD-KHORDHA", population: 2251673, density: 799, literacy: 87.51, sex_ratio: 925, area_sq_km: 2813, hq_lat: 20.183, hq_lng: 85.6132, source_url: "https://en.wikipedia.org/wiki/Khordha_district", source_label: "Census of India 2011 (via Wikipedia district summary)", forest_pct: 22.0, forest_source_url: "https://en.wikipedia.org/wiki/Khordha_district", forest_source_label: "Khordha district forested area, 618.67 km2 of 2813 km2 (Wikipedia, citing forest department figures)" },
  { state: "Assam", state_code: "AS", district: "Kamrup Metropolitan", code: "AS-KAMRUPM", population: 1253938, density: 820.7, literacy: 88.66, sex_ratio: 922, area_sq_km: 1527.84, hq_lat: 26.1445, hq_lng: 91.7362, source_url: "https://en.wikipedia.org/wiki/Kamrup_Metropolitan_district", source_label: "Census of India 2011 (via Wikipedia district summary)" },
  { state: "Delhi", state_code: "DL", district: "New Delhi", code: "DL-NEWDELHI", population: 142004, density: 4057, literacy: 88.34, sex_ratio: 822, area_sq_km: 35, hq_lat: 28.6139, hq_lng: 77.209, source_url: "https://www.census2011.co.in/census/district/172-new-delhi.html", source_label: "Census of India 2011 (census2011.co.in tabulation)", geometry_key: "Delhi|Delhi", geometry_note: "No New Delhi-district-specific boundary was available in the open compiled dataset used for this map; the polygon shown is the full National Capital Territory of Delhi as a stand-in, not the smaller New Delhi district boundary that the population/density figures above refer to." },
  { state: "Andhra Pradesh", state_code: "AP", district: "Visakhapatnam", code: "AP-VISAKHAPATNAM", population: 4290589, density: 384, literacy: 66.91, sex_ratio: 1006, area_sq_km: 11161, hq_lat: 17.6868, hq_lng: 83.2185, source_url: "https://www.census2011.co.in/census/district/130-visakhapatnam.html", source_label: "Census of India 2011 (census2011.co.in tabulation)" },
  { state: "Jharkhand", state_code: "JH", district: "Ranchi", code: "JH-RANCHI", population: 2914253, density: 572, literacy: 76.06, sex_ratio: 950, area_sq_km: 5097, hq_lat: 23.3441, hq_lng: 85.3096, source_url: "https://en.wikipedia.org/wiki/Ranchi_district", source_label: "Census of India 2011 (via Wikipedia district summary)" },
  { state: "Chhattisgarh", state_code: "CG", district: "Raipur", code: "CG-RAIPUR", population: 2160876, density: 747.2, literacy: 76.43, sex_ratio: 983, area_sq_km: 2891.98, hq_lat: 21.2514, hq_lng: 81.6296, source_url: "https://en.wikipedia.org/wiki/Raipur_district", source_label: "Census of India 2011 (via Wikipedia district summary)" },
  { state: "Uttarakhand", state_code: "UK", district: "Dehradun", code: "UK-DEHRADUN", population: 1696694, density: 549.4, literacy: 85.24, sex_ratio: 902, area_sq_km: 3088, hq_lat: 30.3165, hq_lng: 78.0322, source_url: "https://en.wikipedia.org/wiki/Dehradun_district", source_label: "Census of India 2011 (via Wikipedia district summary)" },
  { state: "Himachal Pradesh", state_code: "HP", district: "Shimla", code: "HP-SHIMLA", population: 814010, density: 158.6, literacy: 84.55, sex_ratio: 916, area_sq_km: 5131, hq_lat: 31.1048, hq_lng: 77.1734, source_url: "https://en.wikipedia.org/wiki/Shimla_district", source_label: "Census of India 2011 (via Wikipedia district summary)" },
];

function seedIfEmpty(db: Database.Database) {
  const hasUsers = db.prepare("SELECT id FROM users LIMIT 1").get();
  if (hasUsers) return;

  const boundariesPath = path.join(process.cwd(), "lib", "gov", "india_district_boundaries.json");
  const boundaries: Record<string, any> = JSON.parse(fs.readFileSync(boundariesPath, "utf-8"));

  const tx = db.transaction(() => {
    const now = nowIso();

    // --- Roles & permissions ---
    const permIds: Record<string, string> = {};
    const insertPerm = db.prepare("INSERT INTO permissions (id, code) VALUES (?, ?)");
    for (const code of PERMISSIONS) {
      const id = uid();
      permIds[code] = id;
      insertPerm.run(id, code);
    }
    const govRoleId = uid();
    db.prepare("INSERT INTO roles (id, name) VALUES (?, ?)").run(govRoleId, "gov_policy_user");
    const insertRolePerm = db.prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
    for (const code of PERMISSIONS) insertRolePerm.run(govRoleId, permIds[code]);

    const demoUserId = uid();
    db.prepare(
      "INSERT INTO users (id, email, full_name, department, password_hash, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)"
    ).run(
      demoUserId,
      "policy.user@dolr.gov.in",
      "Demo Government User",
      "Department of Land Resources (demo)",
      bcrypt.hashSync("ChangeMe123!", 10),
      now
    );
    db.prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)").run(demoUserId, govRoleId);

    // --- Data sources ---
    const insertSource = db.prepare(
      "INSERT INTO data_sources (id, name, provider, base_url, access_type, license, status, config_ref, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const censusSourceId = uid();
    insertSource.run(censusSourceId, "Census of India 2011 - District Census Handbook", "Office of the Registrar General & Census Commissioner, India", "https://data.gov.in", "bulk_download", "Government Open Data Licence - India (GODL)", "live", null, now);
    const wikipediaSourceId = uid();
    insertSource.run(wikipediaSourceId, "Census of India 2011 (via Wikipedia / census2011.co.in tabulations)", "Office of the Registrar General & Census Commissioner, India", "https://en.wikipedia.org", "manual", "Public domain (Government of India statistics); secondary tabulation text may carry its own licence", "live", null, now);
    const boundarySourceId = uid();
    insertSource.run(boundarySourceId, "India district boundaries (open compiled GeoJSON)", "Community-compiled from public administrative boundary data (github.com/udit-001/india-maps-data)", "https://github.com/udit-001/india-maps-data", "bulk_download", "Open (see repository for licence terms)", "live", null, now);
    const forestSourceId = uid();
    insertSource.run(forestSourceId, "State/district forest department profiles", "Various state forest departments and district administrations", null, "manual", "Government publication", "live", null, now);
    const datagovinSourceId = uid();
    insertSource.run(datagovinSourceId, "data.gov.in Open Government Data Platform", "National Informatics Centre (NIC)", "https://api.data.gov.in", "api", "Government Open Data Licence - India (GODL)", "unconfigured", "DATA_GOV_IN_API_KEY", now);

    // --- Indicators ---
    const insertIndicator = db.prepare("INSERT INTO indicators (id, name, category, unit) VALUES (?, ?, ?, ?)");
    function indicator(name: string, category: string, unit: string) {
      const id = uid();
      insertIndicator.run(id, name, category, unit);
      return id;
    }
    const populationInd = indicator("Population", "socioeconomic", "persons");
    const densityInd = indicator("Population density", "socioeconomic", "persons/km^2");
    const literacyInd = indicator("Literacy rate", "socioeconomic", "%");
    const sexRatioInd = indicator("Sex ratio", "socioeconomic", "females per 1000 males");
    const districtAreaInd = indicator("District area", "land", "km^2");
    const forestCoverInd = indicator("Forest cover", "land", "% of district area");

    const insertGeo = db.prepare(
      "INSERT INTO geographic_units (id, level, name, code, parent_id, geometry_geojson, centroid_lat, centroid_lng, source_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const insertDataset = db.prepare(
      "INSERT INTO datasets (id, data_source_id, name, data_status, reference_year, last_updated, geographic_level, coverage_note, limitations, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const insertField = db.prepare(
      "INSERT INTO dataset_fields (id, dataset_id, field_name, field_type, unit) VALUES (?, ?, ?, ?, ?)"
    );
    const insertIndicatorValue = db.prepare(
      "INSERT INTO indicator_values (id, indicator_id, geographic_unit_id, dataset_id, value, value_text, derivation_method) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    const insertMapLayer = db.prepare(
      "INSERT INTO map_layers (id, geographic_unit_id, name, layer_type, data_status, dataset_id, geojson, style) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );

    const stateIds: Record<string, string> = {};
    for (const row of DISTRICTS) {
      if (!stateIds[row.state]) {
        const stateId = uid();
        stateIds[row.state] = stateId;
        insertGeo.run(stateId, "state", row.state, row.state_code, null, null, null, null, null, now);
      }
    }

    let jaipurId: string | null = null;

    for (const row of DISTRICTS) {
      const stateId = stateIds[row.state];
      const districtId = uid();
      insertGeo.run(districtId, "district", row.district, row.code, stateId, null, row.hq_lat, row.hq_lng, null, now);
      if (row.district === "Jaipur") jaipurId = districtId;

      const isOwnCensusSource = row.source_label.startsWith("Census of India 2011 - District");
      const sourceId = isOwnCensusSource ? censusSourceId : wikipediaSourceId;

      const demoDatasetId = uid();
      insertDataset.run(
        demoDatasetId,
        sourceId,
        `${row.district} district demographic & area profile (Census 2011)`,
        "HISTORICAL",
        2011,
        "2011-03-01",
        "district",
        "Single reference point-in-time census; not updated since 2011.",
        `Census 2011 figures, checked against ${row.source_url}. Not yet pulled programmatically from a live government API -- treat population as a 2011 snapshot, not a current count.`,
        now
      );
      insertField.run(uid(), demoDatasetId, "population", "number", "persons");
      insertField.run(uid(), demoDatasetId, "population_density", "number", "persons/km^2");
      insertField.run(uid(), demoDatasetId, "literacy_rate", "number", "%");
      insertField.run(uid(), demoDatasetId, "sex_ratio", "number", "females/1000 males");
      insertField.run(uid(), demoDatasetId, "area_sq_km", "number", "km^2");

      insertIndicatorValue.run(uid(), populationInd, districtId, demoDatasetId, row.population, null, null);
      insertIndicatorValue.run(uid(), densityInd, districtId, demoDatasetId, row.density, null, null);
      insertIndicatorValue.run(uid(), literacyInd, districtId, demoDatasetId, row.literacy, null, null);
      insertIndicatorValue.run(uid(), sexRatioInd, districtId, demoDatasetId, row.sex_ratio, null, null);
      insertIndicatorValue.run(uid(), districtAreaInd, districtId, demoDatasetId, row.area_sq_km, null, null);

      if (row.forest_pct !== undefined) {
        const forestDatasetId = uid();
        insertDataset.run(
          forestDatasetId,
          forestSourceId,
          `${row.district} district forest cover (reported figure)`,
          "DERIVED",
          null,
          null,
          "district",
          "Single reported statistic, not a continuously updated feed.",
          `Sourced from ${row.forest_source_label} (${row.forest_source_url}). This is one reported figure, not a live remote-sensing land-use feed -- treat it as a documented snapshot, not a current measurement.`,
          now
        );
        insertIndicatorValue.run(
          uid(), forestCoverInd, districtId, forestDatasetId, row.forest_pct, null,
          `As reported in ${row.forest_source_label}.`
        );
      }

      // --- Map layers: real district boundary + headquarters point ---
      const geomKey = row.geometry_key ?? `${row.state}|${row.district}`;
      const geometry = boundaries[geomKey];
      if (geometry) {
        const boundaryFeature = {
          type: "Feature",
          properties: { name: `${row.district} district boundary` },
          geometry,
        };
        let boundaryLimitations =
          "Compiled from a community-maintained open dataset of Indian district boundaries (github.com/udit-001/india-maps-data), itself derived from public administrative boundary sources, then simplified for display. This is not the authoritative Survey of India cadastral boundary.";
        if (row.geometry_note) boundaryLimitations += " " + row.geometry_note;

        const boundaryDatasetId = uid();
        insertDataset.run(
          boundaryDatasetId,
          boundarySourceId,
          `${row.district} district boundary (open compiled dataset)`,
          "DERIVED",
          2011,
          null,
          "district",
          "Simplified polygon for display; not a legal/cadastral boundary.",
          boundaryLimitations,
          now
        );
        insertMapLayer.run(
          uid(), districtId, "District boundary", "boundary", "DERIVED", boundaryDatasetId,
          JSON.stringify(boundaryFeature), JSON.stringify({ color: "#1B2A4A", weight: 2, fillOpacity: 0.05 })
        );
      }

      const hqPoint = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { name: `${row.district} district headquarters`, office_type: "headquarters" },
            geometry: { type: "Point", coordinates: [row.hq_lng, row.hq_lat] },
          },
        ],
      };
      const hqDatasetId = uid();
      insertDataset.run(
        hqDatasetId,
        wikipediaSourceId,
        `${row.district} district headquarters location`,
        "DERIVED",
        null,
        null,
        "district",
        "Town-center coordinates for the district headquarters town.",
        "Marks the real district headquarters town center -- the seat of the District Collectorate/revenue administration -- using well-known town coordinates. This is not a surveyed office building footprint or a precise street address.",
        now
      );
      insertMapLayer.run(
        uid(), districtId, "District headquarters", "point", "DERIVED", hqDatasetId,
        JSON.stringify(hqPoint), JSON.stringify({ color: "#B8862B" })
      );
    }

    // --- Schemes ---
    const insertScheme = db.prepare(
      "INSERT INTO schemes (id, name, department, description, scheme_type, launch_year, status_note, source_url, data_status, as_of_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    insertScheme.run(
      uid(),
      "Digital India Land Records Modernisation Programme (DILRMP) 3.0",
      "Department of Land Resources, Ministry of Rural Development",
      "Third phase of the national programme to integrate land records, maps, registration and related data through a GIS-based digital framework, including a 14-digit ULPIN (Bhu-Aadhaar) for every land parcel and georeferencing of cadastral maps.",
      "central_sector", 2026,
      "Operational guidelines launched Sept 2026; outlay Rs 565.5 crore for 2026-31",
      "https://dolr.gov.in/", "OFFICIAL", "2026-09-11", now
    );
    insertScheme.run(
      uid(),
      "SVAMITVA Scheme",
      "Ministry of Panchayati Raj",
      "Survey of Villages and Mapping with Improvised Technology in Village Areas -- uses drone surveys to map rural inhabited land and issue property cards to residents, aiming to reduce property disputes and improve access to formal credit.",
      "central_sector", 2021,
      "Ongoing, nationwide rollout",
      "https://svamitva.nic.in/", "OFFICIAL", null, now
    );

    // --- Documents ---
    const insertDoc = db.prepare(
      "INSERT INTO documents (id, title, source_organization, publication_date, document_type, geographic_unit_id, source_url, data_status, summary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    insertDoc.run(
      uid(), "DILRMP 3.0 Operational Guidelines", "Department of Land Resources, Ministry of Rural Development",
      "2026-09-11", "policy", jaipurId, "https://dolr.gov.in/", "OFFICIAL",
      "National guidelines for the third phase of the Digital India Land Records Modernisation Programme, covering ULPIN, state land stacks, and georeferencing of cadastral maps.",
      now
    );
    insertDoc.run(
      uid(), "Jaipur District Census Handbook 2011", "Office of the Registrar General & Census Commissioner, India",
      "2011-03-01", "research", jaipurId, "https://data.gov.in/", "HISTORICAL",
      "Decennial census demographic and housing data for Jaipur district.",
      now
    );
    insertDoc.run(
      uid(), "SVAMITVA Scheme Framework", "Ministry of Panchayati Raj",
      "2021-04-24", "policy", null, "https://svamitva.nic.in/", "OFFICIAL",
      "National framework for drone-based rural property mapping and issuance of property cards under the SVAMITVA scheme.",
      now
    );

    console.log(`[gov] Seed complete -- ${DISTRICTS.length} districts across ${Object.keys(stateIds).length} states/UTs.`);
    console.log("[gov] Demo login: policy.user@dolr.gov.in / ChangeMe123!");
  });

  tx();
}
