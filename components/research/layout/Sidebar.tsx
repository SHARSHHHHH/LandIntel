'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Database,
  FolderKanban,
  Map,
  BarChart3,
  FileText,
  Sparkles,
  Settings,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

const navigationItems = [
  { name: 'Research Dashboard', href: '/research/dashboard', icon: LayoutDashboard },
  { name: 'Research Repository', href: '/research/repository', icon: BookOpen },
  { name: 'Dataset Explorer', href: '/research/datasets', icon: Database },
  { name: 'Research Projects', href: '/research/projects', icon: FolderKanban },
  { name: 'GIS & Map Workspace', href: '/research/gis', icon: Map },
  { name: 'Analytics', href: '/research/analytics', icon: BarChart3 },
  { name: 'Research Outputs', href: '/research/outputs', icon: FileText },
  { name: 'Innovation Hub', href: '/research/innovation', icon: Sparkles },
];

const secondaryItems = [
  { name: 'Settings', href: '/research/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 hidden md:flex">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3 bg-slate-950/50">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
          ND
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight leading-tight">LandGov Research</h1>
          <p className="text-[10px] text-slate-400 font-medium">SIH 26019 Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase px-3 mb-2">
          Research Workflow
        </div>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-6">
          <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase px-3 mb-2">
            System & Support
          </div>
          {secondaryItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Provenance / Sandbox Notice Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs">
        <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Provenance Active</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Records verified against institutional metadata. Demo records marked <span className="text-slate-200 font-mono">SAMPLE</span>.
        </p>
      </div>
    </aside>
  );
}
