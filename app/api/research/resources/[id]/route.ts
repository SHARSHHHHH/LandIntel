import { NextResponse } from 'next/server';
import { getDatabase, mapResource } from '@/lib/research/db';

// GET /api/resources/[id] - single resource detail
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const db = getDatabase();
    const row = db.prepare('SELECT * FROM research_resources WHERE id = ?').get(id) as any;

    if (!row) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: mapResource(row) }, { status: 200 });
  } catch (error) {
    console.error('Error fetching resource:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}
