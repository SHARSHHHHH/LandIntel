'use client';

import { useState, useTransition, useEffect } from 'react';
import { Plus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/research/ui/button';
import { BASE_PATH } from "@/lib/research/base-path";

interface ResourceOption {
  id: string;
  title: string;
  dataStatus: string;
}

interface LinkedResource {
  resourceId: string;
}

export function LinkResourceForm({ projectId, linkedResources }: { projectId: string; linkedResources: LinkedResource[] }) {
  const [isPending, startTransition] = useTransition();
  const [resources, setResources] = useState<ResourceOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const linkedIds = new Set(linkedResources.map((r) => r.resourceId));

  useEffect(() => {
    const linkedIds = new Set(linkedResources.map((r) => r.resourceId));
    fetch('/api/research/resources')
      .then((res) => res.json())
      .then((data) => {
        const allResources: ResourceOption[] = data.data || [];
        const available = allResources.filter((r: ResourceOption) => !linkedIds.has(r.id));
        setResources(available);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [linkedResources]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedId) {
      setError('Please select a resource to link.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`${BASE_PATH}/api/research/projects/${projectId}/resources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resourceId: selectedId }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to link resource');
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

  const availableResources = resources.filter((r) => r.id !== selectedId);
  // Re-fetch after linking to update available list
  // The page reload will handle the refresh

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
          Resource linked successfully.
        </div>
      )}

      <div className="flex items-center gap-2">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={isPending}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="">Select a resource to link...</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title} ({r.dataStatus})
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

      {resources.length === 0 && loaded && (
        <p className="text-xs text-slate-500">No available resources to link. All existing resources are already associated.</p>
      )}
    </form>
  );
}
