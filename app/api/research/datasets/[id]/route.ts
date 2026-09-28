import { NextResponse } from 'next/server';
import { getDatabase, mapDataset } from '@/lib/research/db';

// GET /api/datasets/[id] - single dataset detail
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const db = getDatabase();
    const row = db.prepare('SELECT * FROM datasets WHERE id = ?').get(id) as any;

    if (!row) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: mapDataset(row) }, { status: 200 });
  } catch (error) {
    console.error('Error fetching dataset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dataset' },
      { status: 500 }
    );
  }
}
