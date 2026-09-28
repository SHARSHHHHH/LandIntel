import { AppShell } from '@/components/research/layout/AppShell';
import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OutputDetailPage() {
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/research/outputs" className="text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Output Detail
          </h1>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500">
            <FileText className="w-10 h-10 text-blue-600 mx-auto mb-3 opacity-50" />
            <p className="text-sm text-slate-600">Output detail view</p>
            <p className="text-xs text-slate-400 mt-1">Select an output from the list to view its details.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
