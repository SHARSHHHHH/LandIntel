'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/research/layout/AppShell';
import { WorkspaceNav } from '@/components/research/projects/WorkspaceNav';
import { DataStatusBadge } from '@/components/research/projects/DataStatusBadge';
import { Button } from '@/components/research/ui/button';
import { Input } from '@/components/research/ui/input';
import { ArrowLeft, Loader2, AlertCircle, Bot, CheckCircle, AlertTriangle, X, Sparkles, BookOpen, Database, Layers, PieChart, Lightbulb, FileText } from 'lucide-react';
import Link from 'next/link';
import { BASE_PATH } from "@/lib/research/base-path";

interface ProjectContext {
  project: {
    id: string;
    title: string;
    researchProblem: string;
    objectives: string[];
    geographicScope: string;
    institution: string;
    status: string;
  };
  questions: Array<{ id: string; question: string; description: string | null }>;
  resources: Array<{
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
  }>;
  datasets: Array<{
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
  }>;
  gisLayers: Array<{
    id: string;
    name: string;
    category: string;
    description: string | null;
    provider: string | null;
    sourceUrl: string | null;
    geoserverUrl: string | null;
    geometryType: string;
    state: string | null;
    district: string | null;
    dataStatus: string;
  }>;
  analyses: Array<{
    id: string;
    title: string;
    methodology: string;
    resultsSummary: string;
    dataStatus: string;
    question: { id: string; question: string; description: string | null } | null;
  }>;
  findings: Array<{
    id: string;
    statement: string;
    confidence: string;
    dataStatus: string;
    analysisId: string | null;
    analysis: { id: string; title: string } | null;
  }>;
}

interface AssistantResponse {
  answer: string;
  sourceIds: string[];
  resources: Array<{ id: string; title: string; dataStatus: string; sourceUrl: string | null }>;
  datasets: Array<{ id: string; name: string; dataStatus: string; sourceUrl: string | null }>;
  analyses: Array<{ id: string; title: string; dataStatus: string }>;
  findings: Array<{ id: string; statement: string; dataStatus: string }>;
  provenance: Record<string, string>;
  evidenceSufficient: boolean;
}

const ICONS = {
  resources: BookOpen,
  datasets: Database,
  gisLayers: Layers,
  analyses: PieChart,
  findings: Lightbulb,
  questions: FileText,
};

export default function ProjectAssistantPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AssistantResponse | null>(null);

  const handleAsk = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch(`${BASE_PATH}/api/research/projects/${id}/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Assistant request failed');
      }

      const data: AssistantResponse = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setQuery('');
    setResponse(null);
    setError(null);
  };

  // Fetch project title for header
  const [projectTitle, setProjectTitle] = useState('Research Project');

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back to project */}
        <Link href={`/research/projects/${id}`} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Project
        </Link>

        {/* Project Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" /> Research Assistant
                </h1>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Ask questions about <strong>{projectTitle}</strong>. The assistant uses only this project&apos;s data.
              </p>
            </div>
          </div>
        </div>

        {/* Workspace Navigation */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
          <WorkspaceNav projectId={id} />
        </div>

        {/* Assistant Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-blue-600" /> Ask the Research Assistant
          </h2>
          <p className="text-xs text-slate-600 mb-4">
            The assistant will search this project&apos;s questions, resources, datasets, GIS layers, analyses, and findings to provide a grounded answer.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="e.g., What are the key findings about agricultural land conversion?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-10 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleAsk}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                </>
              ) : (
                'Ask Assistant'
              )}
            </button>
          </div>

          {response && (
            <button
              onClick={clearResults}
              className="mt-3 text-xs text-slate-500 hover:text-red-600 font-medium flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear Conversation
            </button>
          )}

          {/* Error State */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="mt-6 space-y-4">
              {/* Answer Header */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Bot className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      AI-Generated Answer
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        Grounded in This Project&apos;s Data
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      This answer is synthesized from retrieved project resources, datasets, analyses, and findings.
                      Always verify against source documents.
                    </p>
                  </div>
                </div>
              </div>

              {/* Evidence Sufficient Status */}
              <div className={`p-4 rounded-lg ${
                response.evidenceSufficient
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className="flex items-center gap-3">
                  {response.evidenceSufficient ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">Sufficient Project Evidence</p>
                        <p className="text-xs text-emerald-700">The assistant found relevant project data to ground its answer.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Insufficient Project Evidence</p>
                        <p className="text-xs text-amber-700">
                          This project does not contain enough evidence to fully answer the question.
                          The answer below is based on limited context and may be incomplete.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Answer */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{response.answer}</p>
              </div>

              {/* Cited Project Evidence */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" /> Cited Project Evidence
                </h3>

                {/* Resources */}
                {response.resources.length > 0 && (
                  <details className="mb-4">
                    <summary className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-2 mb-2">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Resources ({response.resources.length})
                    </summary>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6 mt-2 space-y-2">
                      {response.resources.map((r) => (
                        <div key={r.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900 truncate">{r.title}</span>
                            <DataStatusBadge dataStatus={r.dataStatus} />
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">{r.id.slice(0, 8)}...</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Datasets */}
                {response.datasets.length > 0 && (
                  <details className="mb-4">
                    <summary className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-2 mb-2">
                      <Database className="w-3.5 h-3.5 text-purple-600" /> Datasets ({response.datasets.length})
                    </summary>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6 mt-2 space-y-2">
                      {response.datasets.map((d) => (
                        <div key={d.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900 truncate">{d.name}</span>
                            <DataStatusBadge dataStatus={d.dataStatus} />
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">{d.id.slice(0, 8)}...</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Analyses */}
                {response.analyses.length > 0 && (
                  <details className="mb-4">
                    <summary className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-2 mb-2">
                      <PieChart className="w-3.5 h-3.5 text-red-600" /> Analyses ({response.analyses.length})
                    </summary>
                    <div className="ml-6 mt-2 space-y-2">
                      {response.analyses.map((a) => (
                        <div key={a.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900 truncate">{a.title}</span>
                            <DataStatusBadge dataStatus={a.dataStatus} />
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">{a.id.slice(0, 8)}...</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Findings */}
                {response.findings.length > 0 && (
                  <details className="mb-4">
                    <summary className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-2 mb-2">
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-600" /> Findings ({response.findings.length})
                    </summary>
                    <div className="ml-6 mt-2 space-y-2">
                      {response.findings.map((f) => (
                        <div key={f.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900 truncate">{f.statement.slice(0, 80)}...</span>
                            <DataStatusBadge dataStatus={f.dataStatus} />
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">{f.id.slice(0, 8)}...</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Source IDs & Provenance */}
                {response.sourceIds.length > 0 && (
                  <details className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <summary className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-blue-600" /> All Source IDs & Provenance ({response.sourceIds.length})
                    </summary>
                    <div className="mt-3 space-y-1">
                      {response.sourceIds.map((sourceId) => (
                        <div key={sourceId} className="flex items-center gap-2 text-xs font-mono">
                          <span className="bg-white border border-slate-200 px-2 py-0.5 rounded">{sourceId.slice(0, 8)}...</span>
                          <span className={`px-1.5 py-0.5 rounded ${
                            response.provenance[sourceId] === 'REAL' ? 'bg-emerald-100 text-emerald-800' :
                            response.provenance[sourceId] === 'DERIVED' ? 'bg-purple-100 text-purple-800' :
                            response.provenance[sourceId] === 'N/A' ? 'bg-slate-100 text-slate-700' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {response.provenance[sourceId]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}