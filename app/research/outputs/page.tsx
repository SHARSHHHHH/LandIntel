'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/research/layout/AppShell';
import { OutputForm } from '@/components/research/projects/OutputForm';
import { DataStatusBadge } from '@/components/research/projects/DataStatusBadge';
import { Button } from '@/components/research/ui/button';
import { FileText, Plus, Loader2, AlertCircle, Search, Filter, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BASE_PATH } from "@/lib/research/base-path";

const VALID_OUTPUT_TYPES = ['Report', 'Policy Brief', 'Case Study', 'Dataset', 'GIS Analysis', 'Paper', 'Model/Pilot'];
const VALID_REVIEW_STATUSES = ['DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'ARCHIVED'];

interface Output {
  id: string;
  title: string;
  type: string;
  abstract: string;
  keywords: string[];
  methodology: string;
  dataSources: string[];
  version: string;
  reviewStatus: string;
  dataStatus: string;
  visibility: string;
  publicationDate: string | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; title: string; status: string };
  author: { id: string; name: string; email: string };
}

interface Project {
  id: string;
  title: string;
  status: string;
}

export default function OutputsPage() {
  const router = useRouter();
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const fetchOutputs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedProjectId) params.set('projectId', selectedProjectId);
      if (filter) params.set('search', filter);
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);

      const res = await fetch(`${BASE_PATH}/api/research/outputs?${params}`);
      if (!res.ok) throw new Error('Failed to fetch outputs');
      const data = await res.json();
      setOutputs(data.data || []);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, filter, statusFilter, typeFilter]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/research/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(data.data || []);
    } catch { /* ignore */ }
    finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutputs();
  }, [fetchOutputs]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateSuccess = () => {
    setShowForm(false);
    setSelectedProjectId(null);
    fetchOutputs();
  };

  const reviewStatusLabels: Record<string, string> = {
    DRAFT: 'Draft',
    UNDER_REVIEW: 'Under Review',
    PUBLISHED: 'Published',
    ARCHIVED: 'Archived',
  };

  const reviewStatusColors: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    UNDER_REVIEW: 'bg-amber-100 text-amber-700',
    PUBLISHED: 'bg-emerald-100 text-emerald-700',
    ARCHIVED: 'bg-red-100 text-red-700',
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" /> Research Outputs
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage draft, review, and publication workflows for research outputs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowForm(true); setSelectedProjectId(null); }}
            >
              <Plus className="w-4 h-4 mr-1" /> New Output
            </Button>
          </div>
        </div>

        {/* Create form modal */}
        {showForm && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => { setShowForm(false); setSelectedProjectId(null); }}
                className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back to listing
              </button>
              <h2 className="text-base font-bold text-slate-900">Create New Output</h2>
            </div>
            <OutputForm projectId={selectedProjectId || ''} />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search outputs..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none"
            >
              <option value="">All Status</option>
              {VALID_REVIEW_STATUSES.map((s) => (
                <option key={s} value={s}>{reviewStatusLabels[s]}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none"
            >
              <option value="">All Types</option>
              {VALID_OUTPUT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value || null)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Output count */}
        <p className="text-xs text-slate-500">
          {outputs.length} output{outputs.length !== 1 ? 's' : ''} found
        </p>

        {/* Output list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="ml-3 text-sm text-slate-500">Loading outputs...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchOutputs}>Retry</Button>
          </div>
        ) : outputs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-bold text-slate-800">No outputs found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {selectedProjectId
                ? 'No outputs for the selected project.'
                : 'Create a new output to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outputs.map((output) => (
              <div
                key={output.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Link href={`/research/outputs/${output.id}`} className="hover:underline">
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{output.title}</h3>
                    </Link>
                    <p className="text-[10px] text-slate-500 mt-0.5">{output.project.title}</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 ${
                    reviewStatusColors[output.reviewStatus] || 'bg-slate-100 text-slate-700'
                  }`}>
                    {reviewStatusLabels[output.reviewStatus] || output.reviewStatus}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                    {output.type}
                  </span>
                  <DataStatusBadge dataStatus={output.dataStatus} />
                  {output.visibility === 'Public' && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                      Public
                    </span>
                  )}
                </div>

                {output.abstract && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{output.abstract}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
                  <div className="flex items-center gap-2">
                    {output.author && (
                      <span className="text-[10px] text-slate-500">{output.author.name}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {output.publicationDate
                      ? new Date(output.publicationDate).toLocaleDateString()
                      : new Date(output.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
