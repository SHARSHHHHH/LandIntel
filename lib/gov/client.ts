import type {
  AreaOverviewOut,
  DashboardSummaryOut,
  DocumentDetailOut,
  DocumentOut,
  GeographicUnitOut,
  IndicatorValueOut,
  MapLayerOut,
  NotificationOut,
  ProfileOut,
  ReportDetailOut,
  ReportOut,
  ReportSectionOut,
  SavedSearchOut,
  SchemeOut,
  SourceOut,
  TokenOut,
  UploadedDocumentOut,
  WorkspaceDetailOut,
  WorkspaceItemOut,
  WorkspaceOut,
  WorkspaceTaskOut,
  WorkspaceDiscussionOut,
  WorkspaceFindingOut,
  WorkspacePolicyNoteOut,
  WorkspaceMemberOut,
  WorkspaceMemberRole,
  WorkspaceVisibility,
  DirectoryUserOut,
} from "./types";
import type { DistrictGisLayers, DistrictGisUnsupported, ParcelDetail, SearchResult, SubDistrictDetail, Terminology } from "./gis/types";

export interface DistrictHierarchyOut {
  district: { id: string; name: string; code: string | null };
  state: { name: string; code: string };
  terminology: Terminology;
  supported: boolean;
  subDistricts: SubDistrictDetail[];
  message: string | null;
}

export interface GisSearchResultOut extends SearchResult {
  districtGeoId: string | null;
}

export interface ParcelDetailOut extends ParcelDetail {
  /** Real geographic_units id for this parcel's district, for "View on GIS" navigation. Null if unresolved. */
  districtGeoId: string | null;
}

const API_BASE = "/api/gov";
const TOKEN_KEY = "land_intel_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    if (res.status === 401) clearToken();
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async login(email: string, password: string): Promise<TokenOut> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Invalid email or password");
    return res.json();
  },

  listGeographies(level?: string, parentId?: string): Promise<GeographicUnitOut[]> {
    const params = new URLSearchParams();
    if (level) params.set("level", level);
    if (parentId) params.set("parent_id", parentId);
    const qs = params.toString();
    return request(`/geographies${qs ? `?${qs}` : ""}`);
  },

  getGeography(id: string): Promise<GeographicUnitOut> {
    return request(`/geographies/${id}`);
  },

  getAreaOverview(areaId: string): Promise<AreaOverviewOut> {
    return request(`/areas/${areaId}/overview`);
  },

  getAreaIndicators(areaId: string, category?: string): Promise<IndicatorValueOut[]> {
    const qs = category ? `?category=${category}` : "";
    return request(`/areas/${areaId}/indicators${qs}`);
  },

  getAreaDocuments(areaId: string, q?: string): Promise<DocumentOut[]> {
    const qs = q ? `?q=${encodeURIComponent(q)}` : "";
    return request(`/areas/${areaId}/documents${qs}`);
  },

  getAreaMapLayers(areaId: string): Promise<MapLayerOut[]> {
    return request(`/areas/${areaId}/map-layers`);
  },

  listUploadedDocuments(areaId: string): Promise<UploadedDocumentOut[]> {
    return request(`/areas/${areaId}/uploaded-documents`);
  },

  async uploadAreaDocument(areaId: string, file: File): Promise<{ uploaded_document: UploadedDocumentOut; report: ReportOut }> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/areas/${areaId}/documents/upload`, {
      method: "POST",
      headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
      body: form,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Upload failed: ${res.status}${body ? ` - ${body}` : ""}`);
    }
    return res.json();
  },

  async downloadUploadedFile(uploadedDocumentId: string, fileName: string): Promise<void> {
    const res = await fetch(`${API_BASE}/uploads/${uploadedDocumentId}/file`, {
      headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  getMapLayerGeometry(areaId: string, layerId: string): Promise<{
    id: string;
    name: string;
    data_status: string;
    geojson: { type: string; geometry: { type: string; coordinates: unknown }; properties: Record<string, unknown> };
    style: Record<string, unknown> | null;
  }> {
    return request(`/areas/${areaId}/map-layers/${layerId}/geometry`);
  },

  listDataSources(): Promise<SourceOut[]> {
    return request(`/data-sources`);
  },

  getDataSource(id: string): Promise<SourceOut> {
    return request(`/data-sources/${id}`);
  },

  getDashboardSummary(): Promise<DashboardSummaryOut> {
    return request(`/dashboard/summary`);
  },

  listAllDocuments(
    params: { q?: string; document_type?: string; geographic_unit_id?: string; category?: string; state?: string; parcel_id?: string } = {}
  ): Promise<DocumentOut[]> {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.document_type) qs.set("document_type", params.document_type);
    if (params.geographic_unit_id) qs.set("geographic_unit_id", params.geographic_unit_id);
    if (params.category) qs.set("category", params.category);
    if (params.state) qs.set("state", params.state);
    if (params.parcel_id) qs.set("parcel_id", params.parcel_id);
    const s = qs.toString();
    return request(`/documents${s ? `?${s}` : ""}`);
  },

  getDocument(id: string): Promise<DocumentDetailOut> {
    return request(`/documents/${id}`);
  },

  /**
   * Fetches an evidence item's original uploaded file as a blob, for inline
   * viewing (an <iframe>/<embed> or <img> src can't carry our bearer token,
   * so we fetch with auth and hand back an object URL, same pattern as
   * downloadUploadedFile below).
   */
  async getEvidenceFileBlob(documentId: string): Promise<{ url: string; contentType: string }> {
    const res = await fetch(`${API_BASE}/documents/${documentId}/file`, {
      headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    });
    if (!res.ok) throw new Error(`Could not load original file: ${res.status}`);
    const contentType = res.headers.get("Content-Type") || "application/octet-stream";
    const blob = await res.blob();
    return { url: URL.createObjectURL(blob), contentType };
  },

  listSavedSearches(): Promise<SavedSearchOut[]> {
    return request(`/saved-searches`);
  },

  createSavedSearch(body: { query?: string; geographic_unit_id?: string; document_type?: string }): Promise<SavedSearchOut> {
    return request(`/saved-searches`, { method: "POST", body: JSON.stringify(body) });
  },

  deleteSavedSearch(id: string): Promise<{ status: string }> {
    return request(`/saved-searches/${id}`, { method: "DELETE" });
  },

  listSchemes(): Promise<SchemeOut[]> {
    return request(`/schemes`);
  },

  listWorkspaces(): Promise<WorkspaceOut[]> {
    return request(`/workspaces`);
  },

  createWorkspace(body: {
    name: string;
    description?: string;
    geographic_unit_id?: string;
    geography_name?: string;
    research_area?: string;
    research_type?: string;
    start_date?: string;
    end_date?: string;
    visibility?: WorkspaceVisibility;
    collaborator_user_ids?: string[];
    collaborator_emails?: string[];
  }): Promise<WorkspaceOut> {
    return request(`/workspaces`, { method: "POST", body: JSON.stringify(body) });
  },

  updateWorkspace(id: string, body: Partial<{ name: string; description: string; status: string; visibility: WorkspaceVisibility }>): Promise<WorkspaceOut> {
    return request(`/workspaces/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },

  deleteWorkspace(id: string): Promise<{ status: string }> {
    return request(`/workspaces/${id}`, { method: "DELETE" });
  },

  getWorkspace(id: string): Promise<WorkspaceDetailOut> {
    return request(`/workspaces/${id}`);
  },

  listDirectoryUsers(): Promise<DirectoryUserOut[]> {
    return request(`/users`);
  },

  createWorkspaceTask(
    workspaceId: string,
    body: { title: string; description?: string; status?: string; assignee_id?: string; due_date?: string }
  ): Promise<WorkspaceTaskOut> {
    return request(`/workspaces/${workspaceId}/tasks`, { method: "POST", body: JSON.stringify(body) });
  },

  updateWorkspaceTask(
    workspaceId: string,
    taskId: string,
    body: Partial<{ title: string; description: string; status: string; assignee_id: string | null; due_date: string | null }>
  ): Promise<WorkspaceTaskOut> {
    return request(`/workspaces/${workspaceId}/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(body) });
  },

  deleteWorkspaceTask(workspaceId: string, taskId: string): Promise<{ status: string }> {
    return request(`/workspaces/${workspaceId}/tasks/${taskId}`, { method: "DELETE" });
  },

  postWorkspaceDiscussion(workspaceId: string, body: { body: string; parent_id?: string }): Promise<WorkspaceDiscussionOut> {
    return request(`/workspaces/${workspaceId}/discussions`, { method: "POST", body: JSON.stringify(body) });
  },

  createWorkspaceFinding(
    workspaceId: string,
    body: { statement: string; confidence?: string; evidence_document_id?: string }
  ): Promise<WorkspaceFindingOut> {
    return request(`/workspaces/${workspaceId}/findings`, { method: "POST", body: JSON.stringify(body) });
  },

  createWorkspacePolicyNote(workspaceId: string, body: { title: string; content: string }): Promise<WorkspacePolicyNoteOut> {
    return request(`/workspaces/${workspaceId}/policy-notes`, { method: "POST", body: JSON.stringify(body) });
  },

  linkWorkspaceDocument(workspaceId: string, documentId: string): Promise<{ status: string }> {
    return request(`/workspaces/${workspaceId}/documents`, { method: "POST", body: JSON.stringify({ document_id: documentId }) });
  },

  unlinkWorkspaceDocument(workspaceId: string, linkId: string): Promise<{ status: string }> {
    return request(`/workspaces/${workspaceId}/documents?link_id=${linkId}`, { method: "DELETE" });
  },

  linkWorkspaceGis(
    workspaceId: string,
    body: { geographic_unit_id?: string; parcel_id?: string; label?: string; note?: string }
  ): Promise<unknown> {
    return request(`/workspaces/${workspaceId}/gis-links`, { method: "POST", body: JSON.stringify(body) });
  },

  unlinkWorkspaceGis(workspaceId: string, linkId: string): Promise<{ status: string }> {
    return request(`/workspaces/${workspaceId}/gis-links?link_id=${linkId}`, { method: "DELETE" });
  },

  addWorkspaceMember(workspaceId: string, body: { user_id?: string; email?: string; role?: WorkspaceMemberRole }): Promise<WorkspaceMemberOut> {
    return request(`/workspaces/${workspaceId}/members`, { method: "POST", body: JSON.stringify(body) });
  },

  updateWorkspaceMemberRole(workspaceId: string, memberId: string, role: WorkspaceMemberRole): Promise<WorkspaceMemberOut> {
    return request(`/workspaces/${workspaceId}/members/${memberId}`, { method: "PATCH", body: JSON.stringify({ role }) });
  },

  removeWorkspaceMember(workspaceId: string, memberId: string): Promise<{ status: string }> {
    return request(`/workspaces/${workspaceId}/members/${memberId}`, { method: "DELETE" });
  },

  askWorkspaceQuestion(workspaceId: string, question: string): Promise<{ answer: string }> {
    return request(`/workspaces/${workspaceId}/ask`, { method: "POST", body: JSON.stringify({ question }) });
  },

  addWorkspaceItem(
    workspaceId: string,
    body: { item_type: string; title: string; content?: string; reference_id?: string }
  ): Promise<WorkspaceItemOut> {
    return request(`/workspaces/${workspaceId}/items`, { method: "POST", body: JSON.stringify(body) });
  },

  deleteWorkspaceItem(workspaceId: string, itemId: string): Promise<{ status: string }> {
    return request(`/workspaces/${workspaceId}/items/${itemId}`, { method: "DELETE" });
  },

  async uploadWorkspaceFile(workspaceId: string, file: File): Promise<WorkspaceItemOut> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/items/upload`, {
      method: "POST",
      headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
      body: form,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },

  async downloadWorkspaceFile(workspaceId: string, itemId: string, fileName: string): Promise<void> {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/items/${itemId}/download`, {
      headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  listReports(): Promise<ReportOut[]> {
    return request(`/reports`);
  },

  createReport(body: { title: string; geographic_unit_id?: string; workspace_id?: string }): Promise<ReportOut> {
    return request(`/reports`, { method: "POST", body: JSON.stringify(body) });
  },

  getReport(id: string): Promise<ReportDetailOut> {
    return request(`/reports/${id}`);
  },

  addReportSection(
    reportId: string,
    body: { section_type: string; title: string; content?: string; reference_id?: string }
  ): Promise<ReportSectionOut> {
    return request(`/reports/${reportId}/sections`, { method: "POST", body: JSON.stringify(body) });
  },

  deleteReportSection(reportId: string, sectionId: string): Promise<{ status: string }> {
    return request(`/reports/${reportId}/sections/${sectionId}`, { method: "DELETE" });
  },

  finalizeReport(id: string): Promise<ReportOut> {
    return request(`/reports/${id}/finalize`, { method: "POST" });
  },

  approveReport(id: string): Promise<{ report: ReportOut; evidence_document_id: string | null }> {
    return request(`/reports/${id}/approve`, { method: "POST" });
  },

  rejectReport(id: string, reason: string): Promise<ReportOut> {
    return request(`/reports/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
  },

  listNotifications(): Promise<NotificationOut[]> {
    return request(`/notifications`);
  },

  markNotificationRead(id: string): Promise<NotificationOut> {
    return request(`/notifications/${id}/read`, { method: "POST" });
  },

  getProfile(): Promise<ProfileOut> {
    return request(`/profile`);
  },

  askScenarioQuestion(question: string, scenario: unknown): Promise<{ answer: string }> {
    return request(`/scenario-qa`, { method: "POST", body: JSON.stringify({ question, scenario }) });
  },

  getScenarioContext(): Promise<{ id: string; name: string; stateName: string; areaKm2: number | null; forestPct: number | null }[]> {
    return request(`/scenario-context`);
  },

  // --- GIS & Land Insights: Tehsil/Taluk -> Village -> Parcel (sample data adapter) ---

  getDistrictHierarchy(districtId: string): Promise<DistrictHierarchyOut> {
    return request(`/gis/districts/${districtId}`);
  },

  getDistrictGisLayers(districtId: string): Promise<DistrictGisLayers | DistrictGisUnsupported> {
    return request(`/gis/districts/${districtId}/layers`);
  },

  getParcelDetail(parcelId: string): Promise<ParcelDetailOut> {
    return request(`/gis/parcels/${parcelId}`);
  },

  searchParcels(query: string): Promise<GisSearchResultOut[]> {
    return request(`/gis/search?q=${encodeURIComponent(query)}`);
  },
};
