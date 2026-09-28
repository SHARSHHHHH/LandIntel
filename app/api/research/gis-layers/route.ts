import { NextResponse } from 'next/server';
import { getDatabase, mapGisLayer } from '@/lib/research/db';
import { getCurrentUser } from '@/lib/research/project-auth';

const SORTABLE_FIELDS: Record<string, string> = {
  createdAt: 'created_at',
  name: 'name',
  category: 'category',
  dataStatus: 'data_status',
};

// GET /api/gis-layers - list GIS layers with search, filter, sort
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const state = searchParams.get('state') || '';
    const dataStatus = searchParams.get('dataStatus') || '';
    const sort = searchParams.get('sort') || 'createdAt:desc';

    const [field, direction] = sort.split(':');
    const column = SORTABLE_FIELDS[field] || 'created_at';
    const dir = direction === 'asc' ? 'ASC' : 'DESC';

    const conditions: string[] = [];
    const args: any[] = [];

    if (search) {
      const like = `%${search.toLowerCase()}%`;
      conditions.push('(LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ?)');
      args.push(like, like, like);
    }
    if (category) {
      conditions.push('category = ?');
      args.push(category);
    }
    if (state) {
      conditions.push('state = ?');
      args.push(state);
    }
    if (dataStatus) {
      conditions.push('data_status = ?');
      args.push(dataStatus);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const db = getDatabase();
    const rows = db
      .prepare(`SELECT * FROM gis_layers ${where} ORDER BY ${column} ${dir} LIMIT 50`)
      .all(...args) as any[];

    const layers = rows.map(mapGisLayer);

    return NextResponse.json({ success: true, data: layers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching GIS layers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GIS layers' },
      { status: 500 }
    );
  }
}
