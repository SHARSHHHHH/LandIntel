import { AppShell } from '@/components/research/layout/AppShell';
import { PlusCircle } from 'lucide-react';
import { NewProjectForm } from '@/components/research/projects/NewProjectForm';

export default function NewProjectPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600" /> New Project
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Create a new research project to begin your work.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6">
          <NewProjectForm />
        </div>
      </div>
    </AppShell>
  );
}
