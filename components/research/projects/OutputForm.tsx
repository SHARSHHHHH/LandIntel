'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/research/ui/button';
import { Loader2, FileText, AlertCircle } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  status: string;
}

export function OutputForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Report',
    abstract: '',
    keywords: '',
    methodology: '',
    dataSources: '',
    version: '1.0',
    visibility: 'Internal',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/research/projects')
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.data || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const selectedProject = projects.find((p) => p.id === projectId) || null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }

    const keywords = formData.keywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const dataSources = formData.dataSources
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    startTransition(async () => {
      try {
        const res = await fetch('/api/research/outputs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            projectId,
            keywords,
            dataSources,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to create output');
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          router.push('/outputs');
          router.refresh();
        }, 1500);
      } catch {
        setError('An unexpected error occurred.');
      }
    });
  }

  const outputTypes = ['Report', 'Policy Brief', 'Case Study', 'Dataset', 'GIS Analysis', 'Paper', 'Model/Pilot'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
          Output created successfully. Redirecting...
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-slate-700 mb-1 block">Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          placeholder="Enter output title"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">Output Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {outputTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">Version</label>
          <input
            type="text"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-700 mb-1 block">Associated Project</label>
        {loaded ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800">
            {selectedProject ? (
              <span className="font-medium">{selectedProject.title}</span>
            ) : (
              <span className="text-slate-500">No project selected</span>
            )}
          </div>
        ) : (
          <div className="h-8 bg-slate-50 border border-slate-200 rounded-lg animate-pulse" />
        )}
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-700 mb-1 block">Abstract</label>
        <textarea
          value={formData.abstract}
          onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
          rows={3}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="Brief description of the output"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">Keywords (comma-separated)</label>
          <input
            type="text"
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="keyword1, keyword2"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">Data Sources (comma-separated)</label>
          <input
            type="text"
            value={formData.dataSources}
            onChange={(e) => setFormData({ ...formData, dataSources: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="source1, source2"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-700 mb-1 block">Methodology</label>
        <textarea
          value={formData.methodology}
          onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
          rows={2}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="Brief methodology description"
        />
      </div>

      <div className="flex items-center gap-2">
        <select
          value={formData.visibility}
          onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="Internal">Internal</option>
          <option value="Public">Public</option>
          <option value="Restricted">Restricted</option>
        </select>
        <span className="text-[10px] text-slate-500">Visibility</span>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <FileText className="w-4 h-4 mr-2" />
        )}
        {isPending ? 'Creating...' : 'Create Output'}
      </Button>
    </form>
  );
}
