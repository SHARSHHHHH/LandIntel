import { NextResponse } from 'next/server';
import { getDatabase, mapOutput, mapMember } from '@/lib/research/db';
import { getCurrentUser } from '@/lib/research/project-auth';

const VALID_OUTPUT_TYPES = ['Report', 'Policy Brief', 'Case Study', 'Dataset', 'GIS Analysis', 'Paper', 'Model/Pilot'];
const VALID_REVIEW_STATUSES = ['DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'ARCHIVED'];

function normalizeType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function attachRelations(db: ReturnType<typeof getDatabase>, output: any) {
  const projectRow = db
    .prepare('SELECT id, title, status, owner_id FROM research_projects WHERE id = ?')
    .get(output.projectId) as any;
  const members = db
    .prepare('SELECT * FROM project_members WHERE project_id = ?')
    .all(output.projectId)
    .map(mapMember);
  const authorRow = db
    .prepare('SELECT id, name, email FROM users WHERE id = ?')
    .get(output.authorId) as any;

  return {
    ...output,
    project: projectRow
      ? { id: projectRow.id, title: projectRow.title, status: projectRow.status, ownerId: projectRow.owner_id, members }
      : null,
    author: authorRow ? { id: authorRow.id, name: authorRow.name, email: authorRow.email } : null,
  };
}

// GET /api/outputs/[id] - get single output
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM research_outputs WHERE id = ?').get(params.id) as any;

    if (!row) {
      return NextResponse.json({ error: 'Output not found' }, { status: 404 });
    }

    const output = attachRelations(db, mapOutput(row));

    const currentUser = await getCurrentUser();
    const isPublic = output.visibility === 'Public';
    const isProjectMember = currentUser
      ? output.project?.members.some((m: any) => m.userId === currentUser.id)
      : false;

    if (!isPublic && !isProjectMember && output.project?.ownerId !== currentUser?.id) {
      return NextResponse.json({ error: 'Not authorized to view this output' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: output }, { status: 200 });
  } catch (error) {
    console.error('Error fetching output:', error);
    return NextResponse.json(
      { error: 'Failed to fetch output' },
      { status: 500 }
    );
  }
}

// PUT /api/outputs/[id] - update output
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const {
      title,
      type,
      abstract,
      keywords,
      methodology,
      dataSources,
      version,
      visibility,
      reviewStatus,
      dataStatus,
      publicationDate,
    } = body;

    const db = getDatabase();
    const existingRow = db.prepare('SELECT * FROM research_outputs WHERE id = ?').get(params.id) as any;

    if (!existingRow) {
      return NextResponse.json({ error: 'Output not found' }, { status: 404 });
    }

    const normalizedType = type ? normalizeType(type) : undefined;
    if (normalizedType && !VALID_OUTPUT_TYPES.includes(normalizedType)) {
      return NextResponse.json(
        { error: `Invalid output type` },
        { status: 400 }
      );
    }

    if (reviewStatus && !VALID_REVIEW_STATUSES.includes(reviewStatus)) {
      return NextResponse.json(
        { error: `Invalid review status` },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const member = db
      .prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?')
      .get(existingRow.project_id, currentUser.id) as any;

    if (!member || !['OWNER', 'EDITOR', 'CONTRIBUTOR'].includes(member.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this output' },
        { status: 403 }
      );
    }

    const updated = {
      title: title !== undefined ? title : existingRow.title,
      type: normalizedType !== undefined ? normalizedType : existingRow.type,
      abstract: abstract !== undefined ? abstract : existingRow.abstract,
      keywords: keywords !== undefined ? JSON.stringify(keywords) : existingRow.keywords,
      methodology: methodology !== undefined ? methodology : existingRow.methodology,
      dataSources: dataSources !== undefined ? JSON.stringify(dataSources) : existingRow.data_sources,
      version: version !== undefined ? version : existingRow.version,
      visibility: visibility !== undefined ? visibility : existingRow.visibility,
      reviewStatus: reviewStatus !== undefined ? reviewStatus : existingRow.review_status,
      dataStatus: dataStatus !== undefined ? dataStatus : existingRow.data_status,
      publicationDate: publicationDate !== undefined ? publicationDate : existingRow.publication_date,
      updatedAt: new Date().toISOString(),
    };

    db.prepare(
      `UPDATE research_outputs SET
        title = ?, type = ?, abstract = ?, keywords = ?, methodology = ?, data_sources = ?,
        version = ?, visibility = ?, review_status = ?, data_status = ?, publication_date = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      updated.title,
      updated.type,
      updated.abstract,
      updated.keywords,
      updated.methodology,
      updated.dataSources,
      updated.version,
      updated.visibility,
      updated.reviewStatus,
      updated.dataStatus,
      updated.publicationDate,
      updated.updatedAt,
      params.id
    );

    const row = db.prepare('SELECT * FROM research_outputs WHERE id = ?').get(params.id) as any;
    const output = attachRelations(db, mapOutput(row));

    return NextResponse.json({ success: true, data: output }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating output:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update output' },
      { status: 500 }
    );
  }
}
