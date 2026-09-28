import Link from 'next/link';
import { Calendar, FileText, File, Database, Layers, PieChart, Lightbulb, Users, ArrowRight } from 'lucide-react';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { RoleBadge } from './RoleBadge';

interface ProjectCardProps {
  project: {
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
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <ProjectStatusBadge status={project.status} />
        {project.myRole && <RoleBadge role={project.myRole} />}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 leading-snug">{project.title}</h3>
        <p className="text-xs text-slate-500 mt-1">{project.geographicScope}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{project.institution}</p>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{project.researchProblem}</p>

      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1">
          <FileText className="w-3 h-3 text-slate-400" /> {project._count.questions}
        </span>
        <span className="flex items-center gap-1">
          <File className="w-3 h-3 text-slate-400" /> {project._count.resources}
        </span>
        <span className="flex items-center gap-1">
          <Database className="w-3 h-3 text-slate-400" /> {project._count.datasets}
        </span>
        <span className="flex items-center gap-1">
          <Layers className="w-3 h-3 text-slate-400" /> {project._count.gisLayers}
        </span>
        <span className="flex items-center gap-1">
          <PieChart className="w-3 h-3 text-slate-400" /> {project._count.analyses}
        </span>
        <span className="flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-slate-400" /> {project._count.findings}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          {new Date(project.createdAt).toLocaleDateString()}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3 text-slate-400" />
          {project.owner?.name || 'Unknown'}
        </span>
        <Link href={`/research/projects/${project.id}`} className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
          Open Workspace <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}