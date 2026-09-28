import { AppShell } from '@/components/research/layout/AppShell';
import { ProjectCard } from '@/components/research/projects/ProjectCard';
import { ProjectFilters } from '@/components/research/projects/ProjectFilters';
import { Button } from '@/components/research/ui/button';
import { cn } from '@/components/research/ui/button';
import { FolderKanban, PlusCircle } from 'lucide-react';
import { absoluteUrl } from '@/lib/research/server-fetch';

interface Project {
  id: string;
  title: string;
  researchProblem: string;
  geographicScope: string;
  institution: string;
  status: string;
  visibility: string;
  createdAt: Date;
  myRole: string | null;
  owner: { id: string; name: string; email: string } | null;
  _count: {
    questions: number;
    resources: number;
    datasets: number;
    gisLayers: number;
    analyses: number;
    findings: number;
  };
}

interface ProjectsPageProps {
  searchParams?: Record<string, string | undefined>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const search = searchParams?.search || '';
  const status = searchParams?.status || '';
  const visibility = searchParams?.visibility || '';
  const sort = searchParams?.sort || 'createdAt:desc';

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  if (visibility) params.set('visibility', visibility);
  params.set('sort', sort);

  let projects: Project[] = [];
  let error = false;

  try {
    const res = await fetch(absoluteUrl(`/api/research/projects?${params.toString()}`), {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      projects = data.data || [];
    } else {
      error = true;
    }
  } catch {
    error = true;
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-blue-600" /> Research Projects & Workspace
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Manage research questions, resources, datasets, analysis, findings, and collaboration team roles.
            </p>
          </div>
            <a
              href="/research/projects/new"
              className="inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-xs px-4 py-2 text-sm"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" /> New Project
            </a>
        </div>

        <ProjectFilters />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-sm text-red-700 font-medium">Failed to load projects. Please try again.</p>
          </div>
        )}

        {!error && projects.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
            <FolderKanban className="w-12 h-12 text-blue-600 mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-bold text-slate-800">No Projects Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {search || status || visibility
                ? 'No projects match your current filters. Try adjusting your search.'
                : 'Get started by creating your first research project.'}
            </p>
          </div>
        )}

        {!error && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
