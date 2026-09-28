import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export const DATA_DIR = path.join(process.cwd(), 'data');

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  platform_role TEXT NOT NULL DEFAULT 'RESEARCH_ACADEMIC',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  academic_type TEXT NOT NULL DEFAULT 'RESEARCHER',
  institution TEXT NOT NULL,
  department TEXT,
  designation TEXT,
  research_interests TEXT NOT NULL DEFAULT '[]',
  expertise TEXT NOT NULL DEFAULT '[]',
  bio TEXT,
  verification_status INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS research_resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT NOT NULL DEFAULT '[]',
  organization TEXT,
  resource_type TEXT NOT NULL,
  publication_year INTEGER,
  topic TEXT NOT NULL,
  state TEXT,
  district TEXT,
  language TEXT NOT NULL DEFAULT 'English',
  keywords TEXT NOT NULL DEFAULT '[]',
  abstract TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  access_level TEXT NOT NULL DEFAULT 'Open Access',
  verification_status INTEGER NOT NULL DEFAULT 0,
  data_status TEXT NOT NULL DEFAULT 'SAMPLE',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS datasets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  type TEXT NOT NULL,
  geographic_scope TEXT NOT NULL,
  temporal_scope TEXT,
  variables TEXT NOT NULL DEFAULT '[]',
  format TEXT NOT NULL,
  spatial_resolution TEXT,
  crs TEXT,
  license_access TEXT NOT NULL,
  source_url TEXT,
  update_frequency TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  quality_status TEXT NOT NULL DEFAULT 'UNKNOWN',
  data_status TEXT NOT NULL DEFAULT 'SAMPLE',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gis_layers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  provider TEXT,
  source_url TEXT,
  geoserver_url TEXT,
  geometry_type TEXT NOT NULL,
  state TEXT,
  district TEXT,
  data_status TEXT NOT NULL DEFAULT 'SAMPLE',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  research_problem TEXT NOT NULL,
  objectives TEXT NOT NULL DEFAULT '[]',
  geographic_scope TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  institution TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  visibility TEXT NOT NULL DEFAULT 'Public',
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_members (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'VIEWER',
  created_at TEXT NOT NULL,
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS research_questions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_resources (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES research_resources(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  UNIQUE(project_id, resource_id)
);

CREATE TABLE IF NOT EXISTS project_datasets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  dataset_id TEXT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  UNIQUE(project_id, dataset_id)
);

CREATE TABLE IF NOT EXISTS project_gis_layers (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  layer_id TEXT NOT NULL REFERENCES gis_layers(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  UNIQUE(project_id, layer_id)
);

CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES research_questions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  methodology TEXT NOT NULL,
  results_summary TEXT NOT NULL,
  data_status TEXT NOT NULL DEFAULT 'SAMPLE',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  analysis_id TEXT REFERENCES analyses(id) ON DELETE SET NULL,
  statement TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'Moderate',
  data_status TEXT NOT NULL DEFAULT 'SAMPLE',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_outputs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES users(id),
  abstract TEXT NOT NULL,
  keywords TEXT NOT NULL DEFAULT '[]',
  methodology TEXT NOT NULL,
  data_sources TEXT NOT NULL DEFAULT '[]',
  version TEXT NOT NULL DEFAULT '1.0',
  review_status TEXT NOT NULL DEFAULT 'DRAFT',
  data_status TEXT NOT NULL DEFAULT 'SAMPLE',
  visibility TEXT NOT NULL DEFAULT 'Internal',
  publication_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS innovation_opportunities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  organizer TEXT NOT NULL,
  description TEXT NOT NULL,
  deadline TEXT NOT NULL,
  eligibility TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS innovation_submissions (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL REFERENCES innovation_opportunities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES research_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_resources (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES research_resources(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_user ON research_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_project ON research_questions(project_id);
CREATE INDEX IF NOT EXISTS idx_presources_project ON project_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_pdatasets_project ON project_datasets(project_id);
CREATE INDEX IF NOT EXISTS idx_pgis_project ON project_gis_layers(project_id);
CREATE INDEX IF NOT EXISTS idx_analyses_project ON analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_findings_project ON findings(project_id);
CREATE INDEX IF NOT EXISTS idx_outputs_project ON research_outputs(project_id);
CREATE INDEX IF NOT EXISTS idx_submissions_opportunity ON innovation_submissions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_resources(user_id);
`;

declare global {
  // eslint-disable-next-line no-var
  var __researchDb: Database.Database | undefined;
}

export function getDatabase(): Database.Database {
  if (global.__researchDb) {
    return global.__researchDb;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new Database(path.join(DATA_DIR, 'research.db'));
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);

  global.__researchDb = db;
  return db;
}

export function initDb() {
  const db = getDatabase();
  db.exec(SCHEMA);
  return db;
}

// ---------- helpers ----------

export function nowIso(): string {
  return new Date().toISOString();
}

export function toJson(value: unknown): string {
  return JSON.stringify(value ?? []);
}

export function fromJson<T = any>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toBool(value: number | null | undefined): boolean {
  return value === 1;
}

export function fromBool(value: boolean | undefined): number {
  return value ? 1 : 0;
}

// ---------- row mappers (snake_case DB row -> camelCase API shape) ----------

export function mapUser(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    platformRole: row.platform_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProfile(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    academicType: row.academic_type,
    institution: row.institution,
    department: row.department,
    designation: row.designation,
    researchInterests: fromJson<string[]>(row.research_interests, []),
    expertise: fromJson<string[]>(row.expertise, []),
    bio: row.bio,
    verificationStatus: toBool(row.verification_status),
  };
}

export function mapResource(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    authors: fromJson<string[]>(row.authors, []),
    organization: row.organization,
    resourceType: row.resource_type,
    publicationYear: row.publication_year,
    topic: row.topic,
    state: row.state,
    district: row.district,
    language: row.language,
    keywords: fromJson<string[]>(row.keywords, []),
    abstract: row.abstract,
    source: row.source,
    sourceUrl: row.source_url,
    accessLevel: row.access_level,
    verificationStatus: toBool(row.verification_status),
    dataStatus: row.data_status,
    createdAt: row.created_at,
  };
}

export function mapDataset(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    type: row.type,
    geographicScope: row.geographic_scope,
    temporalScope: row.temporal_scope,
    variables: fromJson<string[]>(row.variables, []),
    format: row.format,
    spatialResolution: row.spatial_resolution,
    crs: row.crs,
    licenseAccess: row.license_access,
    sourceUrl: row.source_url,
    updateFrequency: row.update_frequency,
    version: row.version,
    qualityStatus: row.quality_status,
    dataStatus: row.data_status,
    createdAt: row.created_at,
  };
}

export function mapGisLayer(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    provider: row.provider,
    sourceUrl: row.source_url,
    geoserverUrl: row.geoserver_url,
    geometryType: row.geometry_type,
    state: row.state,
    district: row.district,
    dataStatus: row.data_status,
    createdAt: row.created_at,
  };
}

export function mapProject(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    researchProblem: row.research_problem,
    objectives: fromJson<string[]>(row.objectives, []),
    geographicScope: row.geographic_scope,
    startDate: row.start_date,
    endDate: row.end_date,
    institution: row.institution,
    status: row.status,
    visibility: row.visibility,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMember(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
  };
}

export function mapQuestion(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    question: row.question,
    description: row.description,
    createdAt: row.created_at,
  };
}

export function mapAnalysis(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    questionId: row.question_id,
    title: row.title,
    methodology: row.methodology,
    resultsSummary: row.results_summary,
    dataStatus: row.data_status,
    createdAt: row.created_at,
  };
}

export function mapFinding(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    analysisId: row.analysis_id,
    statement: row.statement,
    confidence: row.confidence,
    dataStatus: row.data_status,
    createdAt: row.created_at,
  };
}

export function mapOutput(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    type: row.type,
    authorId: row.author_id,
    abstract: row.abstract,
    keywords: fromJson<string[]>(row.keywords, []),
    methodology: row.methodology,
    dataSources: fromJson<string[]>(row.data_sources, []),
    version: row.version,
    reviewStatus: row.review_status,
    dataStatus: row.data_status,
    visibility: row.visibility,
    publicationDate: row.publication_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapOpportunity(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    organizer: row.organizer,
    description: row.description,
    deadline: row.deadline,
    eligibility: row.eligibility,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function mapSubmission(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    userId: row.user_id,
    projectId: row.project_id,
    title: row.title,
    abstract: row.abstract,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function mapProjectResourceLink(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    resourceId: row.resource_id,
    createdAt: row.created_at,
  };
}

export function mapProjectDatasetLink(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    datasetId: row.dataset_id,
    createdAt: row.created_at,
  };
}

export function mapProjectGisLayerLink(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    layerId: row.layer_id,
    createdAt: row.created_at,
  };
}
