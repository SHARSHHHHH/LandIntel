import { NextResponse } from 'next/server';
import { getDatabase, mapOpportunity } from '@/lib/research/db';
import { getCurrentUser } from '@/lib/research/project-auth';

// GET /api/innovation/[id] - get single opportunity
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM innovation_opportunities WHERE id = ?').get(params.id) as any;

    if (!row) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const submissionRows = db
      .prepare('SELECT * FROM innovation_submissions WHERE opportunity_id = ?')
      .all(params.id) as any[];

    const submissions = submissionRows.map((s) => {
      const userRow = db.prepare('SELECT id, name FROM users WHERE id = ?').get(s.user_id) as any;
      const projectRow = s.project_id
        ? (db.prepare('SELECT id, title FROM research_projects WHERE id = ?').get(s.project_id) as any)
        : null;
      return {
        id: s.id,
        opportunityId: s.opportunity_id,
        userId: s.user_id,
        projectId: s.project_id,
        title: s.title,
        abstract: s.abstract,
        status: s.status,
        createdAt: s.created_at,
        user: userRow ? { id: userRow.id, name: userRow.name } : null,
        project: projectRow ? { id: projectRow.id, title: projectRow.title } : null,
      };
    });

    const opportunity = { ...mapOpportunity(row), submissions };

    return NextResponse.json({ success: true, data: opportunity }, { status: 200 });
  } catch (error) {
    console.error('Error fetching innovation opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunity' },
      { status: 500 }
    );
  }
}

// PUT /api/innovation/[id] - update opportunity
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { title, type, organizer, description, deadline, eligibility, status } = body;

    const db = getDatabase();
    const existing = db.prepare('SELECT * FROM innovation_opportunities WHERE id = ?').get(params.id) as any;

    if (!existing) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const updated = {
      title: title !== undefined ? title : existing.title,
      type: type !== undefined ? type : existing.type,
      organizer: organizer !== undefined ? organizer : existing.organizer,
      description: description !== undefined ? description : existing.description,
      deadline: deadline !== undefined ? new Date(deadline).toISOString() : existing.deadline,
      eligibility: eligibility !== undefined ? eligibility : existing.eligibility,
      status: status !== undefined ? status : existing.status,
    };

    db.prepare(
      `UPDATE innovation_opportunities SET title = ?, type = ?, organizer = ?, description = ?, deadline = ?, eligibility = ?, status = ? WHERE id = ?`
    ).run(
      updated.title,
      updated.type,
      updated.organizer,
      updated.description,
      updated.deadline,
      updated.eligibility,
      updated.status,
      params.id
    );

    const row = db.prepare('SELECT * FROM innovation_opportunities WHERE id = ?').get(params.id) as any;

    return NextResponse.json({ success: true, data: mapOpportunity(row) }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update opportunity' },
      { status: 500 }
    );
  }
}
