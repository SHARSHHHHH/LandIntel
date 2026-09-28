import { AppShell } from '@/components/research/layout/AppShell';
import { WorkspaceNav } from '@/components/research/projects/WorkspaceNav';
import { LinkGISLayerForm } from '@/components/research/projects/LinkGISLayerForm';
import { ProjectStatusBadge } from '@/components/research/projects/ProjectStatusBadge';
import { RoleBadge } from '@/components/research/projects/RoleBadge';
import { Layers, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { absoluteUrl } from '@/lib/research/server-fetch';

interface LinkedGISLayer {
  layerId: string;
  layer: {
    id: string;
    name: string;
    category: string;
    description: string | null;
    provider: string | null;
    sourceUrl: string | null;
    geoserverUrl: string | null;
    geometryType: string;
    state: string | null;
    district: string | null;
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
  gisLayers: LinkedGISLayer[];
  _count: {
    gisLayers: number;
    questions: number;
    resources: number;
    datasets: number;
    analyses: number;
    findings: number;
  };
}

interface GISLayersPageProps {
  params: { id: string };
}

export default async function ProjectGISLayersPage({ params }: GISLayersPageProps) {
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
            <Layers className="w-12 h-12 text-blue-600 mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-bold text-slate-800">Project Not Found</h3>
            <p className="text-xs text-slate-500 mt-1">The project you are looking for does not exist or you do not have access.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const linkedLayers = project.gisLayers.map((gl) => gl.layer);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/research/projects/${id}`} className="text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" /> GIS Layers
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
            {project._count.gisLayers} GIS layer{project._count.gisLayers !== 1 ? 's' : ''} linked to{' '}
            <strong>{project.title}</strong>.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
          <WorkspaceNav projectId={id} />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
          {/* Link GIS Layer Section */}
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" /> Link Existing GIS Layer
            </h2>
            <LinkGISLayerForm projectId={id} linkedLayers={project.gisLayers} />
          </div>

          {/* Associated Layers List */}
          <div className="p-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Associated GIS Layers ({linkedLayers.length})
            </h3>

            {linkedLayers.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
                <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600 font-medium">No GIS layers linked yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Select a layer from the dropdown above to associate it with this project.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {linkedLayers.map((layer) => (
                  <div key={layer.id} className="border border-slate-200 rounded-lg p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">
                        {layer.category}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        layer.dataStatus === 'REAL'
                          ? 'bg-emerald-100 text-emerald-800'
                          : layer.dataStatus === 'DERIVED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        {layer.dataStatus}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{layer.name}</h3>
                    {layer.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{layer.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {layer.geometryType}
                        {layer.state && ` · ${layer.state}`}
                        {layer.district && ` · ${layer.district}`}
                      </span>
                    </div>
                    {layer.provider && (
                      <p className="text-[10px] text-slate-400">Provider: {layer.provider}</p>
                    )}
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
