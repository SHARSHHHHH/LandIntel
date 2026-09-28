'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/research/layout/AppShell';
import { ResourceCard } from '@/components/research/repository/ResourceCard';
import { ResourceFilters } from '@/components/research/repository/ResourceFilters';
import { DatasetCard } from '@/components/research/datasets/DatasetCard';
import { BookOpen, Loader2, AlertCircle, Sparkles, X, CheckCircle, AlertTriangle, Database } from 'lucide-react';
import { BASE_PATH } from "@/lib/research/base-path";

interface Resource {
  id: string;
  title: string;
  authors: string[];
  organization: string | null;
  resourceType: string;
  publicationYear: number | null;
  topic: string;
  state: string | null;
  district: string | null;
  keywords: string[];
  abstract: string;
  source: string;
  sourceUrl: string | null;
  accessLevel: string;
  verificationStatus: boolean;
  dataStatus: string;
}

interface Dataset {
  id: string;
  name: string;
  provider: string;
  type: string;
  geographicScope: string;
  temporalScope: string | null;
  variables: string[];
  format: string;
  spatialResolution: string | null;
  crs: string | null;
  licenseAccess: string;
  sourceUrl: string | null;
  updateFrequency: string | null;
  version: string;
  qualityStatus: string;
  dataStatus: string;
  createdAt: Date;
}

interface AISearchResponse {
  answer: string;
  resources: Array<{
    id: string;
    title: string;
    authors: string[];
    topic: string;
    state: string | null;
    district: string | null;
    dataStatus: string;
    sourceUrl: string | null;
  }>;
  datasets: Array<{
    id: string;
    name: string;
    provider: string;
    type: string;
    geographicScope: string;
    dataStatus: string;
    sourceUrl: string | null;
  }>;
  sourceIds: string[];
  provenance: Record<string, string>;
  evidenceSufficient: boolean;
}

export default function RepositoryPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { search, type, state, district, dataStatus, sort } = searchParams;

  // Resources fetched client-side from the existing /api/research/resources endpoint
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (type) params.set('type', type);
    if (state) params.set('state', state);
    if (district) params.set('district', district);
    if (dataStatus) params.set('dataStatus', dataStatus);
    if (sort) params.set('sort', sort);

    let cancelled = false;
    setResourcesLoading(true);
    fetch(`${BASE_PATH}/api/research/resources?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => {
        if (!cancelled) setResources(data.data || []);
      })
      .catch(() => {
        if (!cancelled) setResources([]);
      })
      .finally(() => {
        if (!cancelled) setResourcesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, type, state, district, dataStatus, sort]);

  // AI Search state
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<AISearchResponse | null>(null);

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    setAiError(null);
    setAiResponse(null);

    try {
      const res = await fetch('/api/research/search/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'AI search failed');
      }

      const data: AISearchResponse = await res.json();
      setAiResponse(data);
    } catch (err: any) {
      setAiError(err.message || 'An unexpected error occurred');
    } finally {
      setAiLoading(false);
    }
  };

  const clearAiResults = () => {
    setAiQuery('');
    setAiResponse(null);
    setAiError(null);
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">Module</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" /> Research Repository
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Search and filter research papers, government reports, policy documents, and case studies with preserved provenance metadata.
          </p>
        </div>

        {/* AI Research Search Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-blue-600" /> AI Research Search
          </h2>
          <p className="text-xs text-slate-600 mb-4">
            Ask a research question. The AI will search platform resources and provide a grounded answer with citations.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="e.g., How is urban expansion affecting agricultural land in Tamil Nadu?"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-10 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                disabled={aiLoading}
              />
            </div>
            <button
              onClick={handleAiSearch}
              disabled={aiLoading || !aiQuery.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                </>
              ) : (
                'Ask AI'
              )}
            </button>
          </div>

          {aiResponse && (
            <button
              onClick={clearAiResults}
              className="mt-3 text-xs text-slate-500 hover:text-red-600 font-medium flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear AI Results
            </button>
          )}

          {/* AI Error State */}
          {aiError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{aiError}</p>
              </div>
            </div>
          )}

          {/* AI Results */}
          {aiResponse && (
            <div className="mt-6 space-y-4">
              {/* AI Answer Header */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      AI-Generated Answer
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        Grounded in Platform Resources
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      This answer is synthesized from retrieved ResearchResource and Dataset records. Always verify against source documents.
                    </p>
                  </div>
                </div>
              </div>

              {/* Evidence Sufficient Status */}
              <div className={`p-4 rounded-lg ${
                aiResponse.evidenceSufficient
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className="flex items-center gap-3">
                  {aiResponse.evidenceSufficient ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">Sufficient Evidence Found</p>
                        <p className="text-xs text-emerald-700">The AI found relevant platform resources to ground its answer.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Insufficient Evidence</p>
                        <p className="text-xs text-amber-700">
                          The available platform resources do not contain enough evidence to fully answer this question. 
                          The AI answer below is based on limited context and may be incomplete.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* AI Answer */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{aiResponse.answer}</p>
              </div>

              {/* Source IDs */}
              {aiResponse.sourceIds.length > 0 && (
                <details className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <summary className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-blue-600" /> Source IDs & Provenance ({aiResponse.sourceIds.length})
                  </summary>
                  <div className="mt-3 space-y-1">
                    {aiResponse.sourceIds.map((id) => (
                      <div key={id} className="flex items-center gap-2 text-xs font-mono">
                        <span className="bg-white border border-slate-200 px-2 py-0.5 rounded">{id.slice(0, 8)}...</span>
                        <span className={`px-1.5 py-0.5 rounded ${aiResponse.provenance[id] === 'REAL' ? 'bg-emerald-100 text-emerald-800' : aiResponse.provenance[id] === 'DERIVED' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'}`}>
                          {aiResponse.provenance[id]}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Relevant Resources */}
              {aiResponse.resources.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" /> Relevant Resources ({aiResponse.resources.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiResponse.resources.map((res) => (
                      <ResourceCard
                        key={res.id}
                        resource={{
                          ...res,
                          organization: null,
                          resourceType: 'Resource',
                          publicationYear: null,
                          keywords: [],
                          abstract: '',
                          source: '',
                          accessLevel: '',
                          verificationStatus: false,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Relevant Datasets */}
              {aiResponse.datasets.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600" /> Relevant Datasets ({aiResponse.datasets.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiResponse.datasets.map((ds) => (
                      <DatasetCard
                        key={ds.id}
                        dataset={{
                          ...ds,
                          temporalScope: null,
                          variables: [],
                          format: '',
                          spatialResolution: null,
                          crs: null,
                          licenseAccess: '',
                          updateFrequency: null,
                          version: '1.0',
                          qualityStatus: 'UNKNOWN',
                          createdAt: new Date(),
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No evidence state */}
              {aiResponse.resources.length === 0 && aiResponse.datasets.length === 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
                  <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-slate-800">No Relevant Resources Found</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    The search did not return any matching resources or datasets from the platform.
                    Try rephrasing your question or use the traditional search filters below.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Traditional Filters */}
        <ResourceFilters />

        {/* Traditional Search Results */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              Traditional Search Results: <span className="text-blue-600">{resources.length}</span> resources found
            </h2>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              SAMPLE DATA
            </span>
          </div>

          {resourcesLoading ? (
            <div className="py-12 text-center text-slate-500">
              <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-3 animate-spin" />
              <p className="text-xs text-slate-500">Loading resources...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-semibold text-slate-800">No resources found</h3>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((res) => (
                <ResourceCard key={res.id} resource={res} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}