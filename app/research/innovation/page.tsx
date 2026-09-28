'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/research/layout/AppShell';
import { Button } from '@/components/research/ui/button';
import { Sparkles, Plus, Loader2, AlertCircle, Search, Filter, Clock, MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BASE_PATH } from "@/lib/research/base-path";

interface Opportunity {
  id: string;
  title: string;
  type: string;
  organizer: string;
  description: string;
  deadline: string;
  eligibility: string;
  status: string;
  createdAt: string;
  submissions: { id: string; userId: string; title: string; status: string; createdAt: string }[];
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  UNDER_REVIEW: 'Under Review',
  CLOSED: 'Closed',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-emerald-100 text-emerald-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-red-100 text-red-700',
};

const TYPE_ICONS: Record<string, string> = {
  hackathon: '⚡',
  'Pilot Project': '🧪',
  'Case Study Competition': '📋',
};

export default function InnovationPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const fetchOpportunities = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter) params.set('search', filter);
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);

      const res = await fetch(`${BASE_PATH}/api/research/innovation?${params}`);
      if (!res.ok) throw new Error('Failed to fetch opportunities');
      const data = await res.json();
      setOpportunities(data.data || []);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [filter, statusFilter, typeFilter]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const typeLabels: Record<string, string> = {
    hackathon: 'Hackathon',
    'Pilot Project': 'Pilot Project',
    'Case Study Competition': 'Case Study Competition',
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" /> Innovation Portal
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Discover hackathons, research grants, policy challenges, and pilot projects.
            </p>
          </div>
          <Link href="/research/innovation/new">
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" /> New Opportunity
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search opportunities..."
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
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="hackathon">Hackathon</option>
              <option value="Pilot Project">Pilot Project</option>
              <option value="Case Study Competition">Case Study Competition</option>
            </select>
          </div>
        </div>

        {/* Count */}
        <p className="text-xs text-slate-500">{opportunities.length} opportunity{opportunities.length !== 1 ? 's' : ''} found</p>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="ml-3 text-sm text-slate-500">Loading opportunities...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchOpportunities}>Retry</Button>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-bold text-slate-800">No opportunities found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {filter || statusFilter || typeFilter
                ? 'Try adjusting your filters.'
                : 'Check back later for new opportunities.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {opportunities.map((opp) => (
              <Link
                key={opp.id}
                href={`/research/innovation/${opp.id}`}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{opp.title}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{opp.organizer}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-700">SAMPLE</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      STATUS_COLORS[opp.status] || 'bg-slate-100 text-slate-700'
                    }`}>
                      {STATUS_LABELS[opp.status] || opp.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                    {TYPE_ICONS[opp.type] || '📌'} {typeLabels[opp.type] || opp.type}
                  </span>
                  {opp.submissions.length > 0 && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                      {opp.submissions.length} submission{opp.submissions.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {opp.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{opp.description}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Clock className="w-3 h-3" />
                    {new Date(opp.deadline).toLocaleDateString()}
                  </div>
                  <span className="text-[10px] text-blue-600 font-medium hover:underline">
                    View details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
