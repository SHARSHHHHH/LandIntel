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
    uploaded_document_id: d.uploaded_document_id ?? null,
    category: d.category ?? "uploaded_report",
    state: d.state ?? null,
    parcel_id: d.parcel_id ?? null,
    page_ref: d.page_ref ?? null,
    last_verified: d.last_verified ?? null,
  };
}

export function serializeDocumentDetail(d: any) {
  const db = getDatabase();
  let extracted_text: string | null = null;
  let file: { filename: string; mime_type: string | null; file_size: number | null } | null = null;
  if (d.uploaded_document_id) {
    const u = db.prepare("SELECT filename, mime_type, file_size, extracted_text FROM uploaded_documents WHERE id = ?").get(d.uploaded_document_id) as any;
    if (u) {
      extracted_text = u.extracted_text ?? null;
      file = { filename: u.filename, mime_type: u.mime_type, file_size: u.file_size };
    }
  }
  return { ...serializeDocument(d), extracted_text, file };
}

export function serializeUploadedDocument(u: any) {
  return {
    id: u.id,
    geographic_unit_id: u.geographic_unit_id,
    filename: u.filename,
    mime_type: u.mime_type,
    file_size: u.file_size,
    uploaded_by: u.uploaded_by,
    uploaded_at: u.uploaded_at,
    status: u.status,
    extracted_text: u.extracted_text,
    extraction_error: u.extraction_error,
    report_id: u.report_id,
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
    eligibility: s.eligibility ?? null,
    benefits: s.benefits ?? null,
    required_documents: s.required_documents ?? null,
    application_process: s.application_process ?? null,
    last_verified: s.last_verified ?? null,
  };
}

function userName(userId: string | null): string | null {
  if (!userId) return null;
  const db = getDatabase();
  const u = db.prepare("SELECT full_name, email FROM users WHERE id = ?").get(userId) as any;
  return u ? u.full_name || u.email : null;
}

export function serializeWorkspace(w: any) {
  const db = getDatabase();
  const item_count = (db.prepare("SELECT COUNT(*) as c FROM workspace_items WHERE workspace_id = ?").get(w.id) as any).c;
  const member_count =
    1 + ((db.prepare("SELECT COUNT(*) as c FROM workspace_members WHERE workspace_id = ? AND user_id != ?").get(w.id, w.owner_id) as any).c);
  const document_count = (db.prepare("SELECT COUNT(*) as c FROM workspace_documents WHERE workspace_id = ?").get(w.id) as any).c;
  const dataset_count = (db.prepare("SELECT COUNT(*) as c FROM workspace_gis_links WHERE workspace_id = ?").get(w.id) as any).c;
  const taskRows = db.prepare("SELECT status FROM workspace_tasks WHERE workspace_id = ?").all(w.id) as any[];
  return {
    id: w.id,
    name: w.name,
    description: w.description,
    research_area: w.research_area ?? null,
    research_type: w.research_type ?? null,
    geographic_unit_id: w.geographic_unit_id,
    geography_name: w.geography_name ?? null,
    start_date: w.start_date ?? null,
    end_date: w.end_date ?? null,
    visibility: w.visibility ?? "Team",
    status: w.status ?? "active",
    owner_id: w.owner_id,
    owner_name: userName(w.owner_id),
    created_at: w.created_at,
    updated_at: w.updated_at,
    item_count,
    member_count,
    document_count,
    dataset_count,
    task_progress: { total: taskRows.length, done: taskRows.filter((t) => t.status === "done").length },
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

export function serializeWorkspaceMember(m: any) {
  const db = getDatabase();
  const u = db.prepare("SELECT full_name, email FROM users WHERE id = ?").get(m.user_id) as any;
  return {
    id: m.id,
    user_id: m.user_id,
    full_name: u?.full_name ?? null,
    email: u?.email ?? "unknown",
    role: m.role,
    added_at: m.added_at,
  };
}

export function serializeWorkspaceTask(t: any) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    assignee_id: t.assignee_id,
    assignee_name: userName(t.assignee_id),
    due_date: t.due_date,
    created_by: t.created_by,
    created_at: t.created_at,
    updated_at: t.updated_at,
  };
}

export function serializeWorkspaceDiscussion(d: any) {
  return {
    id: d.id,
    parent_id: d.parent_id,
    author_id: d.author_id,
    author_name: userName(d.author_id) ?? "Unknown",
    body: d.body,
    created_at: d.created_at,
  };
}

export function serializeWorkspaceFinding(f: any) {
  const db = getDatabase();
  let title: string | null = null;
  if (f.evidence_document_id) {
    const doc = db.prepare("SELECT title FROM documents WHERE id = ?").get(f.evidence_document_id) as any;
    title = doc?.title ?? null;
  }
  return {
    id: f.id,
    statement: f.statement,
    confidence: f.confidence,
    evidence_document_id: f.evidence_document_id,
    evidence_document_title: title,
    created_by: f.created_by,
    created_by_name: userName(f.created_by) ?? "Unknown",
    created_at: f.created_at,
  };
}

export function serializeWorkspacePolicyNote(n: any) {
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    created_by: n.created_by,
    created_by_name: userName(n.created_by) ?? "Unknown",
    created_at: n.created_at,
  };
}

export function serializeWorkspaceLinkedDocument(link: any) {
  const db = getDatabase();
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(link.document_id) as any;
  return {
    link_id: link.id,
    document: doc ? serializeDocument(doc) : null,
    added_by: link.added_by,
    added_at: link.added_at,
  };
}

export function serializeWorkspaceGisLink(link: any) {
  const db = getDatabase();
  const geo = link.geographic_unit_id
    ? (db.prepare("SELECT name FROM geographic_units WHERE id = ?").get(link.geographic_unit_id) as any)
    : null;
  return {
    id: link.id,
    geographic_unit_id: link.geographic_unit_id,
    geographic_unit_name: geo?.name ?? null,
    parcel_id: link.parcel_id,
    parcel_label: link.label,
    label: link.label,
    note: link.note,
    added_by: link.added_by,
    added_at: link.added_at,
  };
}

export function serializeWorkspaceActivity(a: any) {
  return {
    id: a.id,
    actor_id: a.actor_id,
    actor_name: userName(a.actor_id) ?? "Unknown",
    action: a.action,
    detail: a.detail,
    created_at: a.created_at,
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
    source_document_id: r.source_document_id ?? null,
    rejection_reason: r.rejection_reason ?? null,
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
