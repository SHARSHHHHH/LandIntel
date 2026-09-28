'use client';

import { useState, useTransition, useEffect } from 'react';
import { Database, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/research/ui/button';
import { BASE_PATH } from "@/lib/research/base-path";

interface DatasetOption {
  id: string;
  name: string;
  dataStatus: string;
  qualityStatus: string;
}

interface LinkedDataset {
  datasetId: string;
}

export function LinkDatasetForm({ projectId, linkedDatasets }: { projectId: string; linkedDatasets: LinkedDataset[] }) {
  const [isPending, startTransition] = useTransition();
  const [datasets, setDatasets] = useState<DatasetOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const linkedIds = new Set(linkedDatasets.map((d) => d.datasetId));
    fetch('/api/research/datasets')
      .then((res) => res.json())
      .then((data) => {
        const allDatasets: DatasetOption[] = data.data || [];
        const available = allDatasets.filter((d: DatasetOption) => !linkedIds.has(d.id));
        setDatasets(available);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [linkedDatasets]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedId) {
      setError('Please select a dataset to link.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`${BASE_PATH}/api/research/projects/${projectId}/datasets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ datasetId: selectedId }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to link dataset');
          return;
        }

        setSelectedId('');
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
          Dataset linked successfully.
        </div>
      )}

      <div className="flex items-center gap-2">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={isPending}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="">Select a dataset to link...</option>
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.dataStatus} / {d.qualityStatus})
            </option>
          ))}
        </select>
        <Button type="submit" disabled={isPending || !selectedId} size="sm">
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Plus className="w-4 h-4 mr-1" /> Link
            </>
          )}
        </Button>
      </div>

      {datasets.length === 0 && loaded && (
        <p className="text-xs text-slate-500">No available datasets to link. All existing datasets are already associated.</p>
      )}
    </form>
  );
}
