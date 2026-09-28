import { NextResponse } from 'next/server';
import {
  getDatabase,
  mapProject,
  mapMember,
  mapQuestion,
  mapResource,
  mapDataset,
  mapGisLayer,
  mapAnalysis,
  mapFinding,
  mapProfile,
} from '@/lib/research/db';
import { authorizeProjectRead, authorizeProjectWrite, MANAGE_ROLES } from '@/lib/research/project-auth';

function getFullProject(db: ReturnType<typeof getDatabase>, id: string) {
  const row = db.prepare('SELECT * FROM research_projects WHERE id = ?').get(id) as any;
  if (!row) return null;

  const ownerRow = db.prepare('SELECT id, name, email, platform_role FROM users WHERE id = ?').get(row.owner_id) as any;
  const ownerProfileRow = db.prepare('SELECT * FROM research_profiles WHERE user_id = ?').get(row.owner_id) as any;

  const memberRows = db.prepare('SELECT * FROM project_members WHERE project_id = ?').all(id) as any[];
  const members = memberRows.map((m) => {
    const userRow = db
      .prepare('SELECT id, name, email, platform_role FROM users WHERE id = ?')
      .get(m.user_id) as any;
    return {
      ...mapMember(m),
      user: userRow
        ? { id: userRow.id, name: userRow.name, email: userRow.email, platformRole: userRow.platform_role }
        : null,
    };
  });

  const questions = (db.prepare('SELECT * FROM research_questions WHERE project_id = ?').all(id) as any[]).map(
    mapQuestion
  );

  const resourceLinks = db.prepare('SELECT * FROM project_resources WHERE project_id = ?').all(id) as any[];
  const resources = resourceLinks.map((pr) => {
    const resourceRow = db.prepare('SELECT * FROM research_resources WHERE id = ?').get(pr.resource_id) as any;
    return { id: pr.id, projectId: pr.project_id, resourceId: pr.resource_id, createdAt: pr.created_at, resource: mapResource(resourceRow) };
  });

  const datasetLinks = db.prepare('SELECT * FROM project_datasets WHERE project_id = ?').all(id) as any[];
  const datasets = datasetLinks.map((pd) => {
    const datasetRow = db.prepare('SELECT * FROM datasets WHERE id = ?').get(pd.dataset_id) as any;
    return { id: pd.id, projectId: pd.project_id, datasetId: pd.dataset_id, createdAt: pd.created_at, dataset: mapDataset(datasetRow) };
  });

  const gisLinks = db.prepare('SELECT * FROM project_gis_layers WHERE project_id = ?').all(id) as any[];
  const gisLayers = gisLinks.map((pl) => {
    const layerRow = db.prepare('SELECT * FROM gis_layers WHERE id = ?').get(pl.layer_id) as any;
    return { id: pl.id, projectId: pl.project_id, layerId: pl.layer_id, createdAt: pl.created_at, layer: mapGisLayer(layerRow) };
  });

  const analyses = (db.prepare('SELECT * FROM analyses WHERE project_id = ?').all(id) as any[]).map(mapAnalysis);
  const findings = (db.prepare('SELECT * FROM findings WHERE project_id = ?').all(id) as any[]).map(mapFinding);

  const counts = {
    questions: questions.length,
    resources: resources.length,
    datasets: datasets.length,
    gisLayers: gisLayers.length,
    analyses: analyses.length,
    findings: findings.length,
  };

  return {
    ...mapProject(row),
    owner: ownerRow
      ? {
          id: ownerRow.id,
          name: ownerRow.name,
          email: ownerRow.email,
          profile: ownerProfileRow ? mapProfile(ownerProfileRow) : null,
        }
      : null,
    members,
    questions,
    resources,
    datasets,
    gisLayers,
    analyses,
    findings,
    _count: counts,
  };
}

// GET /api/projects/[id] - single project detail (member or public)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const access = await authorizeProjectRead(id);
    if (access.response) return access.response;

    const db = getDatabase();
    const project = getFullProject(db, id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const data = {
      ...project,
      myRole: access.role,
    };

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - update a project (OWNER / EDITOR only)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      title,
      researchProblem,
      objectives,
      geographicScope,
      startDate,
      endDate,
      institution,
      status,
      visibility,
    } = body;

    const access = await authorizeProjectWrite(id, MANAGE_ROLES);
    if (access.response) return access.response;

    // Validate required fields (must be supplied in full on update)
    if (!title || !researchProblem || !geographicScope || !institution) {
      return NextResponse.json(
        { error: 'Missing required fields: title, researchProblem, geographicScope, institution' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Check if project exists
    const existingProject = db.prepare('SELECT * FROM research_projects WHERE id = ?').get(id) as any;

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    db.prepare(
      `UPDATE research_projects SET
        title = ?, research_problem = ?, objectives = ?, geographic_scope = ?, start_date = ?, end_date = ?,
        institution = ?, status = ?, visibility = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      title,
      researchProblem,
      JSON.stringify(Array.isArray(objectives) ? objectives : []),
      geographicScope,
      startDate ? new Date(startDate).toISOString() : null,
      endDate ? new Date(endDate).toISOString() : null,
      institution,
      status || existingProject.status,
      visibility || existingProject.visibility,
      new Date().toISOString(),
      id
    );

    const row = db.prepare('SELECT * FROM research_projects WHERE id = ?').get(id) as any;
    const ownerRow = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(row.owner_id) as any;
    const memberRows = db.prepare('SELECT * FROM project_members WHERE project_id = ?').all(id) as any[];
    const members = memberRows.map((m) => {
      const userRow = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(m.user_id) as any;
      return { ...mapMember(m), user: userRow ? { id: userRow.id, name: userRow.name, email: userRow.email } : null };
    });

    const project = {
      ...mapProject(row),
      owner: ownerRow ? { id: ownerRow.id, name: ownerRow.name, email: ownerRow.email } : null,
      members,
    };

    return NextResponse.json({ success: true, data: project }, { status: 200 });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}
