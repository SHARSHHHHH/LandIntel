import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDatabase, mapDataset, nowIso } from '@/lib/research/db';
import { authorizeProjectWrite } from '@/lib/research/project-auth';

// POST /api/projects/[id]/datasets - add a dataset to a project
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { datasetId } = body;

    if (!datasetId) {
      return NextResponse.json(
        { error: 'datasetId is required' },
        { status: 400 }
      );
    }

    const access = await authorizeProjectWrite(id);
    if (access.response) return access.response;

    const db = getDatabase();

    // Check if dataset exists
    const dataset = db.prepare('SELECT * FROM datasets WHERE id = ?').get(datasetId) as any;

    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    // Check if the relationship already exists
    const existingLink = db
      .prepare('SELECT * FROM project_datasets WHERE project_id = ? AND dataset_id = ?')
      .get(id, datasetId);

    if (existingLink) {
      return NextResponse.json(
        { error: 'Dataset already linked to project' },
        { status: 409 }
      );
    }

    // Create the project-dataset link
    const linkId = randomUUID();
    const createdAt = nowIso();
    db.prepare(
      'INSERT INTO project_datasets (id, project_id, dataset_id, created_at) VALUES (?, ?, ?, ?)'
    ).run(linkId, id, datasetId, createdAt);

    const projectDataset = {
      id: linkId,
      projectId: id,
      datasetId,
      createdAt,
      dataset: mapDataset(dataset),
    };

    return NextResponse.json({ success: true, data: projectDataset }, { status: 201 });
  } catch (error) {
    console.error('Error adding dataset to project:', error);
    return NextResponse.json(
      { error: 'Failed to add dataset to project' },
      { status: 500 }
    );
  }
}
