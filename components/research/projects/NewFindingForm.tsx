'use client';

import { useState, useTransition } from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/research/ui/button';
import { BASE_PATH } from "@/lib/research/base-path";

interface AnalysisOption {
  id: string;
  title: string;
}

export function NewFindingForm({ projectId, analyses }: { projectId: string; analyses: AnalysisOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [statement, setStatement] = useState('');
  const [confidence, setConfidence] = useState('Moderate');
  const [dataStatus, setDataStatus] = useState('SAMPLE');
  const [selectedAnalysisId, setSelectedAnalysisId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!statement.trim()) {
      setError('Statement is required.');
      return;
    }

    startTransition(async () => {
      try {
        const body: Record<string, string | undefined> = {
          statement: statement.trim(),
          confidence,
          dataStatus,
          ...(selectedAnalysisId ? { analysisId: selectedAnalysisId } : {}),
        };

        const res = await fetch(`${BASE_PATH}/api/research/projects/${projectId}/findings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to create finding');
          return;
        }

        setStatement('');
        setConfidence('Moderate');
        setDataStatus('SAMPLE');
        setSelectedAnalysisId('');
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
          Finding created successfully.
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Statement <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          rows={3}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          placeholder="Enter the finding statement"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Confidence</label>
          <select
            value={confidence}
            onChange={(e) => setConfidence(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          >
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
          </select>
        </div>
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
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Associated Analysis <span className="text-slate-400">(optional)</span>
        </label>
        <select
          value={selectedAnalysisId}
          onChange={(e) => setSelectedAnalysisId(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="">None</option>
          {analyses.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Creating...
          </>
        ) : (
          <>
            <Lightbulb className="w-4 h-4 mr-1.5" /> Create Finding
          </>
        )}
      </Button>
    </form>
  );
}
