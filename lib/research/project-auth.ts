import { NextResponse } from 'next/server';
import { getDatabase, mapProject, mapMember } from '@/lib/research/db';
import { getSession } from '@/lib/auth/central';

export const DEMO_USER_EMAIL = 'dr.sharma@academic.edu';

export type ProjectRole = 'OWNER' | 'EDITOR' | 'CONTRIBUTOR' | 'VIEWER';

export const CONTRIBUTOR_ROLES: ProjectRole[] = ['OWNER', 'EDITOR', 'CONTRIBUTOR'];
export const MANAGE_ROLES: ProjectRole[] = ['OWNER', 'EDITOR'];

export interface ProjectAccess {
  userId: string | null;
  role: ProjectRole | null;
}

export async function getCurrentUser() {
  const db = getDatabase();

  // Check the central login session first (set by /login - either a real
  // signed-up researcher account or the "Continue as Researcher demo user"
  // button). Fall back to the portal's own pre-existing demo user only when
  // there is no matching row here, so the app still works exactly as before
  // if the central session is absent (e.g. hitting this API directly).
  const session = getSession();
  if (session) {
    const row = db
      .prepare('SELECT id, name, email FROM users WHERE email = ?')
      .get(session.email) as any;
    if (row) return { id: row.id, name: row.name, email: row.email };
  }

  const row = db
    .prepare('SELECT id, name, email FROM users WHERE email = ?')
    .get(DEMO_USER_EMAIL) as any;
  if (!row) return null;
  return { id: row.id, name: row.name, email: row.email };
}

export async function getProjectRole(projectId: string, userId: string): Promise<ProjectRole | null> {
  const db = getDatabase();
  const row = db
    .prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?')
    .get(projectId, userId) as any;
  return row ? (row.role as ProjectRole) : null;
}

function unauthorized() {
  return NextResponse.json(
    { error: 'Not authenticated' },
    { status: 401 }
  );
}

function forbidden(message: string) {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}

/**
 * Authorizes a write operation on a project.
 * OWNER / EDITOR / CONTRIBUTOR roles may mutate project content; VIEWER and
 * non-members are rejected. Returns { response } on failure (an error
 * NextResponse), or { response: null, userId, role } on success.
 */
export async function authorizeProjectWrite(projectId: string, allowedRoles: ProjectRole[] = CONTRIBUTOR_ROLES) {
  const user = await getCurrentUser();
  if (!user) {
    return { response: unauthorized(), userId: null as string | null, role: null as ProjectRole | null };
  }

  const role = await getProjectRole(projectId, user.id);
  if (!role) {
    return { response: forbidden('You are not a member of this project.'), userId: user.id, role: null };
  }
  if (!allowedRoles.includes(role)) {
    return { response: forbidden(`Your project role (${role}) does not permit this action.`), userId: user.id, role };
  }

  return { response: null, userId: user.id, role };
}

/**
 * Authorizes reading a project. A user may read the project when they are the
 * owner / a member (any role), or when the project visibility is Public.
 * Returns { response } on failure or { response: null, ... access } on success.
 */
export async function authorizeProjectRead(projectId: string) {
  const db = getDatabase();
  const user = await getCurrentUser();
  const projectRow = db
    .prepare('SELECT id, owner_id, visibility FROM research_projects WHERE id = ?')
    .get(projectId) as any;

  if (!projectRow) {
    return {
      response: NextResponse.json({ error: 'Project not found' }, { status: 404 }),
      user,
      role: null as ProjectRole | null,
      project: null,
    };
  }

  const project = { id: projectRow.id, ownerId: projectRow.owner_id, visibility: projectRow.visibility };

  if (user) {
    const role = await getProjectRole(projectId, user.id);
    if (role) {
      return { response: null, user, role, project };
    }
  }

  if (project.visibility === 'Public') {
    return { response: null, user, role: null, project };
  }

  return { response: forbidden('You do not have access to this project.'), user, role: null, project };
}

/** Resolves read access for server-rendered pages. */
export async function resolveProjectRead(projectId: string) {
  const db = getDatabase();
  const user = await getCurrentUser();
  const projectRow = db.prepare('SELECT * FROM research_projects WHERE id = ?').get(projectId) as any;

  if (!projectRow) {
    return { project: null as any, role: null as ProjectRole | null, user };
  }

  const memberRows = db
    .prepare('SELECT * FROM project_members WHERE project_id = ?')
    .all(projectId) as any[];

  const project = {
    ...mapProject(projectRow),
    members: memberRows.map(mapMember),
  };

  let role: ProjectRole | null = null;
  if (user) {
    const member = memberRows.find((m) => m.user_id === user.id);
    if (member) role = member.role as ProjectRole;
  }

  if (role || project.visibility === 'Public') {
    return { project, role, user };
  }

  return { project: null as any, role, user };
}
