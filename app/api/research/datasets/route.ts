import { NextResponse } from 'next/server';
import { getDatabase, mapDataset } from '@/lib/research/db';

const SORTABLE_FIELDS: Record<string, string> = {
  createdAt: 'created_at',
  name: 'name',
  provider: 'provider',
  type: 'type',
  geographicScope: 'geographic_scope',
  qualityStatus: 'quality_status',
  dataStatus: 'data_status',
};

// GET /api/datasets - list with search, filter, sort
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const provider = searchParams.get('provider') || '';
    const type = searchParams.get('type') || '';
    const geographicScope = searchParams.get('geographicScope') || '';
    const qualityStatus = searchParams.get('qualityStatus') || '';
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
        '(LOWER(name) LIKE ? OR LOWER(variables) LIKE ? OR LOWER(geographic_scope) LIKE ? OR LOWER(provider) LIKE ?)'
      );
      args.push(like, like, like, like);
    }
    if (provider) {
      conditions.push('provider = ?');
      args.push(provider);
    }
    if (type) {
      conditions.push('type = ?');
      args.push(type);
    }
    if (geographicScope) {
      conditions.push('LOWER(geographic_scope) LIKE ?');
      args.push(`%${geographicScope.toLowerCase()}%`);
    }
    if (qualityStatus) {
      conditions.push('quality_status = ?');
      args.push(qualityStatus);
    }
    if (dataStatus) {
      conditions.push('data_status = ?');
      args.push(dataStatus);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const db = getDatabase();
    const rows = db
      .prepare(`SELECT * FROM datasets ${where} ORDER BY ${column} ${dir} LIMIT 50`)
      .all(...args) as any[];

    const datasets = rows.map(mapDataset);

    return NextResponse.json({ success: true, data: datasets }, { status: 200 });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch datasets' },
      { status: 500 }
    );
  }
}
