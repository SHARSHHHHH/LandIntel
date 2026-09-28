import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDatabase, mapOpportunity, nowIso } from '@/lib/research/db';
import { getCurrentUser } from '@/lib/research/project-auth';

const SORTABLE_FIELDS: Record<string, string> = {
  createdAt: 'created_at',
  deadline: 'deadline',
  title: 'title',
};

// GET /api/innovation - list opportunities
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const sort = searchParams.get('sort') || 'deadline:asc';

    const [field, direction] = sort.split(':');
    const column = SORTABLE_FIELDS[field] || 'deadline';
    const dir = direction === 'asc' ? 'ASC' : 'DESC';

    const conditions: string[] = [];
    const args: any[] = [];

    if (search) {
      const like = `%${search.toLowerCase()}%`;
      conditions.push('(LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(organizer) LIKE ?)');
      args.push(like, like, like);
    }
    if (type) {
      conditions.push('type = ?');
      args.push(type);
    }
    if (status) {
      conditions.push('status = ?');
      args.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const db = getDatabase();
    const rows = db
      .prepare(`SELECT * FROM innovation_opportunities ${where} ORDER BY ${column} ${dir} LIMIT 50`)
      .all(...args) as any[];

    const opportunities = rows.map((row) => {
      const submissions = db
        .prepare(
          'SELECT id, user_id, title, status, created_at FROM innovation_submissions WHERE opportunity_id = ?'
        )
        .all(row.id) as any[];
      return {
        ...mapOpportunity(row),
        submissions: submissions.map((s) => ({
          id: s.id,
          userId: s.user_id,
          title: s.title,
          status: s.status,
          createdAt: s.created_at,
        })),
      };
    });

    return NextResponse.json({ success: true, data: opportunities }, { status: 200 });
  } catch (error) {
    console.error('Error fetching innovation opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch innovation opportunities' },
      { status: 500 }
    );
  }
}

// POST /api/innovation - create opportunity
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, type, organizer, description, deadline, eligibility, status } = body;

    if (!title || !type || !organizer || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, organizer, description' },
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

    const db = getDatabase();
    const id = randomUUID();
    const createdAt = nowIso();
    const deadlineIso = deadline ? new Date(deadline).toISOString() : new Date().toISOString();

    db.prepare(
      `INSERT INTO innovation_opportunities (id, title, type, organizer, description, deadline, eligibility, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, title, type, organizer, description, deadlineIso, eligibility || '', status || 'OPEN', createdAt);

    const row = db.prepare('SELECT * FROM innovation_opportunities WHERE id = ?').get(id) as any;

    return NextResponse.json({ success: true, data: mapOpportunity(row) }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating innovation opportunity:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create opportunity' },
      { status: 500 }
    );
  }
}
