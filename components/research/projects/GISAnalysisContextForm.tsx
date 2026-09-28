'use client';

import { useMemo, useState } from 'react';
import { FlaskConical, Loader2, X, ExternalLink, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/research/ui/button';
import { DataStatusBadge } from '@/components/research/projects/DataStatusBadge';
import { BASE_PATH } from "@/lib/research/base-path";

const ANALYSIS_TYPES = ['Spatial Analysis', 'Area Analysis', 'Land-use Analysis', 'Research Observation'];

export interface GISAnalysisContext {
  feature: any;
  layer: {
    name: string;
    category: string;
    geometryType: string;
    dataStatus: string;
  };
  bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number } | null;
  areaSqKm: number | null;
  areaMethod: string | null;
}

interface GISAnalysisContextFormProps {
  context: GISAnalysisContext;
  projectId: string;
  projectTitle: string | null;
  onClose: () => void;
}

/**
 * Small modal that saves the currently selected GIS feature as an Analysis on
 * the selected Research Project, using the existing POST
 * /api/research/projects/[id]/analysis endpoint (title, methodology, resultsSummary,
 * dataStatus). No schema change: the analysis type, research question and the
 * full GIS feature context are embedded as structured text in methodology /
 * resultsSummary, and the layer's DataStatus is passed through unchanged
 * (SAMPLE is never promoted to REAL).
 */
export function GISAnalysisContextForm({ context, projectId, projectTitle, onClose }: GISAnalysisContextFormProps) {
  const { feature, layer, bbox, areaSqKm, areaMethod } = context;

  const featureName = useMemo(() => {
    const props = feature?.properties || {};
    return String(props.name || props.NAME || 'Unnamed feature');
  }, [feature]);

  const geometryType = feature?.geometry?.type || 'Unknown';

  const propertyEntries = useMemo(() => {
    const props = feature?.properties || {};
    return Object.entries(props).slice(0, 12) as [string, unknown][];
  }, [feature]);

  const [analysisType, setAnalysisType] = useState(ANALYSIS_TYPES[0]);
  const [title, setTitle] = useState(`GIS feature analysis: ${featureName}`);
  const [question, setQuestion] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ id: string; title: string } | null>(null);

  const bboxText = bbox
    ? `Lat ${bbox.minLat.toFixed(4)}°–${bbox.maxLat.toFixed(4)}°, Lng ${bbox.minLng.toFixed(4)}°–${bbox.maxLng.toFixed(4)}°`
    : 'not available';
  const areaText =
    areaSqKm !== null && areaSqKm > 0
      ? `${areaSqKm.toFixed(2)} km² — ${areaMethod} (approximation, not survey-grade)`
      : areaSqKm === 0
        ? '0 km² (point geometry — not applicable)'
        : 'not applicable for this geometry';

  function buildMethodology(): string {
    return [
      `Analysis type: ${analysisType}`,
      `Research question / objective: ${question.trim() || '(not specified)'}`,
      '',
      'GIS feature context (captured from map selection):',
      `  - GIS layer: ${layer.name} (category: ${layer.category}; layer geometry: ${layer.geometryType})`,
      `  - Feature: "${featureName}" (geometry type: ${geometryType})`,
      `  - Bounding box: ${bboxText}`,
      `  - Area: ${areaText}`,
      `  - Data status: ${layer.dataStatus} (inherited from source GIS layer; provenance preserved, not reclassified)`,
      `  - Feature properties: ${propertyEntries.length > 0 ? propertyEntries.map(([k, v]) => `${k}=${String(v)}`).join('; ') : 'none'}`,
      `  - Caveat: mapped research feature for context only — not an official administrative boundary. Area is a client-side spherical approximation.`,
    ].join('\n');
  }

  function buildResultsSummary(): string {
    const provenance = `GIS provenance: layer "${layer.name}" (${layer.dataStatus}), feature "${featureName}" (${geometryType}), bbox ${bboxText}, area ≈ ${areaText}.`;
    return `${provenance}\n\nNotes / interpretation:\n${notes.trim()}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Analysis title is required.');
      return;
    }
    if (!notes.trim()) {
      setError('Notes / interpretation are required.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/research/projects/${projectId}/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          methodology: buildMethodology(),
          resultsSummary: buildResultsSummary(),
          dataStatus: layer.dataStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create analysis');
        return;
      }
      setSaved({ id: data.data?.id || '', title: data.data?.title || title.trim() });
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" data-testid="gis-analysis-modal">
      <div
        className="w-full max-w-[460px] max-h-[90vh] overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-blue-600" />
            {saved ? 'Analysis Saved' : 'Create Analysis from GIS Feature'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-600" title="Close" data-testid="analysis-modal-close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {saved ? (
          <div className="px-5 py-4 space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3" data-testid="analysis-success">
              <p className="text-sm text-emerald-800 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Analysis saved successfully
              </p>
              <p className="text-xs text-emerald-700 mt-1.5">
                <span className="font-semibold">Title:</span> {saved.title}
              </p>
              <p className="text-xs text-emerald-700 mt-0.5 break-all">
                <span className="font-semibold">ID:</span>{' '}
                <span className="font-mono" data-testid="analysis-saved-id">{saved.id}</span>
              </p>
              {projectTitle && (
                <p className="text-xs text-emerald-700 mt-0.5">
                  <span className="font-semibold">Project:</span> {projectTitle}
                </p>
              )}
              <p className="text-[11px] text-emerald-600 mt-1.5">
                GIS provenance (layer, feature, bbox, area, data status) is preserved in the analysis record.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/research/projects/${projectId}/analysis`}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                data-testid="analysis-open-link"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open project Analysis
              </Link>
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
            {/* Read-only capture of the GIS context that will be attached */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1" data-testid="analysis-context-preview">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">GIS context to attach</p>
              <p className="text-[11px] text-slate-700">
                Layer: <span className="font-medium">{layer.name}</span>
              </p>
              <p className="text-[11px] text-slate-700">
                Feature: <span className="font-medium">{featureName}</span> · Geometry: <span className="font-mono">{geometryType}</span>
              </p>
              <p className="text-[10px] text-slate-500 font-mono">bbox {bboxText}</p>
              <p className="text-[10px] text-slate-500">area ≈ {areaText}</p>
              <p className="text-[10px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                Data status: <DataStatusBadge dataStatus={layer.dataStatus} /> {layer.dataStatus} — inherited, not reclassified
              </p>
              <p className="text-[10px] text-slate-400">Properties captured: {propertyEntries.length}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Analysis Title <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                data-testid="analysis-title-input"
                placeholder="Enter analysis title"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Analysis Type</label>
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value)}
                className={inputClass}
                data-testid="analysis-type-select"
              >
                {ANALYSIS_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Research question / objective</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
                className={inputClass}
                data-testid="analysis-question-input"
                placeholder="What research question does this feature help answer?"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes / interpretation <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={inputClass}
                data-testid="analysis-notes-input"
                placeholder="Your interpretation of this feature in the research context"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700" data-testid="analysis-error">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={onClose} data-testid="analysis-cancel-button">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving} data-testid="analysis-save-button">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Saving...
                  </>
                ) : (
                  <>
                    <FlaskConical className="w-4 h-4 mr-1.5" /> Save Analysis
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
