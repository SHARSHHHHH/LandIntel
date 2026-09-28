import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDatabase, mapOutput, mapMember, nowIso } from '@/lib/research/db';
import { getCurrentUser } from '@/lib/research/project-auth';

const VALID_OUTPUT_TYPES = ['Report', 'Policy Brief', 'Case Study', 'Dataset', 'GIS Analysis', 'Paper', 'Model/Pilot'];

function normalizeType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const SORTABLE_FIELDS: Record<string, string> = {
  createdAt: 'created_at',
  title: 'title',
  type: 'type',
};

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

// GET /api/outputs - list outputs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const projectId = searchParams.get('projectId') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const dataStatus = searchParams.get('dataStatus') || '';
    const authorId = searchParams.get('authorId') || '';
    const sort = searchParams.get('sort') || 'createdAt:desc';

    const [field, direction] = sort.split(':');
    const column = SORTABLE_FIELDS[field] || 'created_at';
    const dir = direction === 'asc' ? 'ASC' : 'DESC';

    const db = getDatabase();
    const currentUser = await getCurrentUser();

    const conditions: string[] = [];
    const args: any[] = [];

    // Access: visibility = Public OR project has current user as member
    if (currentUser) {
      conditions.push(
        `(visibility = 'Public' OR project_id IN (SELECT project_id FROM project_members WHERE user_id = ?))`
      );
      args.push(currentUser.id);
    } else {
      conditions.push(`visibility = 'Public'`);
    }

    if (search) {
      const like = `%${search.toLowerCase()}%`;
      conditions.push('(LOWER(title) LIKE ? OR LOWER(abstract) LIKE ?)');
      args.push(like, like);
    }
    if (projectId) {
      conditions.push('project_id = ?');
      args.push(projectId);
    }
    if (type) {
      conditions.push('type = ?');
      args.push(type);
    }
    if (status) {
      conditions.push('review_status = ?');
      args.push(status);
    }
    if (dataStatus) {
      conditions.push('data_status = ?');
      args.push(dataStatus);
    }
    if (authorId) {
      conditions.push('author_id = ?');
      args.push(authorId);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db
      .prepare(`SELECT * FROM research_outputs ${where} ORDER BY ${column} ${dir} LIMIT 50`)
      .all(...args) as any[];

    const outputs = rows.map(mapOutput).map((o) => attachRelations(db, o));

    return NextResponse.json({ success: true, data: outputs }, { status: 200 });
  } catch (error) {
    console.error('Error fetching outputs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outputs' },
      { status: 500 }
    );
  }
}

// POST /api/outputs - create output
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      type,
      projectId,
      abstract,
      keywords,
      methodology,
      dataSources,
      version,
      visibility,
    } = body;

    const normalizedType = normalizeType(type || '');

    // Validate required fields
    if (!title || !normalizedType || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, projectId' },
        { status: 400 }
      );
    }

    // Validate output type
    if (!VALID_OUTPUT_TYPES.includes(normalizedType)) {
      return NextResponse.json(
        { error: `Invalid output type. Must be one of: ${VALID_OUTPUT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Check if project exists
    const project = db.prepare('SELECT * FROM research_projects WHERE id = ?').get(projectId) as any;

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Verify user has write permission
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authenticated user not found' },
        { status: 401 }
      );
    }

    const member = db
      .prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?')
      .get(projectId, currentUser.id) as any;

    if (!member || !['OWNER', 'EDITOR', 'CONTRIBUTOR'].includes(member.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to create outputs for this project' },
        { status: 403 }
      );
    }

    const id = randomUUID();
    const createdAt = nowIso();

    db.prepare(
      `INSERT INTO research_outputs
        (id, project_id, title, type, author_id, abstract, keywords, methodology, data_sources, version, review_status, data_status, visibility, publication_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', 'SAMPLE', ?, NULL, ?, ?)`
    ).run(
      id,
      projectId,
      title,
      normalizedType,
      currentUser.id,
      abstract || '',
      JSON.stringify(Array.isArray(keywords) ? keywords : []),
      methodology || '',
      JSON.stringify(Array.isArray(dataSources) ? dataSources : []),
      version || '1.0',
      visibility || 'Internal',
      createdAt,
      createdAt
    );

    const row = db.prepare('SELECT * FROM research_outputs WHERE id = ?').get(id) as any;
    const output = attachRelations(db, mapOutput(row));

    return NextResponse.json({ success: true, data: output }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating output:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create output' },
      { status: 500 }
    );
  }
}
