import { AppShell } from '@/components/research/layout/AppShell';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" /> Research Analytics
          </h1>
          <p className="text-xs text-slate-600 mt-1">Trend analysis and statistical indicators.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-slate-800">Analytics Module</h3>
          <p className="text-xs text-slate-500 mt-1">Coming soon.</p>
        </div>
      </div>
    </AppShell>
  );
}
