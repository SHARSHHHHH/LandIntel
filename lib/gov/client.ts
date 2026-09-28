import type {
  AreaOverviewOut,
  DashboardSummaryOut,
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
  WorkspaceDetailOut,
  WorkspaceItemOut,
  WorkspaceOut,
} from "./types";

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

  listAllDocuments(params: { q?: string; document_type?: string; geographic_unit_id?: string } = {}): Promise<DocumentOut[]> {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.document_type) qs.set("document_type", params.document_type);
    if (params.geographic_unit_id) qs.set("geographic_unit_id", params.geographic_unit_id);
    const s = qs.toString();
    return request(`/documents${s ? `?${s}` : ""}`);
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

  createWorkspace(body: { name: string; description?: string; geographic_unit_id?: string }): Promise<WorkspaceOut> {
    return request(`/workspaces`, { method: "POST", body: JSON.stringify(body) });
  },

  getWorkspace(id: string): Promise<WorkspaceDetailOut> {
    return request(`/workspaces/${id}`);
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

  listNotifications(): Promise<NotificationOut[]> {
    return request(`/notifications`);
  },

  markNotificationRead(id: string): Promise<NotificationOut> {
    return request(`/notifications/${id}/read`, { method: "POST" });
  },

  getProfile(): Promise<ProfileOut> {
    return request(`/profile`);
  },
};
