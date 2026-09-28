'use client';

import dynamic from 'next/dynamic';
import { AppShell } from '@/components/research/layout/AppShell';
import { MapPin } from 'lucide-react';

// @ts-ignore
const GISMap = dynamic(() => import('@/components/research/projects/GISMap').then((mod) => mod.GISMap), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px]">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading map...</p>
      </div>
    </div>
  ),
});

export default function GISPage() {
  return (
    <AppShell>
      <div className="max-w-[100%] h-full flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" /> GIS & Map Workspace
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Visualize and manage spatial GIS layers across research projects.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
              GEOMETRY DATA NOT YET IMPORTED
            </span>
          </div>
        </div>
        <div className="flex-1 min-h-[600px]">
          <GISMap />
        </div>
      </div>
    </AppShell>
  );
}
