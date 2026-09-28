import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDatabase, mapAnalysis, mapQuestion, nowIso } from '@/lib/research/db';
import { authorizeProjectWrite } from '@/lib/research/project-auth';

const DATA_STATUSES = ['REAL', 'SAMPLE', 'DERIVED'];

// POST /api/projects/[id]/analysis - add an analysis to a project
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { questionId, title, methodology, resultsSummary, dataStatus = 'SAMPLE' } = body;

    if (!title || !methodology || !resultsSummary) {
      return NextResponse.json(
        { error: 'Missing required fields: title, methodology, resultsSummary' },
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

    // If questionId is provided, it must belong to this project
    if (questionId) {
      const question = db
        .prepare('SELECT project_id FROM research_questions WHERE id = ?')
        .get(questionId) as any;

      if (!question) {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        );
      }
      if (question.project_id !== id) {
        return NextResponse.json(
          { error: 'Question does not belong to this project' },
          { status: 400 }
        );
      }
    }

    // Create the analysis
    const analysisId = randomUUID();
    const createdAt = nowIso();
    db.prepare(
      `INSERT INTO analyses (id, project_id, question_id, title, methodology, results_summary, data_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(analysisId, id, questionId || null, title, methodology, resultsSummary, dataStatus, createdAt);

    const row = db.prepare('SELECT * FROM analyses WHERE id = ?').get(analysisId) as any;
    const questionRow = row.question_id
      ? (db.prepare('SELECT * FROM research_questions WHERE id = ?').get(row.question_id) as any)
      : null;

    const analysis = {
      ...mapAnalysis(row),
      question: questionRow ? mapQuestion(questionRow) : null,
      findings: [] as any[],
    };

    return NextResponse.json({ success: true, data: analysis }, { status: 201 });
  } catch (error) {
    console.error('Error adding analysis to project:', error);
    return NextResponse.json(
      { error: 'Failed to add analysis to project' },
      { status: 500 }
    );
  }
}
