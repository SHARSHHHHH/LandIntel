import Link from 'next/link';
import { FolderKanban, Users, Calendar } from 'lucide-react';

interface ProjectItem {
  id: string;
  title: string;
  geographicScope: string;
  status: string;
  institution: string;
  createdAt: Date;
}

export function ActiveProjects({ projects }: { projects: ProjectItem[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-blue-600" />
          My Research Projects
        </h2>
        <Link href="/research/projects" className="text-xs font-medium text-blue-600 hover:underline">
          View All Projects →
        </Link>
      </div>

      <div className="space-y-3">
        {projects.map((proj) => (
          <div key={proj.id} className="p-4 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase">
                {proj.status}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">{proj.geographicScope}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">{proj.title}</h3>
            <p className="text-xs text-slate-500 mb-3">{proj.institution}</p>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Started {new Date(proj.createdAt).toLocaleDateString()}
              </span>
              <Link href={`/research/projects`} className="text-blue-600 font-semibold hover:underline">
                Open Workspace →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
