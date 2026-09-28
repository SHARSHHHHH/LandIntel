import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

export const DATA_DIR = path.join(process.cwd(), "data");

export function getDatabase(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const db = new Database(path.join(DATA_DIR, "bhumikosh.db"));
  db.pragma("journal_mode = WAL");
  return db;
}

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS public_articles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  organization TEXT,
  year INTEGER,
  category TEXT,
  tags TEXT DEFAULT '[]',
  summary_easy TEXT NOT NULL,
  summary_simple TEXT NOT NULL,
  summary_deep TEXT NOT NULL,
  key_stats TEXT DEFAULT '[]',
  takeaways TEXT DEFAULT '[]',
  content_doc TEXT,
  is_public INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS national_metrics (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  context TEXT,
  emphasis INTEGER DEFAULT 0,
  keywords TEXT DEFAULT '[]',
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public_state_stats (
  state_name TEXT PRIMARY KEY,
  state_code TEXT UNIQUE,
  villages_total INTEGER,
  villages_computerized_pct REAL,
  maps_digitized_pct REAL,
  cadastral_linked_pct REAL,
  ulpin_parcels BIGINT,
  ulpin_coverage_pct REAL,
  disputes_total BIGINT,
  disputes_trend TEXT,
  disputes_per_1000 REAL,
  urbanshare_pct REAL,
  agri_pct REAL,
  forest_pct REAL,
  climate_vulnerability REAL,
  projects_active INTEGER,
  story TEXT,
  data_available INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public_datasets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  source_type TEXT NOT NULL,
  year INTEGER,
  description TEXT,
  is_open INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS alert_topics (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  state_name TEXT,
  keyword TEXT
);

CREATE TABLE IF NOT EXISTS public_subscriptions (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  state_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS article_embeddings (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  embedding_json TEXT NOT NULL,
  content_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS qa_cache (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON public_articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_type ON public_articles(source_type);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public_articles(category);
CREATE INDEX IF NOT EXISTS idx_state_code ON public_state_stats(state_code);
CREATE INDEX IF NOT EXISTS idx_article_embeddings ON article_embeddings(article_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON public_subscriptions(email);
`;

export function initDb() {
  const db = getDatabase();
  db.exec(SCHEMA);
  return db;
}