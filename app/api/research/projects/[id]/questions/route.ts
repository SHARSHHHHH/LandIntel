import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDatabase, mapQuestion, nowIso } from '@/lib/research/db';
import { authorizeProjectWrite } from '@/lib/research/project-auth';

// POST /api/projects/[id]/questions - add a question to a project
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { question, description } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Missing required field: question' },
        { status: 400 }
      );
    }

    const access = await authorizeProjectWrite(id);
    if (access.response) return access.response;

    const db = getDatabase();

    // Create the question
    const questionId = randomUUID();
    const createdAt = nowIso();
    db.prepare(
      'INSERT INTO research_questions (id, project_id, question, description, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(questionId, id, question, description || null, createdAt);

    const row = db.prepare('SELECT * FROM research_questions WHERE id = ?').get(questionId) as any;

    return NextResponse.json({ success: true, data: mapQuestion(row) }, { status: 201 });
  } catch (error) {
    console.error('Error adding question:', error);
    return NextResponse.json(
      { error: 'Failed to add question' },
      { status: 500 }
    );
  }
}
