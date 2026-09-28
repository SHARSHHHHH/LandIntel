import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDatabase, mapFinding, nowIso } from '@/lib/research/db';
import { authorizeProjectWrite } from '@/lib/research/project-auth';

const DATA_STATUSES = ['REAL', 'SAMPLE', 'DERIVED'];

// POST /api/projects/[id]/findings - add a finding to a project
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { analysisId, statement, confidence = 'Moderate', dataStatus = 'SAMPLE' } = body;

    if (!statement) {
      return NextResponse.json(
        { error: 'Missing required field: statement' },
        { status: 400 }
      );
    }

    if (!DATA_STATUSES.includes(dataStatus)) {
      return NextResponse.json(
        { error: 'invalid dataStatus; expected one of REAL, SAMPLE, DERIVED' },
        { status: 400 }
      );
    }

    const access = await authorizeProjectWrite(id);
    if (access.response) return access.response;

    const db = getDatabase();

    // If analysisId is provided, it must belong to this project
    if (analysisId) {
      const analysis = db.prepare('SELECT project_id FROM analyses WHERE id = ?').get(analysisId) as any;

      if (!analysis) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404 }
        );
      }
      if (analysis.project_id !== id) {
        return NextResponse.json(
          { error: 'Analysis does not belong to this project' },
          { status: 400 }
        );
      }
    }

    // Create the finding
    const findingId = randomUUID();
    const createdAt = nowIso();
    db.prepare(
      `INSERT INTO findings (id, project_id, analysis_id, statement, confidence, data_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(findingId, id, analysisId || null, statement, confidence, dataStatus, createdAt);

    const row = db.prepare('SELECT * FROM findings WHERE id = ?').get(findingId) as any;

    return NextResponse.json({ success: true, data: mapFinding(row) }, { status: 201 });
  } catch (error) {
    console.error('Error adding finding to project:', error);
    return NextResponse.json(
      { error: 'Failed to add finding to project' },
      { status: 500 }
    );
  }
}
