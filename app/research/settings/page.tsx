import { AppShell } from '@/components/research/layout/AppShell';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" /> System Settings & Profile
          </h1>
          <p className="text-xs text-slate-600 mt-1">Manage institutional profile, API keys, and demo role preferences.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <Settings className="w-12 h-12 text-blue-600 mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-slate-800">Settings Module</h3>
          <p className="text-xs text-slate-500 mt-1">User profile & demo settings.</p>
        </div>
      </div>
    </AppShell>
  );
}
