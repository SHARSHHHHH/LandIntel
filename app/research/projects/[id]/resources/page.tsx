import { AppShell } from '@/components/research/layout/AppShell';
import { WorkspaceNav } from '@/components/research/projects/WorkspaceNav';
import { LinkResourceForm } from '@/components/research/projects/LinkResourceForm';
import { ResourceCard } from '@/components/research/repository/ResourceCard';
import { DataStatusBadge } from '@/components/research/projects/DataStatusBadge';
import { ProjectStatusBadge } from '@/components/research/projects/ProjectStatusBadge';
import { RoleBadge } from '@/components/research/projects/RoleBadge';
import { File, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { absoluteUrl } from '@/lib/research/server-fetch';

interface LinkedResource {
  resourceId: string;
  resource: {
    id: string;
    title: string;
    authors: string[];
    organization: string | null;
    resourceType: string;
    publicationYear: number | null;
    topic: string;
    state: string | null;
    district: string | null;
    keywords: string[];
    abstract: string;
    source: string;
    sourceUrl: string | null;
    accessLevel: string;
    verificationStatus: boolean;
    dataStatus: string;
    createdAt: Date;
  };
}

interface Project {
  id: string;
  title: string;
  researchProblem: string;
  objectives: string[];
  geographicScope: string;
  institution: string;
  status: string;
  visibility: string;
  owner: { id: string; name: string; email: string } | null;
  members: { userId: string; user: { id: string; name: string }; role: string }[];
  resources: LinkedResource[];
  _count: {
    resources: number;
    questions: number;
    datasets: number;
    gisLayers: number;
    analyses: number;
    findings: number;
  };
}

interface ResourcesPageProps {
  params: { id: string };
}

export default async function ProjectResourcesPage({ params }: ResourcesPageProps) {
  const { id } = params;
  let project: Project | null = null;
  let error = false;

  try {
    const res = await fetch(absoluteUrl(`/api/research/projects/${id}`), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      project = data.data;
    } else {
      error = true;
    }
  } catch {
    error = true;
  }

  if (error) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-sm text-red-700 font-medium">Failed to load project. Please try again.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
            <File className="w-12 h-12 text-blue-600 mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-bold text-slate-800">Project Not Found</h3>
            <p className="text-xs text-slate-500 mt-1">The project you are looking for does not exist or you do not have access.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const linkedResources = project.resources.map((pr) => pr.resource);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/research/projects/${id}`} className="text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <File className="w-5 h-5 text-blue-600" /> Research Resources
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <ProjectStatusBadge status={project.status} />
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wide">
              {project.visibility}
            </span>
            {project.owner && <RoleBadge role="OWNER" />}
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {project._count.resources} resource{project._count.resources !== 1 ? 's' : ''} linked to{' '}
            <strong>{project.title}</strong>.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
          <WorkspaceNav projectId={id} />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
          {/* Link Resource Section */}
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <File className="w-4 h-4 text-blue-600" /> Link Existing Resource
            </h2>
            <LinkResourceForm projectId={id} linkedResources={project.resources} />
          </div>

          {/* Associated Resources List */}
          <div className="p-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Associated Resources ({linkedResources.length})
            </h3>

            {linkedResources.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
                <File className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600 font-medium">No resources linked yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Select a resource from the dropdown above to associate it with this project.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {linkedResources.map((resource) => (
                  <div key={resource.id} className="relative">
                    <ResourceCard resource={resource} />
                    <div className="mt-2 flex items-center gap-2">
                      <DataStatusBadge dataStatus={resource.dataStatus} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
