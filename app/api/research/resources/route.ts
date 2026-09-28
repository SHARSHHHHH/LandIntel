import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDatabase, mapResource, nowIso } from '@/lib/research/db';

const SORTABLE_FIELDS: Record<string, string> = {
  createdAt: 'created_at',
  title: 'title',
  publicationYear: 'publication_year',
  topic: 'topic',
  dataStatus: 'data_status',
};

// GET /api/resources - list with search, filter, sort
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const state = searchParams.get('state') || '';
    const district = searchParams.get('district') || '';
    const dataStatus = searchParams.get('dataStatus') || '';
    const sort = searchParams.get('sort') || 'createdAt:desc';

    const [field, direction] = sort.split(':');
    const column = SORTABLE_FIELDS[field] || 'created_at';
    const dir = direction === 'asc' ? 'ASC' : 'DESC';

    const conditions: string[] = [];
    const args: any[] = [];

    if (search) {
      const like = `%${search.toLowerCase()}%`;
      conditions.push(
        '(LOWER(title) LIKE ? OR LOWER(abstract) LIKE ? OR LOWER(keywords) LIKE ? OR LOWER(topic) LIKE ?)'
      );
      args.push(like, like, like, like);
    }
    if (type) {
      conditions.push('resource_type = ?');
      args.push(type);
    }
    if (state) {
      conditions.push('state = ?');
      args.push(state);
    }
    if (district) {
      conditions.push('district = ?');
      args.push(district);
    }
    if (dataStatus) {
      conditions.push('data_status = ?');
      args.push(dataStatus);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const db = getDatabase();
    const rows = db
      .prepare(`SELECT * FROM research_resources ${where} ORDER BY ${column} ${dir} LIMIT 50`)
      .all(...args) as any[];

    const resources = rows.map(mapResource);

    return NextResponse.json({ success: true, data: resources }, { status: 200 });
  } catch (error) {
    console.error('Error fetching research resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch research resources' },
      { status: 500 }
    );
  }
}

// POST /api/resources/save - bookmark/save a resource for current user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { resourceId } = body;

    if (!resourceId) {
      return NextResponse.json(
        { error: 'resourceId is required' },
        { status: 400 }
      );
    }

    // In production, get user from auth
    // For demo, use a fixed demo user ID (matches seeded data)
    const demoUserId = 'user-demo-research';

    const db = getDatabase();

    // Check if resource exists
    const resource = db.prepare('SELECT id FROM research_resources WHERE id = ?').get(resourceId);

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Upsert saved resource
    const existing = db
      .prepare('SELECT * FROM saved_resources WHERE user_id = ? AND resource_id = ?')
      .get(demoUserId, resourceId) as any;

    let saved: any;
    if (existing) {
      saved = existing;
    } else {
      const id = randomUUID();
      const createdAt = nowIso();
      db.prepare(
        'INSERT INTO saved_resources (id, user_id, resource_id, created_at) VALUES (?, ?, ?, ?)'
      ).run(id, demoUserId, resourceId, createdAt);
      saved = { id, user_id: demoUserId, resource_id: resourceId, created_at: createdAt };
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: saved.id,
          userId: saved.user_id,
          resourceId: saved.resource_id,
          createdAt: saved.created_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving resource:', error);
    return NextResponse.json(
      { error: 'Failed to save resource' },
      { status: 500 }
    );
  }
}
