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

/** Which Evidence & Research submodule a documents row belongs to. */
export type EvidenceCategory = "official_document" | "land_record" | "legal_case" | "uploaded_report";

export interface DocumentOut {
  id: string;
  title: string;
  source_organization: string;
  publication_date: string | null;
  document_type: string | null;
  source_url: string;
  data_status: DataStatus;
  summary: string | null;
  uploaded_document_id?: string | null;
  category: EvidenceCategory;
  /** State code (e.g. "RJ"), null for a national-level document/record. */
  state: string | null;
  /** GIS module sample parcel id this evidence item is linked to, if any. */
  parcel_id: string | null;
  page_ref: string | null;
  last_verified: string | null;
}

export interface DocumentDetailOut extends DocumentOut {
  /** Full extracted text of the original upload, when this item came from the upload pipeline. */
  extracted_text: string | null;
  /** File metadata for the original upload, when viewable inline via /api/gov/documents/{id}/file. */
  file: { filename: string; mime_type: string | null; file_size: number | null } | null;
}

export type UploadedDocumentStatus = "processing" | "pending_review" | "approved" | "rejected";

export interface UploadedDocumentOut {
  id: string;
  geographic_unit_id: string | null;
  filename: string;
  mime_type: string | null;
  file_size: number | null;
  uploaded_by: string;
  uploaded_at: string;
  status: UploadedDocumentStatus;
  extracted_text: string | null;
  extraction_error: string | null;
  report_id: string | null;
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

export type WorkspaceVisibility = "Private" | "Team" | "Public";
export type WorkspaceStatus = "active" | "completed" | "archived";
export type WorkspaceMemberRole = "owner" | "researcher" | "gis_analyst" | "policy_analyst" | "reviewer" | "viewer";
export type WorkspaceTaskStatus = "todo" | "in_progress" | "done";
export type FindingConfidence = "low" | "medium" | "high";

export interface WorkspaceMemberOut {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  role: WorkspaceMemberRole;
  added_at: string;
}

export interface WorkspaceTaskOut {
  id: string;
  title: string;
  description: string | null;
  status: WorkspaceTaskStatus;
  assignee_id: string | null;
  assignee_name: string | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceDiscussionOut {
  id: string;
  parent_id: string | null;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export interface WorkspaceFindingOut {
  id: string;
  statement: string;
  confidence: FindingConfidence;
  evidence_document_id: string | null;
  evidence_document_title: string | null;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export interface WorkspacePolicyNoteOut {
  id: string;
  title: string;
  content: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export interface WorkspaceLinkedDocumentOut {
  link_id: string;
  document: DocumentOut;
  added_by: string;
  added_at: string;
}

export interface WorkspaceGisLinkOut {
  id: string;
  geographic_unit_id: string | null;
  geographic_unit_name: string | null;
  parcel_id: string | null;
  parcel_label: string | null;
  label: string | null;
  note: string | null;
  added_by: string;
  added_at: string;
}

export interface WorkspaceActivityOut {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  detail: string | null;
  created_at: string;
}

export interface WorkspaceOut {
  id: string;
  name: string;
  description: string | null;
  research_area: string | null;
  research_type: string | null;
  geographic_unit_id: string | null;
  geography_name: string | null;
  start_date: string | null;
  end_date: string | null;
  visibility: WorkspaceVisibility;
  status: WorkspaceStatus;
  owner_id: string;
  owner_name: string | null;
  created_at: string;
  updated_at: string;
  item_count: number;
  member_count: number;
  document_count: number;
  dataset_count: number;
  task_progress: { total: number; done: number };
}

export interface WorkspaceDetailOut extends WorkspaceOut {
  items: WorkspaceItemOut[];
  members: WorkspaceMemberOut[];
  tasks: WorkspaceTaskOut[];
  discussions: WorkspaceDiscussionOut[];
  findings: WorkspaceFindingOut[];
  policy_notes: WorkspacePolicyNoteOut[];
  linked_documents: WorkspaceLinkedDocumentOut[];
  gis_links: WorkspaceGisLinkOut[];
  activity: WorkspaceActivityOut[];
  my_role: WorkspaceMemberRole;
}

export interface DirectoryUserOut {
  id: string;
  full_name: string | null;
  email: string;
  department: string | null;
}

export interface ReportSectionOut {
  id: string;
  section_type: "note" | "indicator" | "document";
  title: string;
  content: string | null;
  reference_id: string | null;
  order_index: number;
}

export type ReportStatus = "draft" | "final" | "pending_review" | "approved" | "rejected";

export interface ReportOut {
  id: string;
  title: string;
  geographic_unit_id: string | null;
  workspace_id: string | null;
  owner_id: string;
  status: ReportStatus;
  source_document_id: string | null;
  rejection_reason: string | null;
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
  eligibility: string | null;
  benefits: string | null;
  required_documents: string | null;
  application_process: string | null;
  last_verified: string | null;
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
