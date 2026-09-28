import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDatabase, mapGisLayer, nowIso } from '@/lib/research/db';
import { authorizeProjectWrite } from '@/lib/research/project-auth';

// POST /api/projects/[id]/gis-layers - add a GIS layer to a project
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { layerId } = body;

    if (!layerId) {
      return NextResponse.json(
        { error: 'layerId is required' },
        { status: 400 }
      );
    }

    const access = await authorizeProjectWrite(id);
    if (access.response) return access.response;

    const db = getDatabase();

    // Check if GIS layer exists
    const layer = db.prepare('SELECT * FROM gis_layers WHERE id = ?').get(layerId) as any;

    if (!layer) {
      return NextResponse.json(
        { error: 'GIS layer not found' },
        { status: 404 }
      );
    }

    // Check if the relationship already exists
    const existingLink = db
      .prepare('SELECT * FROM project_gis_layers WHERE project_id = ? AND layer_id = ?')
      .get(id, layerId);

    if (existingLink) {
      return NextResponse.json(
        { error: 'GIS layer already linked to project' },
        { status: 409 }
      );
    }

    // Create the project-GIS layer link
    const linkId = randomUUID();
    const createdAt = nowIso();
    db.prepare(
      'INSERT INTO project_gis_layers (id, project_id, layer_id, created_at) VALUES (?, ?, ?, ?)'
    ).run(linkId, id, layerId, createdAt);

    const projectGISLayer = {
      id: linkId,
      projectId: id,
      layerId,
      createdAt,
      layer: mapGisLayer(layer),
    };

    return NextResponse.json({ success: true, data: projectGISLayer }, { status: 201 });
  } catch (error) {
    console.error('Error adding GIS layer to project:', error);
    return NextResponse.json(
      { error: 'Failed to add GIS layer to project' },
      { status: 500 }
    );
  }
}
