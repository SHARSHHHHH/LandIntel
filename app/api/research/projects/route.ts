import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDatabase, mapProject, mapMember, nowIso } from '@/lib/research/db';
import { getCurrentUser } from '@/lib/research/project-auth';

const SORTABLE_FIELDS: Record<string, string> = {
  createdAt: 'created_at',
  title: 'title',
  status: 'status',
};

function attachRelations(db: ReturnType<typeof getDatabase>, project: any, currentUser: { id: string } | null) {
  const ownerRow = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(project.ownerId) as any;
  const memberRows = db.prepare('SELECT * FROM project_members WHERE project_id = ?').all(project.id) as any[];
  const members = memberRows.map((m) => {
    const userRow = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(m.user_id) as any;
    return { ...mapMember(m), user: userRow ? { id: userRow.id, name: userRow.name, email: userRow.email } : null };
  });

  const counts = {
    questions: (db.prepare('SELECT COUNT(*) c FROM research_questions WHERE project_id = ?').get(project.id) as any).c,
    resources: (db.prepare('SELECT COUNT(*) c FROM project_resources WHERE project_id = ?').get(project.id) as any).c,
    datasets: (db.prepare('SELECT COUNT(*) c FROM project_datasets WHERE project_id = ?').get(project.id) as any).c,
    gisLayers: (db.prepare('SELECT COUNT(*) c FROM project_gis_layers WHERE project_id = ?').get(project.id) as any).c,
    analyses: (db.prepare('SELECT COUNT(*) c FROM analyses WHERE project_id = ?').get(project.id) as any).c,
    findings: (db.prepare('SELECT COUNT(*) c FROM findings WHERE project_id = ?').get(project.id) as any).c,
    outputs: (db.prepare('SELECT COUNT(*) c FROM research_outputs WHERE project_id = ?').get(project.id) as any).c,
  };

  const myMember = currentUser ? memberRows.find((m) => m.user_id === currentUser.id) : undefined;

  return {
    ...project,
    owner: ownerRow ? { id: ownerRow.id, name: ownerRow.name, email: ownerRow.email } : null,
    members,
    _count: counts,
    myRole: myMember ? myMember.role : null,
  };
}

// GET /api/projects - list projects the current user can access (member or public)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const visibility = searchParams.get('visibility') || '';
    const sort = searchParams.get('sort') || 'createdAt:desc';

    const [field, direction] = sort.split(':');
    const column = SORTABLE_FIELDS[field] || 'created_at';
    const dir = direction === 'asc' ? 'ASC' : 'DESC';

    const db = getDatabase();
    const currentUser = await getCurrentUser();

    const conditions: string[] = [];
    const args: any[] = [];

    if (currentUser) {
      conditions.push(
        `(visibility = 'Public' OR id IN (SELECT project_id FROM project_members WHERE user_id = ?))`
      );
      args.push(currentUser.id);
    } else {
      conditions.push(`visibility = 'Public'`);
    }

    if (search) {
      const like = `%${search.toLowerCase()}%`;
      conditions.push(
        '(LOWER(title) LIKE ? OR LOWER(research_problem) LIKE ? OR LOWER(institution) LIKE ? OR LOWER(geographic_scope) LIKE ?)'
      );
      args.push(like, like, like, like);
    }
    if (status) {
      conditions.push('status = ?');
      args.push(status);
    }
    if (visibility) {
      conditions.push('visibility = ?');
      args.push(visibility);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db
      .prepare(`SELECT * FROM research_projects ${where} ORDER BY ${column} ${dir} LIMIT 50`)
      .all(...args) as any[];

    const data = rows.map((row) => attachRelations(db, mapProject(row), currentUser));

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - create a new project
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      researchProblem,
      objectives,
      geographicScope,
      startDate,
      endDate,
      institution,
      status = 'DRAFT',
      visibility = 'Public',
    } = body;

    // Validate required fields
    if (!title || !researchProblem || !geographicScope || !institution) {
      return NextResponse.json(
        { error: 'Missing required fields: title, researchProblem, geographicScope, institution' },
        { status: 400 }
      );
    }

    // The authenticated demo user becomes the project owner
    const owner = await getCurrentUser();

    if (!owner) {
      return NextResponse.json(
        { error: 'Authenticated user not found' },
        { status: 401 }
      );
    }

    const db = getDatabase();
    const id = randomUUID();
    const createdAt = nowIso();

    const insertProject = db.prepare(
      `INSERT INTO research_projects
        (id, title, research_problem, objectives, geographic_scope, start_date, end_date, institution, status, visibility, owner_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertMember = db.prepare(
      `INSERT INTO project_members (id, project_id, user_id, role, created_at) VALUES (?, ?, ?, 'OWNER', ?)`
    );

    const tx = db.transaction(() => {
      insertProject.run(
        id,
        title,
        researchProblem,
        JSON.stringify(Array.isArray(objectives) ? objectives : []),
        geographicScope,
        startDate ? new Date(startDate).toISOString() : null,
        endDate ? new Date(endDate).toISOString() : null,
        institution,
        status,
        visibility,
        owner.id,
        createdAt,
        createdAt
      );
      insertMember.run(randomUUID(), id, owner.id, createdAt);
    });
    tx();

    const row = db.prepare('SELECT * FROM research_projects WHERE id = ?').get(id) as any;
    const project = attachRelations(db, mapProject(row), owner);

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
