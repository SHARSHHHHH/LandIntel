import { AppShell } from '@/components/research/layout/AppShell';
import { ProjectStatusBadge } from '@/components/research/projects/ProjectStatusBadge';
import { RoleBadge } from '@/components/research/projects/RoleBadge';
import {
  BarChart3,
  Users,
  Calendar,
  FileText,
  Database,
  Layers,
  PieChart,
  Lightbulb,
  ArrowLeft,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { absoluteUrl } from '@/lib/research/server-fetch';

interface Project {
  id: string;
  title: string;
  status: string;
  visibility: string;
  institution: string;
  owner: { id: string; name: string; email: string } | null;
  members: { userId: string; user: { id: string; name: string; email: string }; role: string }[];
  _count: {
    questions: number;
    resources: number;
    datasets: number;
    gisLayers: number;
    analyses: number;
    findings: number;
  };
}

interface OverviewPageProps {
  params: { id: string };
}

const statItems = [
  { label: 'Questions', key: 'questions' as const, icon: FileText, color: 'bg-blue-50 text-blue-600' },
  { label: 'Resources', key: 'resources' as const, icon: Database, color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Datasets', key: 'datasets' as const, icon: Database, color: 'bg-purple-50 text-purple-600' },
  { label: 'GIS Layers', key: 'gisLayers' as const, icon: Layers, color: 'bg-orange-50 text-orange-600' },
  { label: 'Analysis', key: 'analyses' as const, icon: PieChart, color: 'bg-red-50 text-red-600' },
  { label: 'Findings', key: 'findings' as const, icon: Lightbulb, color: 'bg-yellow-50 text-yellow-600' },
];

export default async function ProjectOverviewPage({ params }: OverviewPageProps) {
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
            <p className="text-sm text-red-700 font-medium">Failed to load project overview.</p>
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
            <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-bold text-slate-800">Project Not Found</h3>
            <p className="text-xs text-slate-500 mt-1">The project you are looking for does not exist or you do not have access.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const memberCount = project.members.length;
  const owner = project.owner;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Link href={`/research/projects/${id}`} className="text-slate-500 hover:text-slate-700 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" /> Project Overview
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ProjectStatusBadge status={project.status} />
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wide">
                {project.visibility}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-1">Project summary and statistics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statItems.map((item) => (
            <div key={item.key} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</span>
                <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center`}>
                  <item.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {project._count[item.key]}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {item.label.toLowerCase()} linked to this project
              </p>
            </div>
          ))}

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team Members</span>
              <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{memberCount}</div>
            <p className="text-xs text-slate-500 mt-1">Owner + collaborators</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="text-sm font-bold text-emerald-700 tracking-tight">{project.status}</div>
            <p className="text-xs text-slate-500 mt-1">Project status</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="p-6 space-y-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Project Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Institution</h3>
                <p className="text-sm text-slate-800">{project.institution}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Visibility</h3>
                <p className="text-sm text-slate-800">{project.visibility}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Owner</h3>
                {owner ? (
                  <div className="flex items-center gap-2 text-sm text-slate-800">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {owner.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{owner.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {owner.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Unknown</p>
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Team</h3>
                <div className="flex flex-wrap gap-1">
                  {project.members.map((m, i) => (
                    <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase font-medium">
                      {m.user.name} — {m.role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
