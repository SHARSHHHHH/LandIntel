import { AppShell } from '@/components/research/layout/AppShell';
import { WorkspaceNav } from '@/components/research/projects/WorkspaceNav';
import { NewAnalysisForm } from '@/components/research/projects/NewAnalysisForm';
import { ProjectStatusBadge } from '@/components/research/projects/ProjectStatusBadge';
import { RoleBadge } from '@/components/research/projects/RoleBadge';
import { PieChart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { absoluteUrl } from '@/lib/research/server-fetch';

interface Question {
  id: string;
  question: string;
  description: string | null;
}

interface Analysis {
  id: string;
  title: string;
  methodology: string;
  resultsSummary: string;
  dataStatus: string;
  question: Question | null;
  createdAt: Date;
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
  analyses: Analysis[];
  questions: Question[];
  _count: {
    analyses: number;
    questions: number;
  };
}

interface AnalysisPageProps {
  params: { id: string };
}

export default async function ProjectAnalysisPage({ params }: AnalysisPageProps) {
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
            <PieChart className="w-12 h-12 text-blue-600 mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-bold text-slate-800">Project Not Found</h3>
            <p className="text-xs text-slate-500 mt-1">The project you are looking for does not exist or you do not have access.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const questionsForForm = project.questions.map((q) => ({ id: q.id, question: q.question }));

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/research/projects/${id}`} className="text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" /> Analysis
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
            {project._count.analyses} analysis{project._count.analyses !== 1 ? 'es' : ''} for{' '}
            <strong>{project.title}</strong>.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
          <WorkspaceNav projectId={id} />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
          {/* Create Analysis Form */}
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" /> New Analysis
            </h2>
            <NewAnalysisForm projectId={id} questions={questionsForForm} />
          </div>

          {/* Existing Analyses List */}
          <div className="p-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Existing Analyses ({project.analyses.length})
            </h3>

            {project.analyses.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
                <PieChart className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600 font-medium">No analyses yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Create your first analysis to investigate this project&rsquo;s research questions.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {project.analyses.map((a) => (
                  <div key={a.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900">{a.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{a.resultsSummary}</p>
                        {a.question && (
                          <p className="text-xs text-blue-600 mt-1">
                            Related question: {a.question.question}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                            {a.dataStatus}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Methodology: {a.methodology.slice(0, 80)}
                            {a.methodology.length > 80 ? '...' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                      Created {new Date(a.createdAt).toLocaleDateString()}
                    </p>
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
