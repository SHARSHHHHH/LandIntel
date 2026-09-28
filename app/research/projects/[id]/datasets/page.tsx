import { AppShell } from '@/components/research/layout/AppShell';
import { WorkspaceNav } from '@/components/research/projects/WorkspaceNav';
import { LinkDatasetForm } from '@/components/research/projects/LinkDatasetForm';
import { DatasetCard } from '@/components/research/datasets/DatasetCard';
import { ProjectStatusBadge } from '@/components/research/projects/ProjectStatusBadge';
import { RoleBadge } from '@/components/research/projects/RoleBadge';
import { Database, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { absoluteUrl } from '@/lib/research/server-fetch';

interface LinkedDataset {
  datasetId: string;
  dataset: {
    id: string;
    name: string;
    provider: string;
    type: string;
    geographicScope: string;
    temporalScope: string | null;
    variables: string[];
    format: string;
    spatialResolution: string | null;
    crs: string | null;
    licenseAccess: string;
    sourceUrl: string | null;
    updateFrequency: string | null;
    version: string;
    qualityStatus: string;
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
  datasets: LinkedDataset[];
  _count: {
    datasets: number;
    questions: number;
    resources: number;
    gisLayers: number;
    analyses: number;
    findings: number;
  };
}

interface DatasetsPageProps {
  params: { id: string };
}

export default async function ProjectDatasetsPage({ params }: DatasetsPageProps) {
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
            <Database className="w-12 h-12 text-blue-600 mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-bold text-slate-800">Project Not Found</h3>
            <p className="text-xs text-slate-500 mt-1">The project you are looking for does not exist or you do not have access.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const linkedDatasets = project.datasets.map((pd) => pd.dataset);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/research/projects/${id}`} className="text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" /> Datasets
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
            {project._count.datasets} dataset{project._count.datasets !== 1 ? 's' : ''} linked to{' '}
            <strong>{project.title}</strong>.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
          <WorkspaceNav projectId={id} />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
          {/* Link Dataset Section */}
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" /> Link Existing Dataset
            </h2>
            <LinkDatasetForm projectId={id} linkedDatasets={project.datasets} />
          </div>

          {/* Associated Datasets List */}
          <div className="p-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Associated Datasets ({linkedDatasets.length})
            </h3>

            {linkedDatasets.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
                <Database className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600 font-medium">No datasets linked yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Select a dataset from the dropdown above to associate it with this project.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {linkedDatasets.map((dataset) => (
                  <div key={dataset.id} className="relative">
                    <DatasetCard dataset={dataset} />
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
