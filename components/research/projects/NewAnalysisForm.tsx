'use client';

import { useState, useTransition } from 'react';
import { FlaskConical, Loader2 } from 'lucide-react';
import { Button } from '@/components/research/ui/button';
import { BASE_PATH } from "@/lib/research/base-path";

interface QuestionOption {
  id: string;
  question: string;
}

export function NewAnalysisForm({ projectId, questions }: { projectId: string; questions: QuestionOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [methodology, setMethodology] = useState('');
  const [resultsSummary, setResultsSummary] = useState('');
  const [dataStatus, setDataStatus] = useState('SAMPLE');
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title.trim() || !methodology.trim() || !resultsSummary.trim()) {
      setError('Title, methodology, and results summary are required.');
      return;
    }

    startTransition(async () => {
      try {
        const body: Record<string, string | undefined> = {
          title: title.trim(),
          methodology: methodology.trim(),
          resultsSummary: resultsSummary.trim(),
          dataStatus,
          ...(selectedQuestionId ? { questionId: selectedQuestionId } : {}),
        };

        const res = await fetch(`${BASE_PATH}/api/research/projects/${projectId}/analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to create analysis');
          return;
        }

        setTitle('');
        setMethodology('');
        setResultsSummary('');
        setSelectedQuestionId('');
        setDataStatus('SAMPLE');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        window.location.reload();
      } catch {
        setError('An unexpected error occurred.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
          Analysis created successfully.
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Analysis Title <span className="text-red-500">*</span>
        </label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          placeholder="Enter analysis title"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Methodology <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          value={methodology}
          onChange={(e) => setMethodology(e.target.value)}
          rows={3}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          placeholder="Describe the methodology used"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Results Summary <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          value={resultsSummary}
          onChange={(e) => setResultsSummary(e.target.value)}
          rows={3}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          placeholder="Summarize the results"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Data Status</label>
          <select
            value={dataStatus}
            onChange={(e) => setDataStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          >
            <option value="SAMPLE">SAMPLE</option>
            <option value="REAL">REAL</option>
            <option value="DERIVED">DERIVED</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Associated Question <span className="text-slate-400">(optional)</span>
          </label>
          <select
            value={selectedQuestionId}
            onChange={(e) => setSelectedQuestionId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          >
            <option value="">None</option>
            {questions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.question}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Creating...
          </>
        ) : (
          <>
            <FlaskConical className="w-4 h-4 mr-1.5" /> Create Analysis
          </>
        )}
      </Button>
    </form>
  );
}
