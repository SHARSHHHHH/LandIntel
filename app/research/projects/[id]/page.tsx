import { AppShell } from '@/components/research/layout/AppShell';
import { WorkspaceNav } from '@/components/research/projects/WorkspaceNav';
import { ProjectStatusBadge } from '@/components/research/projects/ProjectStatusBadge';
import { RoleBadge } from '@/components/research/projects/RoleBadge';
import { Button } from '@/components/research/ui/button';
import { cn } from '@/components/research/ui/button';
import {
  FolderKanban,
  BarChart3,
  Map,
  FileText,
  Users,
  Lightbulb,
  File,
  Database,
  Layers,
  PieChart,
  ArrowLeft,
  Calendar,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { absoluteUrl } from '@/lib/research/server-fetch';

interface Project {
  id: string;
  title: string;
  researchProblem: string;
  objectives: string[];
  geographicScope: string;
  startDate: Date | null;
  endDate: Date | null;
  institution: string;
  status: string;
  visibility: string;
  ownerId: string;
  owner: { id: string; name: string; email: string } | null;
  members: { userId: string; user: { id: string; name: string; email: string }; role: string }[];
  questions: unknown[];
  resources: { resourceId: string; resource: { id: string; title: string; authors: string[]; organization: string | null; resourceType: string; publicationYear: number | null; topic: string; state: string | null; district: string | null; keywords: string[]; abstract: string; source: string; sourceUrl: string | null; accessLevel: string; verificationStatus: boolean; dataStatus: string; createdAt: Date } }[];
  datasets: { datasetId: string; dataset: { id: string; name: string; provider: string; type: string; geographicScope: string; temporalScope: string | null; variables: string[]; format: string; spatialResolution: string | null; crs: string | null; licenseAccess: string; sourceUrl: string | null; updateFrequency: string | null; version: string; qualityStatus: string; dataStatus: string; createdAt: Date } }[];
  gisLayers: { layerId: string; layer: { id: string; name: string; category: string; description: string | null; provider: string | null; sourceUrl: string | null; geoserverUrl: string | null; geometryType: string; state: string | null; district: string | null; dataStatus: string; createdAt: Date } }[];
  analyses: { id: string; title: string; methodology: string; resultsSummary: string; dataStatus: string; question: { id: string; question: string; description: string | null } | null; createdAt: Date }[];
  findings: { id: string; statement: string; confidence: string; dataStatus: string; analysisId: string | null; analysis: { id: string; title: string } | null; createdAt: Date }[];
  _count: {
    questions: number;
    resources: number;
    datasets: number;
    gisLayers: number;
    analyses: number;
    findings: number;
  };
}

interface WorkspacePageProps {
  params: { id: string };
}

export default async function ProjectWorkspacePage({ params }: WorkspacePageProps) {
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

  const navItems = [
    { href: `/projects/${id}`, label: 'Overview', icon: BarChart3, section: 'overview' },
    { href: `/projects/${id}/questions`, label: 'Questions', icon: FileText, section: 'questions' },
    { href: `/projects/${id}/team`, label: 'Team', icon: Users, section: 'team' },
    { href: `/projects/${id}/resources`, label: 'Resources', icon: File, section: 'resources' },
    { href: `/projects/${id}/datasets`, label: 'Datasets', icon: Database, section: 'datasets' },
    { href: `/projects/${id}/gis-layers`, label: 'GIS Layers', icon: Layers, section: 'gis-layers' },
    { href: `/projects/${id}/analysis`, label: 'Analysis', icon: PieChart, section: 'analysis' },
    { href: `/projects/${id}/findings`, label: 'Findings', icon: Lightbulb, section: 'findings' },
  ];

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
            <FolderKanban className="w-12 h-12 text-blue-600 mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-bold text-slate-800">Project Not Found</h3>
            <p className="text-xs text-slate-500 mt-1">The project you are looking for does not exist or you do not have access.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const memberCount = project.members.length;
  const hasAccess = project.owner?.id !== undefined;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Link href="/research/projects" className="text-slate-500 hover:text-slate-700 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-blue-600" /> {project.title}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <ProjectStatusBadge status={project.status} />
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wide">
                  {project.visibility}
                </span>
                {project.owner && <RoleBadge role={project.owner ? 'OWNER' : 'VIEWER'} />}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Research Problem</p>
                <p className="text-sm text-slate-800 leading-relaxed">{project.researchProblem}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Geographic Scope</p>
                <p className="text-sm text-slate-800">{project.geographicScope}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Institution</p>
                <p className="text-sm text-slate-800">{project.institution}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Objectives</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {project.objectives.map((obj, i) => (
                    <li key={i} className="text-sm text-slate-700">{obj}</li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                {project.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {new Date(project.startDate).toLocaleDateString()}
                  </span>
                )}
                {project.endDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> → {new Date(project.endDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Owner</p>
                {project.owner && (
                  <div className="flex items-center gap-2 text-sm text-slate-800">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {project.owner.name.charAt(0)}
                    </div>
                    <span>{project.owner.name}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Team</p>
                <p className="text-sm text-slate-800">{memberCount} member{memberCount !== 1 ? 's' : ''}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {project.members.map((m, i) => (
                    <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                      {m.user.name} ({m.role})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
          <WorkspaceNav projectId={id} />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Project Summary</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {project._count.questions} questions · {project._count.resources} resources · {project._count.datasets} datasets · {project._count.analyses} analyses · {project._count.findings} findings
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a
              href={`/research/projects/${id}/questions`}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <p className="text-2xl font-bold text-blue-700">{project._count.questions}</p>
              <p className="text-xs text-blue-600 font-medium">Questions</p>
            </a>
            <a
              href={`/research/projects/${id}/resources`}
              className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <p className="text-2xl font-bold text-emerald-700">{project._count.resources}</p>
              <p className="text-xs text-emerald-600 font-medium">Resources</p>
            </a>
            <a
              href={`/research/projects/${id}/datasets`}
              className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:bg-purple-100 transition-colors cursor-pointer"
            >
              <p className="text-2xl font-bold text-purple-700">{project._count.datasets}</p>
              <p className="text-xs text-purple-600 font-medium">Datasets</p>
            </a>
            <a
              href={`/research/projects/${id}/analysis`}
              className="bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <p className="text-2xl font-bold text-red-700">{project._count.analyses}</p>
              <p className="text-xs text-red-600 font-medium">Analyses</p>
            </a>
            <a
              href={`/research/projects/${id}/gis-layers`}
              className="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:bg-orange-100 transition-colors cursor-pointer"
            >
              <p className="text-2xl font-bold text-orange-700">{project._count.gisLayers}</p>
              <p className="text-xs text-orange-600 font-medium">GIS Layers</p>
            </a>
            <a
              href={`/research/projects/${id}/findings`}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:bg-yellow-100 transition-colors cursor-pointer"
            >
              <p className="text-2xl font-bold text-yellow-700">{project._count.findings}</p>
              <p className="text-xs text-yellow-700 font-medium">Findings</p>
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
