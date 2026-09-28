import { getDatabase } from "./db";
import { NextResponse } from "next/server";
import { ApiError } from "./auth";

export function withErrorHandling(handler: () => Promise<NextResponse> | NextResponse): Promise<NextResponse> | NextResponse {
  try {
    const result = handler();
    if (result instanceof Promise) {
      return result.catch((err) => errorResponse(err));
    }
    return result;
  } catch (err) {
    return errorResponse(err);
  }
}

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ detail: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
}

export function serializeSource(sourceId: string | null) {
  if (!sourceId) return null;
  const db = getDatabase();
  const s = db.prepare("SELECT * FROM data_sources WHERE id = ?").get(sourceId) as any;
  if (!s) return null;
  return {
    id: s.id,
    name: s.name,
    provider: s.provider,
    base_url: s.base_url,
    access_type: s.access_type,
    license: s.license,
    status: s.status,
  };
}

export function serializeDataset(datasetId: string) {
  const db = getDatabase();
  const ds = db.prepare("SELECT * FROM datasets WHERE id = ?").get(datasetId) as any;
  if (!ds) return null;
  return {
    id: ds.id,
    name: ds.name,
    data_status: ds.data_status,
    reference_year: ds.reference_year,
    last_updated: ds.last_updated,
    geographic_level: ds.geographic_level,
    coverage_note: ds.coverage_note,
    limitations: ds.limitations,
    source: serializeSource(ds.data_source_id),
  };
}

export function serializeIndicatorValue(iv: any) {
  const db = getDatabase();
  const indicator = db.prepare("SELECT * FROM indicators WHERE id = ?").get(iv.indicator_id) as any;
  return {
    id: iv.id,
    indicator_name: indicator?.name ?? "Unknown",
    category: indicator?.category ?? "land",
    unit: indicator?.unit ?? null,
    value: iv.value,
    value_text: iv.value_text,
    derivation_method: iv.derivation_method,
    dataset: serializeDataset(iv.dataset_id),
  };
}

export function serializeGeographicUnit(g: any) {
  if (!g) return null;
  return {
    id: g.id,
    level: g.level,
    name: g.name,
    code: g.code,
    parent_id: g.parent_id,
    centroid_lat: g.centroid_lat,
    centroid_lng: g.centroid_lng,
  };
}

export function serializeDocument(d: any) {
  return {
    id: d.id,
    title: d.title,
    source_organization: d.source_organization,
    publication_date: d.publication_date,
    document_type: d.document_type,
    source_url: d.source_url,
    data_status: d.data_status,
    summary: d.summary,
  };
}

export function serializeScheme(s: any) {
  return {
    id: s.id,
    name: s.name,
    department: s.department,
    description: s.description,
    scheme_type: s.scheme_type,
    launch_year: s.launch_year,
    status_note: s.status_note,
    source_url: s.source_url,
    data_status: s.data_status,
    as_of_date: s.as_of_date,
  };
}

export function serializeWorkspace(w: any) {
  const db = getDatabase();
  const item_count = (db.prepare("SELECT COUNT(*) as c FROM workspace_items WHERE workspace_id = ?").get(w.id) as any).c;
  return {
    id: w.id,
    name: w.name,
    description: w.description,
    geographic_unit_id: w.geographic_unit_id,
    owner_id: w.owner_id,
    created_at: w.created_at,
    updated_at: w.updated_at,
    item_count,
  };
}

export function serializeWorkspaceItem(i: any) {
  return {
    id: i.id,
    item_type: i.item_type,
    title: i.title,
    content: i.content,
    reference_id: i.reference_id,
    file_name: i.file_name,
    file_size: i.file_size,
    mime_type: i.mime_type,
    created_by: i.created_by,
    created_at: i.created_at,
  };
}

export function serializeReport(r: any) {
  const db = getDatabase();
  const section_count = (db.prepare("SELECT COUNT(*) as c FROM report_sections WHERE report_id = ?").get(r.id) as any).c;
  return {
    id: r.id,
    title: r.title,
    geographic_unit_id: r.geographic_unit_id,
    workspace_id: r.workspace_id,
    owner_id: r.owner_id,
    status: r.status,
    created_at: r.created_at,
    updated_at: r.updated_at,
    section_count,
  };
}

export function serializeReportSection(s: any) {
  return {
    id: s.id,
    section_type: s.section_type,
    title: s.title,
    content: s.content,
    reference_id: s.reference_id,
    order_index: s.order_index,
  };
}

export function serializeNotification(n: any) {
  return {
    id: n.id,
    message: n.message,
    category: n.category,
    related_url: n.related_url,
    is_read: !!n.is_read,
    created_at: n.created_at,
  };
}

export function serializeSavedSearch(s: any) {
  return {
    id: s.id,
    query: s.query,
    geographic_unit_id: s.geographic_unit_id,
    document_type: s.document_type,
    created_at: s.created_at,
  };
}
