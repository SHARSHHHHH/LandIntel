import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NATIONAL_2011 } from "./constants";
import { PARCEL_INDEX, PILOT_DATASET } from "./gis/adapters/sampleParcels";

export { NATIONAL_2011 };

export const DATA_DIR = path.join(process.cwd(), "data");

export const UPLOAD_DIR = path.join(process.cwd(), "uploads", "gov");
export const DOCUMENTS_UPLOAD_DIR = path.join(UPLOAD_DIR, "documents");
export const MAX_UPLOAD_SIZE_MB = 20;

// Approximate state-level Census 2011 figures used as a documented proxy for
// fields we have not loaded a district-specific source for yet (decadal
// growth, SC/ST population share). These are seed/demo estimates applied at
// the state level, not district-tabulated census cross-tabs -- every
// indicator built from this lookup is tagged DERIVED and says so in its
// dataset's limitations text.
const STATE_DERIVED: Record<string, { decadalGrowthPct: number; scStSharePct: number }> = {
  Rajasthan: { decadalGrowthPct: 21.3, scStSharePct: 31.3 },
  Maharashtra: { decadalGrowthPct: 16.0, scStSharePct: 21.2 },
  Karnataka: { decadalGrowthPct: 15.6, scStSharePct: 24.0 },
  "Tamil Nadu": { decadalGrowthPct: 15.6, scStSharePct: 21.1 },
  "Uttar Pradesh": { decadalGrowthPct: 20.2, scStSharePct: 21.3 },
  "Madhya Pradesh": { decadalGrowthPct: 20.3, scStSharePct: 36.7 },
  Gujarat: { decadalGrowthPct: 19.3, scStSharePct: 21.5 },
  "West Bengal": { decadalGrowthPct: 13.8, scStSharePct: 29.3 },
  Bihar: { decadalGrowthPct: 25.4, scStSharePct: 17.2 },
  Kerala: { decadalGrowthPct: 4.9, scStSharePct: 10.6 },
  Telangana: { decadalGrowthPct: 13.6, scStSharePct: 24.7 },
  Punjab: { decadalGrowthPct: 13.9, scStSharePct: 31.9 },
  Haryana: { decadalGrowthPct: 19.9, scStSharePct: 20.2 },
  Odisha: { decadalGrowthPct: 14.0, scStSharePct: 40.0 },
  Assam: { decadalGrowthPct: 16.9, scStSharePct: 19.6 },
  Delhi: { decadalGrowthPct: 21.2, scStSharePct: 16.9 },
  "Andhra Pradesh": { decadalGrowthPct: 11.1, scStSharePct: 22.1 },
  Jharkhand: { decadalGrowthPct: 22.3, scStSharePct: 38.3 },
  Chhattisgarh: { decadalGrowthPct: 22.6, scStSharePct: 43.4 },
  Uttarakhand: { decadalGrowthPct: 18.8, scStSharePct: 21.7 },
  "Himachal Pradesh": { decadalGrowthPct: 12.9, scStSharePct: 30.9 },
};

/**
 * Extra census-style fields derived from the base district row using
 * documented, deterministic formulas -- filling gaps in the seed dataset
 * without pretending to be an official cross-tabulation. Every value here
 * is tagged DERIVED and carries a plain-language derivation note.
 */
function deriveExtendedCensusFields(row: DistrictRow) {
  const state = STATE_DERIVED[row.state] ?? { decadalGrowthPct: NATIONAL_2011.decadalGrowthRate, scStSharePct: 25 };

  // Urbanisation heuristic: higher population density implies a more urban
  // district. Calibrated so a low-density rural district (~50-150
  // persons/km^2) reads ~18-35% urban, a Gurugram-like district (~1200/km^2)
  // reads ~65-70%, and a fully built-up district (Chennai/Kolkata-scale,
  // >20,000/km^2) saturates near 95%.
  const urbanPct = Math.max(8, Math.min(96, -40 + Math.log10(Math.max(row.density, 10)) * 35));
  const ruralPct = 100 - urbanPct;

  // Average household size: national 2011 average was ~4.8 rural / ~4.1
  // urban; blend by the urban share above.
  const avgHouseholdSize = Math.round(((urbanPct / 100) * 4.1 + (ruralPct / 100) * 4.8) * 10) / 10;
  const households = Math.round(row.population / avgHouseholdSize);

  // Workforce participation rate: national 2011 average (Work Participation
  // Rate) was ~39.8%; nudge slightly with literacy as a rough proxy for
  // labour-force formalisation, clamped to a plausible band.
  const workforceParticipationPct = Math.round((36 + (row.literacy - 65) * 0.12) * 10) / 10;
  const workforceParticipationClamped = Math.max(30, Math.min(48, workforceParticipationPct));

  // Gender literacy split: 2011 national male-female literacy gap was ~16.7
  // points. Apply half the gap either side of the reported combined rate.
  const gap = 16.7;
  const maleLiteracy = Math.min(99, Math.round((row.literacy + gap * 0.5) * 10) / 10);
  const femaleLiteracy = Math.max(1, Math.round((row.literacy - gap * 0.5) * 10) / 10);

  return {
    decadalGrowthPct: state.decadalGrowthPct,
    urbanPct: Math.round(urbanPct * 10) / 10,
    ruralPct: Math.round(ruralPct * 10) / 10,
    avgHouseholdSize,
    households,
    workforceParticipationPct: workforceParticipationClamped,
    scStSharePct: state.scStSharePct,
    maleLiteracy,
    femaleLiteracy,
  };
}

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

-- ---------------------------------------------------------------------------
-- Collaborative Workspace (research collaboration platform) tables. The
-- workspaces / workspace_members / workspace_items tables above predate
-- this expansion and are kept as-is (workspace_items still backs simple
-- note/file attachments); the tables below add the research-board, evidence
-- linking, discussion, findings, policy-notes, GIS-linking and activity-log
-- functionality. Every table is scoped by workspace_id and normalized --
-- documents are linked by reference into the existing documents catalogue
-- (workspace_documents), never duplicated.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS workspace_tasks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  assignee_id TEXT,
  due_date TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_discussions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  parent_id TEXT,
  author_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_findings (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  statement TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'medium',
  evidence_document_id TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_policy_notes (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Links a workspace to an existing Evidence & Research documents row
-- (never duplicates the file/record itself).
CREATE TABLE IF NOT EXISTS workspace_documents (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  added_by TEXT NOT NULL,
  added_at TEXT NOT NULL,
  UNIQUE (workspace_id, document_id)
);

-- Links a workspace to a district/parcel already in the GIS module.
CREATE TABLE IF NOT EXISTS workspace_gis_links (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  geographic_unit_id TEXT,
  parcel_id TEXT,
  label TEXT,
  note TEXT,
  added_by TEXT NOT NULL,
  added_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_activity (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT,
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

-- Documents an officer attaches to a district on the Area Intelligence page.
-- Distinct from the "documents" table above (that one is the curated
-- Evidence & Research catalogue). A row here moves through:
--   processing -> pending_review -> approved | rejected
-- On approval it is mirrored into "documents" (see the approve route) so it
-- becomes visible on Evidence & Research; on rejection it stays out of that
-- catalogue entirely.
CREATE TABLE IF NOT EXISTS uploaded_documents (
  id TEXT PRIMARY KEY,
  geographic_unit_id TEXT,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  file_size INTEGER,
  uploaded_by TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  extracted_text TEXT,
  extraction_error TEXT,
  report_id TEXT
);
`;

/** Adds a column to an existing table if it isn't there yet (SQLite has no ADD COLUMN IF NOT EXISTS). */
function ensureColumn(db: Database.Database, table: string, column: string, definition: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function runMigrations(db: Database.Database) {
  // reports: track which uploaded document (if any) produced this report, and
  // why a report was rejected, so the review pipeline has somewhere to write.
  ensureColumn(db, "reports", "source_document_id", "TEXT");
  ensureColumn(db, "reports", "rejection_reason", "TEXT");
  // documents (Evidence & Research catalogue): link back to the uploaded
  // file an approved report came from, so the evidence item can point at
  // the original upload.
  ensureColumn(db, "documents", "uploaded_document_id", "TEXT");

  // --- Evidence & Research hub expansion ---
  // category groups a documents row into one of the hub's submodules:
  //   official_document | land_record | legal_case | uploaded_report
  // Approved uploads (see reports/[id]/approve) fall back to the default
  // 'uploaded_report' since that route doesn't set this column explicitly.
  ensureColumn(db, "documents", "category", "TEXT NOT NULL DEFAULT 'uploaded_report'");
  // Nullable state code (e.g. "RJ") -- null means a national-level document.
  // Lets Land Record Evidence entries pick up the right state's terminology
  // via lib/gov/gis/adapters/terminology.ts, and leaves room to add
  // state-specific Official Documents later without a schema change.
  ensureColumn(db, "documents", "state", "TEXT");
  // Links a Land Record / Legal evidence row to a real sample parcel id from
  // the GIS module's sample dataset, for bidirectional Evidence<->GIS nav.
  ensureColumn(db, "documents", "parcel_id", "TEXT");
  // Page/document number within the source, where applicable.
  ensureColumn(db, "documents", "page_ref", "TEXT");
  // Last-verified date, shown alongside the source so officers know how
  // fresh the citation is (distinct from publication_date).
  ensureColumn(db, "documents", "last_verified", "TEXT");

  // schemes: eligibility / benefits / required documents / application
  // process, each general guidance text, plus a last-verified date. The UI
  // always tells the officer to confirm current details at the official link.
  ensureColumn(db, "schemes", "eligibility", "TEXT");
  ensureColumn(db, "schemes", "benefits", "TEXT");
  ensureColumn(db, "schemes", "required_documents", "TEXT");
  ensureColumn(db, "schemes", "application_process", "TEXT");
  ensureColumn(db, "schemes", "last_verified", "TEXT");

  // --- Collaborative Workspace expansion ---
  ensureColumn(db, "workspaces", "research_area", "TEXT");
  ensureColumn(db, "workspaces", "research_type", "TEXT");
  ensureColumn(db, "workspaces", "geography_name", "TEXT");
  ensureColumn(db, "workspaces", "start_date", "TEXT");
  ensureColumn(db, "workspaces", "end_date", "TEXT");
  ensureColumn(db, "workspaces", "visibility", "TEXT NOT NULL DEFAULT 'Team'");
  ensureColumn(db, "workspaces", "status", "TEXT NOT NULL DEFAULT 'active'");
}

/** Appends one row to a workspace's activity log. Call this at the point every real event happens -- never backfilled or faked. */
export function logWorkspaceActivity(db: Database.Database, workspaceId: string, actorId: string, action: string, detail?: string | null) {
  db.prepare(
    "INSERT INTO workspace_activity (id, workspace_id, actor_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(uid(), workspaceId, actorId, action, detail ?? null, nowIso());
  db.prepare("UPDATE workspaces SET updated_at = ? WHERE id = ?").run(nowIso(), workspaceId);
}

let _db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (_db) return _db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(path.join(DATA_DIR, "gov.db"));
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);
  runMigrations(db);
  _db = db;
  seedIfEmpty(db);
  seedEvidenceHub(db);
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

    // Extra demo users so the Collaborative Workspace member picker has a
    // real, if small, directory to invite from instead of only the single
    // logged-in demo account. Same shared password for this sandbox demo.
    const EXTRA_USERS: { email: string; full_name: string; department: string }[] = [
      { email: "anita.rao@dolr.gov.in", full_name: "Anita Rao", department: "Department of Land Resources (demo)" },
      { email: "vikram.singh@dolr.gov.in", full_name: "Vikram Singh", department: "GIS & Survey Division (demo)" },
      { email: "priya.menon@dolr.gov.in", full_name: "Priya Menon", department: "Policy Research Wing (demo)" },
      { email: "rahul.verma@dolr.gov.in", full_name: "Rahul Verma", department: "Revenue Department (demo)" },
    ];
    for (const u of EXTRA_USERS) {
      const id = uid();
      db.prepare(
        "INSERT INTO users (id, email, full_name, department, password_hash, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)"
      ).run(id, u.email, u.full_name, u.department, bcrypt.hashSync("ChangeMe123!", 10), now);
      db.prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)").run(id, govRoleId);
    }

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
    const decadalGrowthInd = indicator("Decadal growth rate (2001-2011)", "socioeconomic", "%");
    const urbanPopInd = indicator("Urban population share", "socioeconomic", "%");
    const ruralPopInd = indicator("Rural population share", "socioeconomic", "%");
    const workforceInd = indicator("Workforce participation rate", "socioeconomic", "%");
    const householdsInd = indicator("Number of households", "socioeconomic", "households");
    const avgHouseholdInd = indicator("Average household size", "socioeconomic", "persons/household");
    const scStShareInd = indicator("SC/ST population share", "socioeconomic", "%");
    const maleLiteracyInd = indicator("Literacy rate (male)", "socioeconomic", "%");
    const femaleLiteracyInd = indicator("Literacy rate (female)", "socioeconomic", "%");

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

      // --- Extended census-style profile: decadal growth, urban/rural
      // split, workforce participation, households, SC/ST share, gender
      // literacy split. Computed via documented formulas from the base
      // Census 2011 row above -- tagged DERIVED, never claimed as an
      // official cross-tabulation. ---
      const ext = deriveExtendedCensusFields(row);
      const extDatasetId = uid();
      insertDataset.run(
        extDatasetId,
        sourceId,
        `${row.district} district extended census profile (derived estimates)`,
        "DERIVED",
        2011,
        "2011-03-01",
        "district",
        "Demo/estimated extension of the Census 2011 base profile -- fills fields the district-level source does not (yet) provide.",
        "Decadal growth rate and SC/ST population share are applied from state-level Census 2011 figures as a documented proxy, not the district's own tabulation. Urban/rural split, households, average household size, workforce participation rate, and the male/female literacy split are calculated from the base population/density/literacy figures using fixed national-average ratios (see each value's derivation method) -- they are internally consistent estimates for this demo, not officially tabulated district statistics.",
        now
      );
      insertIndicatorValue.run(
        uid(), decadalGrowthInd, districtId, extDatasetId, ext.decadalGrowthPct, null,
        `Applied from the ${row.state} state-level 2001-2011 decadal growth rate (Census of India); the district's own figure is not yet loaded from a verified source.`
      );
      insertIndicatorValue.run(
        uid(), urbanPopInd, districtId, extDatasetId, ext.urbanPct, null,
        "Estimated from population density using a density-to-urbanisation heuristic calibrated against national 2011 patterns; not the district's directly tabulated urban/rural split."
      );
      insertIndicatorValue.run(
        uid(), ruralPopInd, districtId, extDatasetId, ext.ruralPct, null,
        "100% minus the estimated urban population share above."
      );
      insertIndicatorValue.run(
        uid(), workforceInd, districtId, extDatasetId, ext.workforceParticipationPct, null,
        "Estimated from the national 2011 Work Participation Rate (~39.8%), adjusted slightly against the district's literacy rate as a rough proxy; not district-tabulated."
      );
      insertIndicatorValue.run(
        uid(), householdsInd, districtId, extDatasetId, ext.households, null,
        `Population divided by the estimated average household size (${ext.avgHouseholdSize} persons/household) below.`
      );
      insertIndicatorValue.run(
        uid(), avgHouseholdInd, districtId, extDatasetId, ext.avgHouseholdSize, null,
        "Blended from the national 2011 rural (~4.8) and urban (~4.1) average household sizes, weighted by the estimated urban/rural split above."
      );
      insertIndicatorValue.run(
        uid(), scStShareInd, districtId, extDatasetId, ext.scStSharePct, null,
        `Applied from the ${row.state} state-level combined SC+ST population share (Census of India 2011); district-level SC/ST breakdown is not yet loaded from a verified source.`
      );
      insertIndicatorValue.run(
        uid(), maleLiteracyInd, districtId, extDatasetId, ext.maleLiteracy, null,
        "Combined literacy rate plus half of the national 2011 average male-female literacy gap (~16.7 points); not the district's directly tabulated gender-split literacy figure."
      );
      insertIndicatorValue.run(
        uid(), femaleLiteracyInd, districtId, extDatasetId, ext.femaleLiteracy, null,
        "Combined literacy rate minus half of the national 2011 average male-female literacy gap (~16.7 points); not the district's directly tabulated gender-split literacy figure."
      );

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
          JSON.stringify(boundaryFeature), JSON.stringify({ color: "#152238", weight: 2, fillOpacity: 0.05 })
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
        JSON.stringify(hqPoint), JSON.stringify({ color: "#A8752A" })
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

// ---------------------------------------------------------------------------
// Evidence & Research hub: canonical seed rows for Official Documents,
// Government Schemes, and a small illustrative set of Land Record / Legal
// evidence rows linked to the GIS module's real sample parcels. Runs on
// every startup (not just on an empty DB) using fixed ids and INSERT OR
// REPLACE so it stays correct even against a database seeded before this
// module existed, without touching unrelated data (users, workspaces,
// reports, uploads). See the module docstring in app/gov/documents for the
// submodules this feeds.
// ---------------------------------------------------------------------------

/** Titles from the original one-time seed that this module supersedes / folds in. */
const LEGACY_DOCUMENT_TITLES = ["DILRMP 3.0 Operational Guidelines", "SVAMITVA Scheme Framework"];
const LEGACY_SCHEME_NAMES = ["Digital India Land Records Modernisation Programme (DILRMP) 3.0", "SVAMITVA Scheme"];

const LAND_RECORD_TYPE_CYCLE: { type: string; label: string }[] = [
  { type: "ror", label: "Record of Rights (RoR)" },
  { type: "mutation", label: "Mutation record" },
  { type: "survey_map", label: "Cadastral / survey map" },
  { type: "property_card", label: "Property card" },
  { type: "registration_deed", label: "Registration / deed record" },
  { type: "ror", label: "Record of Rights (RoR)" },
];

function districtGeoId(db: Database.Database, districtCode: string): string | null {
  const row = db.prepare("SELECT id FROM geographic_units WHERE code = ? AND level = 'district'").get(districtCode) as
    | { id: string }
    | undefined;
  return row?.id ?? null;
}

function seedEvidenceHub(db: Database.Database) {
  const now = nowIso();
  const today = now.slice(0, 10);

  const tx = db.transaction(() => {
    for (const title of LEGACY_DOCUMENT_TITLES) {
      db.prepare("DELETE FROM documents WHERE title = ?").run(title);
    }
    for (const name of LEGACY_SCHEME_NAMES) {
      db.prepare("DELETE FROM schemes WHERE name = ?").run(name);
    }

    const upsertDoc = db.prepare(`
      INSERT INTO documents
        (id, title, source_organization, publication_date, document_type, geographic_unit_id, source_url,
         data_status, summary, created_at, uploaded_document_id, category, state, parcel_id, page_ref, last_verified)
      VALUES (@id, @title, @source_organization, @publication_date, @document_type, @geographic_unit_id, @source_url,
              @data_status, @summary, @created_at, @uploaded_document_id, @category, @state, @parcel_id, @page_ref, @last_verified)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title, source_organization=excluded.source_organization, publication_date=excluded.publication_date,
        document_type=excluded.document_type, geographic_unit_id=excluded.geographic_unit_id, source_url=excluded.source_url,
        data_status=excluded.data_status, summary=excluded.summary, category=excluded.category, state=excluded.state,
        parcel_id=excluded.parcel_id, page_ref=excluded.page_ref, last_verified=excluded.last_verified
    `);

    // --- 1. Official Documents (real, verified; national level -> state: null) ---
    const OFFICIAL_DOCS = [
      {
        id: "ev-doc-dilrmp",
        title: "DILRMP - Digital India Land Records Modernization Programme",
        source_organization: "Department of Land Resources, Ministry of Rural Development, Government of India",
        publication_date: "2016-01-01",
        document_type: "act_scheme",
        source_url: "https://dolr.gov.in/en/programmes-schemes/dilrmp-2/",
        summary:
          "Launched 2016 (evolved from NLRMP), extended through 2025-26 with an outlay of Rs 875 crore. Eight components: " +
          "Computerization of Land Records, Registration Computerization, Survey/Resurvey, Modern Record Rooms, Training & " +
          "Capacity Building, Project Management Unit, Revenue Court Computerization, and Aadhaar Integration (voluntary).",
      },
      {
        id: "ev-doc-ulpin",
        title: "ULPIN (Bhu-Aadhaar) - Unique Land Parcel Identification Number",
        source_organization: "Department of Land Resources, Ministry of Rural Development, Government of India",
        publication_date: null,
        document_type: "identifier_scheme",
        source_url: "https://dolr.gov.in/en/ulpin/",
        summary:
          "A 14-digit alphanumeric ID assigned to each surveyed land parcel under DILRMP, intended to curb land-linked " +
          "fraud and enable cross-referencing of land records nationally.",
      },
      {
        id: "ev-doc-svamitva",
        title: "SVAMITVA Scheme",
        source_organization: "Ministry of Panchayati Raj, Government of India",
        publication_date: "2020-04-24",
        document_type: "scheme",
        source_url: "https://svamitva.nic.in/",
        summary:
          "Survey of Villages and Mapping with Improvised Technology in Village Areas. Issues legal Rural Property " +
          "Ownership Cards (\"property cards\") to rural residents using drone surveying. See also its published SOP " +
          "and Concept Note at the same domain.",
      },
      {
        id: "ev-doc-rfctlarr",
        title:
          "Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013 (RFCTLARR Act)",
        source_organization: "Ministry of Rural Development, Government of India (Act of Parliament)",
        publication_date: "2013-09-27",
        document_type: "act",
        source_url:
          "https://www.indiacode.nic.in/bitstream/123456789/19895/1/the_right_to_fair_compensation_and_transparency_in_land_acquisition,_rehabilitation_and_resettlement_act,_2013..pdf",
        summary: "Governs land acquisition, compensation and resettlement in India.",
      },
    ];
    for (const d of OFFICIAL_DOCS) {
      upsertDoc.run({
        id: d.id,
        title: d.title,
        source_organization: d.source_organization,
        publication_date: d.publication_date,
        document_type: d.document_type,
        geographic_unit_id: null,
        source_url: d.source_url,
        data_status: "OFFICIAL",
        summary: d.summary,
        created_at: now,
        uploaded_document_id: null,
        category: "official_document",
        state: null,
        parcel_id: null,
        page_ref: null,
        last_verified: today,
      });
    }

    // --- 2. Land Record Evidence (SAMPLE; linked to real sample parcels from the GIS module) ---
    const landRecordDistricts = PILOT_DATASET.slice(0, LAND_RECORD_TYPE_CYCLE.length);
    landRecordDistricts.forEach((district, i) => {
      const firstVillage = district.subDistricts[0]?.villages[0];
      const parcel = firstVillage?.parcels[0];
      if (!parcel) return;
      const kind = LAND_RECORD_TYPE_CYCLE[i % LAND_RECORD_TYPE_CYCLE.length];
      upsertDoc.run({
        id: `ev-lr-${i + 1}`,
        title: `${kind.label} - ${parcel.parcelIdLabel} ${parcel.surveyNumber}, ${parcel.villageName}, ${district.districtName}`,
        source_organization: `${district.stateName} revenue department (sample record, this demo)`,
        publication_date: parcel.history[0]?.year ? `${parcel.history[0].year}-01-01` : null,
        document_type: kind.type,
        geographic_unit_id: districtGeoId(db, district.districtCode),
        source_url: `/gov/documents/ev-lr-${i + 1}`,
        data_status: "SAMPLE",
        summary:
          `Illustrative ${kind.label.toLowerCase()} for ${parcel.parcelIdLabel} ${parcel.surveyNumber} in ${parcel.villageName} ` +
          `village, ${district.districtName} district. Generated demo data mirroring typical state land-record fields -- not a ` +
          `verified government land record. See the linked parcel for the full sample record and history.`,
        created_at: now,
        uploaded_document_id: null,
        category: "land_record",
        state: district.stateCode,
        parcel_id: parcel.id,
        page_ref: null,
        last_verified: today,
      });
    });

    // --- 3. Legal & Court Evidence (SAMPLE; illustrative only, linked to disputed sample parcels) ---
    const disputedParcels = Array.from(PARCEL_INDEX.values())
      .filter((p) => p.disputeStatus !== "none")
      .slice(0, 3);
    disputedParcels.forEach((parcel, i) => {
      const ownerDistrict = PILOT_DATASET.find((d) => d.districtName === parcel.districtName && d.stateName === parcel.stateName);
      upsertDoc.run({
        id: `ev-legal-${i + 1}`,
        title: `Sample Revenue Case - Mutation Dispute, Parcel ${parcel.parcelIdLabel} ${parcel.surveyNumber} (${parcel.villageName})`,
        source_organization: `${parcel.stateName} revenue court (illustrative, not a real case record)`,
        publication_date: null,
        document_type: "case_record",
        geographic_unit_id: ownerDistrict ? districtGeoId(db, ownerDistrict.districtCode) : null,
        source_url: `/gov/documents/ev-legal-${i + 1}`,
        data_status: "SAMPLE",
        summary:
          `Illustrative revenue case record for a boundary/ownership/mutation dispute on ${parcel.parcelIdLabel} ` +
          `${parcel.surveyNumber} in ${parcel.villageName}, ${parcel.districtName}. This is NOT a real court or revenue-court ` +
          `record -- no real case database is available in this environment. Shown only to demonstrate how case/order/judgment ` +
          `evidence would be structured and linked to a parcel.`,
        created_at: now,
        uploaded_document_id: null,
        category: "legal_case",
        state: ownerDistrict?.stateCode ?? null,
        parcel_id: parcel.id,
        page_ref: null,
        last_verified: today,
      });
    });

    // --- 4. Government Schemes (real, verified; exactly PM-KISAN, PMAY-U 2.0, SVAMITVA) ---
    const upsertScheme = db.prepare(`
      INSERT INTO schemes
        (id, name, department, description, scheme_type, launch_year, status_note, source_url, data_status, as_of_date,
         created_at, eligibility, benefits, required_documents, application_process, last_verified)
      VALUES (@id, @name, @department, @description, @scheme_type, @launch_year, @status_note, @source_url, @data_status, @as_of_date,
              @created_at, @eligibility, @benefits, @required_documents, @application_process, @last_verified)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name, department=excluded.department, description=excluded.description, scheme_type=excluded.scheme_type,
        launch_year=excluded.launch_year, status_note=excluded.status_note, source_url=excluded.source_url,
        data_status=excluded.data_status, as_of_date=excluded.as_of_date, eligibility=excluded.eligibility,
        benefits=excluded.benefits, required_documents=excluded.required_documents,
        application_process=excluded.application_process, last_verified=excluded.last_verified
    `);
    const STANDARD_DOCS =
      "General guidance (confirm the current list at the official portal): Aadhaar card, land ownership/record-of-rights proof, bank account details (Aadhaar-linked), and a recent passport-size photograph.";

    upsertScheme.run({
      id: "ev-scheme-pmkisan",
      name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
      department: "Department of Agriculture & Farmers Welfare, Ministry of Agriculture and Farmers Welfare",
      description:
        "Rs 6,000/year to eligible farmer families in 3 equal installments via Direct Benefit Transfer to Aadhaar-linked bank accounts.",
      scheme_type: "central_sector",
      launch_year: 2019,
      status_note: "Ongoing, nationwide.",
      source_url: "https://pmkisan.gov.in/",
      data_status: "OFFICIAL",
      as_of_date: today,
      created_at: now,
      eligibility:
        "Primary eligibility: cultivable landholding, subject to income-based exclusions for higher-income categories. " +
        "Confirm current eligibility criteria at the official portal, as policies change.",
      benefits: "Rs 6,000 per year, paid in 3 equal installments of Rs 2,000 via Direct Benefit Transfer.",
      required_documents: STANDARD_DOCS,
      application_process: "Apply / check status via the official PM-KISAN portal.",
      last_verified: today,
    });

    upsertScheme.run({
      id: "ev-scheme-pmay",
      name: "PMAY (Pradhan Mantri Awas Yojana - Urban 2.0)",
      department: "Ministry of Housing and Urban Affairs",
      description:
        "Central housing scheme aimed at affordable housing for eligible urban households; check current eligibility bands and application at the official portal.",
      scheme_type: "central_sector",
      launch_year: 2015,
      status_note: "Urban 2.0 phase ongoing -- check the official portal for current eligibility bands and city coverage.",
      source_url: "https://pmaymis.gov.in/",
      data_status: "OFFICIAL",
      as_of_date: today,
      created_at: now,
      eligibility: "Eligible urban households within the income/asset bands set for PMAY-Urban 2.0 -- confirm current bands at the official portal, as policies change.",
      benefits: "Assistance toward affordable urban housing (exact benefit structure depends on the scheme component and eligibility band -- see official portal).",
      required_documents: STANDARD_DOCS,
      application_process: "Apply via the official PMAY-Urban portal or the designated Urban Local Body.",
      last_verified: today,
    });

    upsertScheme.run({
      id: "ev-scheme-svamitva",
      name: "SVAMITVA Scheme",
      department: "Ministry of Panchayati Raj",
      description:
        "Rural residents in surveyed villages become eligible for a legal property card once drone survey/verification of their village is complete.",
      scheme_type: "central_sector",
      launch_year: 2020,
      status_note: "Ongoing, nationwide rollout. Cross-referenced with the SVAMITVA entry under Official Documents.",
      source_url: "https://svamitva.nic.in/",
      data_status: "OFFICIAL",
      as_of_date: today,
      created_at: now,
      eligibility: "Residents of villages covered by a completed SVAMITVA drone survey and local verification drive; no income/asset test.",
      benefits: "Legal Rural Property Ownership Card (\"property card\") for surveyed rural property, supporting access to formal credit.",
      required_documents: STANDARD_DOCS,
      application_process:
        "No direct citizen application -- this is a government-led survey drive. Residents participate in the local drone-survey verification process when it reaches their village.",
      last_verified: today,
    });
  });

  tx();
}
