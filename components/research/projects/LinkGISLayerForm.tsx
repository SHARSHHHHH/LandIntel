'use client';

import { useState, useTransition, useEffect } from 'react';
import { Layers, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/research/ui/button';
import { BASE_PATH } from "@/lib/research/base-path";

interface GISLayerOption {
  id: string;
  name: string;
  category: string;
  dataStatus: string;
  geometryType: string;
}

interface LinkedGISLayer {
  layerId: string;
}

export function LinkGISLayerForm({ projectId, linkedLayers }: { projectId: string; linkedLayers: LinkedGISLayer[] }) {
  const [isPending, startTransition] = useTransition();
  const [layers, setLayers] = useState<GISLayerOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const linkedIds = new Set(linkedLayers.map((l) => l.layerId));
    fetch('/api/research/gis-layers')
      .then((res) => res.json())
      .then((data) => {
        const allLayers: GISLayerOption[] = data.data || [];
        const available = allLayers.filter((l: GISLayerOption) => !linkedIds.has(l.id));
        setLayers(available);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [linkedLayers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedId) {
      setError('Please select a GIS layer to link.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`${BASE_PATH}/api/research/projects/${projectId}/gis-layers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layerId: selectedId }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to link GIS layer');
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
          GIS layer linked successfully.
        </div>
      )}

      <div className="flex items-center gap-2">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={isPending}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="">Select a GIS layer to link...</option>
          {layers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} ({l.dataStatus} / {l.geometryType})
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

      {layers.length === 0 && loaded && (
        <p className="text-xs text-slate-500">No available GIS layers to link. All existing layers are already associated.</p>
      )}
    </form>
  );
}
