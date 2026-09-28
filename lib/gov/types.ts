export type DataStatus = "OFFICIAL" | "SAMPLE" | "DERIVED" | "HISTORICAL";
export type SourceStatus = "live" | "unconfigured" | "sample_only" | "deprecated";

export interface SourceOut {
  id: string;
  name: string;
  provider: string;
  base_url: string | null;
  access_type: string;
  license: string | null;
  status: SourceStatus;
}

export interface DatasetOut {
  id: string;
  name: string;
  data_status: DataStatus;
  reference_year: number | null;
  last_updated: string | null;
  geographic_level: string | null;
  coverage_note: string | null;
  limitations: string | null;
  source: SourceOut | null;
}

export interface GeographicUnitOut {
  id: string;
  level: string;
  name: string;
  code: string | null;
  parent_id: string | null;
  centroid_lat: number | null;
  centroid_lng: number | null;
}

export interface IndicatorValueOut {
  id: string;
  indicator_name: string;
  category: "land" | "socioeconomic";
  unit: string | null;
  value: number | null;
  value_text: string | null;
  derivation_method: string | null;
  dataset: DatasetOut;
}

export interface DocumentOut {
  id: string;
  title: string;
  source_organization: string;
  publication_date: string | null;
  document_type: string | null;
  source_url: string;
  data_status: DataStatus;
  summary: string | null;
}

export interface MapLayerOut {
  id: string;
  name: string;
  layer_type: string;
  data_status: DataStatus;
  reference_year: number | null;
  source_name: string | null;
  has_geometry: boolean;
}

export interface SectionSummary {
  available: boolean;
  status: DataStatus | null;
  note: string | null;
}

export interface DataStatusSummary {
  official: number;
  sample: number;
  derived: number;
  historical: number;
}

export interface AreaOverviewOut {
  area: GeographicUnitOut;
  datasets_count: number;
  documents_count: number;
  map_layers_count: number;
  last_updated: string | null;
  land_summary: SectionSummary;
  socioeconomic_summary: SectionSummary;
  land_indicators: IndicatorValueOut[];
  socioeconomic_indicators: IndicatorValueOut[];
  data_status_summary: DataStatusSummary;
}

export interface TokenOut {
  access_token: string;
  token_type: string;
  roles: string[];
}

export interface WorkspaceItemOut {
  id: string;
  item_type: "note" | "document" | "indicator" | "file";
  title: string;
  content: string | null;
  reference_id: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_by: string;
  created_at: string;
}

export interface WorkspaceOut {
  id: string;
  name: string;
  description: string | null;
  geographic_unit_id: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  item_count: number;
}

export interface WorkspaceDetailOut extends WorkspaceOut {
  items: WorkspaceItemOut[];
}

export interface ReportSectionOut {
  id: string;
  section_type: "note" | "indicator" | "document";
  title: string;
  content: string | null;
  reference_id: string | null;
  order_index: number;
}

export interface ReportOut {
  id: string;
  title: string;
  geographic_unit_id: string | null;
  workspace_id: string | null;
  owner_id: string;
  status: "draft" | "final";
  created_at: string;
  updated_at: string;
  section_count: number;
}

export interface ReportDetailOut extends ReportOut {
  sections: ReportSectionOut[];
}

export interface SchemeOut {
  id: string;
  name: string;
  department: string;
  description: string;
  scheme_type: string | null;
  launch_year: number | null;
  status_note: string | null;
  source_url: string;
  data_status: DataStatus;
  as_of_date: string | null;
}

export interface NotificationOut {
  id: string;
  message: string;
  category: "system" | "document" | "report" | "workspace";
  related_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SavedSearchOut {
  id: string;
  query: string | null;
  geographic_unit_id: string | null;
  document_type: string | null;
  created_at: string;
}

export interface RecentAreaOut {
  area: GeographicUnitOut;
  last_viewed: string;
}

export interface DashboardSummaryOut {
  recent_areas: RecentAreaOut[];
  saved_searches: SavedSearchOut[];
  recent_reports: ReportOut[];
  workspaces: WorkspaceOut[];
  unread_notification_count: number;
}

export interface ProfileOut {
  id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  roles: string[];
}
