import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDatabase, mapResource, nowIso } from '@/lib/research/db';
import { authorizeProjectWrite } from '@/lib/research/project-auth';

// POST /api/projects/[id]/resources - add a resource to a project
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { resourceId } = body;

    if (!resourceId) {
      return NextResponse.json(
        { error: 'resourceId is required' },
        { status: 400 }
      );
    }

    const access = await authorizeProjectWrite(id);
    if (access.response) return access.response;

    const db = getDatabase();

    // Check if resource exists
    const resource = db.prepare('SELECT * FROM research_resources WHERE id = ?').get(resourceId) as any;

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Check if the relationship already exists
    const existingLink = db
      .prepare('SELECT * FROM project_resources WHERE project_id = ? AND resource_id = ?')
      .get(id, resourceId);

    if (existingLink) {
      return NextResponse.json(
        { error: 'Resource already linked to project' },
        { status: 409 }
      );
    }

    // Create the project-resource link
    const linkId = randomUUID();
    const createdAt = nowIso();
    db.prepare(
      'INSERT INTO project_resources (id, project_id, resource_id, created_at) VALUES (?, ?, ?, ?)'
    ).run(linkId, id, resourceId, createdAt);

    const projectResource = {
      id: linkId,
      projectId: id,
      resourceId,
      createdAt,
      resource: mapResource(resource),
    };

    return NextResponse.json({ success: true, data: projectResource }, { status: 201 });
  } catch (error) {
    console.error('Error adding resource to project:', error);
    return NextResponse.json(
      { error: 'Failed to add resource to project' },
      { status: 500 }
    );
  }
}
