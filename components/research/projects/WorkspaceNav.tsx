'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, FileText, Users, File, Database, Layers, PieChart, Lightbulb, Bot } from 'lucide-react';
import { cn } from '@/components/research/ui/button';

const NAV_ITEMS = [
  { href: '/overview', label: 'Overview', icon: BarChart3 },
  { href: '/questions', label: 'Questions', icon: FileText },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/resources', label: 'Resources', icon: File },
  { href: '/datasets', label: 'Datasets', icon: Database },
  { href: '/gis-layers', label: 'GIS Layers', icon: Layers },
  { href: '/analysis', label: 'Analysis', icon: PieChart },
  { href: '/findings', label: 'Findings', icon: Lightbulb },
  { href: '/assistant', label: 'Research Assistant', icon: Bot },
];

export function WorkspaceNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const suffix = pathname.replace(`/projects/${projectId}`, '');

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
      <div className="flex flex-wrap gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = item.href === '/overview'
            ? suffix === '' || suffix === '/overview'
            : suffix === item.href;
          return (
            <Link
              key={item.href}
              href={`/research/projects/${projectId}${item.href}`}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                active
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}