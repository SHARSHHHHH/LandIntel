import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDatabase, mapOpportunity, nowIso } from '@/lib/research/db';
import { getCurrentUser } from '@/lib/research/project-auth';

// POST /api/innovation/[id]/submit - submit an innovation opportunity
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { title, abstract, projectId } = body;

    // Validate required fields
    if (!title || !abstract) {
      return NextResponse.json(
        { error: 'Missing required fields: title, abstract' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Verify opportunity exists
    const opportunity = db.prepare('SELECT * FROM innovation_opportunities WHERE id = ?').get(params.id) as any;

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    // Verify opportunity is still open
    if (opportunity.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'This opportunity is no longer accepting submissions' },
        { status: 400 }
      );
    }

    // Verify deadline has not passed
    if (new Date(opportunity.deadline) < new Date()) {
      return NextResponse.json(
        { error: 'The deadline for this opportunity has passed' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check for duplicate submission (opportunityId + userId)
    const existingSubmission = db
      .prepare('SELECT * FROM innovation_submissions WHERE opportunity_id = ? AND user_id = ?')
      .get(params.id, currentUser.id) as any;

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted to this opportunity', submissionId: existingSubmission.id },
        { status: 409 }
      );
    }

    // Create submission
    const id = randomUUID();
    const createdAt = nowIso();
    db.prepare(
      `INSERT INTO innovation_submissions (id, opportunity_id, user_id, project_id, title, abstract, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'SUBMITTED', ?)`
    ).run(id, params.id, currentUser.id, projectId || null, title, abstract, createdAt);

    const row = db.prepare('SELECT * FROM innovation_submissions WHERE id = ?').get(id) as any;
    const userRow = db.prepare('SELECT id, name FROM users WHERE id = ?').get(currentUser.id) as any;

    const submission = {
      id: row.id,
      opportunityId: row.opportunity_id,
      userId: row.user_id,
      projectId: row.project_id,
      title: row.title,
      abstract: row.abstract,
      status: row.status,
      createdAt: row.created_at,
      opportunity: { id: opportunity.id, title: opportunity.title },
      user: userRow ? { id: userRow.id, name: userRow.name } : null,
    };

    return NextResponse.json({
      success: true,
      data: submission,
      message: 'Submission successful',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting innovation opportunity:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit' },
      { status: 500 }
    );
  }
}
