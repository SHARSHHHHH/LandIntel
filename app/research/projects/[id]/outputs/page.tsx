import { AppShell } from '@/components/research/layout/AppShell';
import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProjectOutputsPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link href={`/research/projects/${params.id}`} className="text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Project Outputs
          </h1>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Outputs associated with this project.</p>
            </div>
            <Link
              href={`/research/outputs?projectId=${params.id}`}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <FileText className="w-3 h-3" /> Create Output
            </Link>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-slate-800">Outputs</h3>
          <p className="text-xs text-slate-500 mt-1">
            Create outputs linked to this project from the button above.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
