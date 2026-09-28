'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/research/layout/AppShell';
import { Button } from '@/components/research/ui/button';
import { Input } from '@/components/research/ui/input';
import { Loader2, ArrowLeft, Clock, MapPin, Users, AlertCircle, CheckCircle, X } from 'lucide-react';
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

interface Project {
  id: string;
  title: string;
}

const TYPE_LABELS: Record<string, string> = {
  hackathon: 'Hackathon',
  'Pilot Project': 'Pilot Project',
  'Case Study Competition': 'Case Study Competition',
};

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

export default function InnovationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submission form state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitAbstract, setSubmitAbstract] = useState('');
  const [submitProjectId, setSubmitProjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchOpportunity = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_PATH}/api/research/innovation/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Opportunity not found');
        throw new Error('Failed to fetch');
      }
      const data = await res.json();
      setOpportunity(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/research/projects');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setProjects(data.data || []);
    } catch {
      // Silently ignore
    }
  }, []);

  useEffect(() => {
    fetchOpportunity();
    fetchProjects();
  }, [fetchOpportunity, fetchProjects]);

  const handleSubmit = async () => {
    if (!submitTitle.trim() || !submitAbstract.trim()) {
      setSubmitError('Title and abstract are required');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const res = await fetch(`${BASE_PATH}/api/research/innovation/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: submitTitle,
          abstract: submitAbstract,
          projectId: submitProjectId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'Submission failed');
        return;
      }

      setSubmitSuccess(true);
      setSubmissionId(data.data?.id || null);
      setShowSubmitModal(false);
      setSubmitTitle('');
      setSubmitAbstract('');
      setSubmitProjectId('');
      fetchOpportunity();
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="ml-3 text-sm text-slate-500">Loading opportunity...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !opportunity) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto">
          <Link href="/research/innovation" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to opportunities
          </Link>
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-800">{error || 'Not Found'}</h2>
            <p className="text-sm text-slate-500 mt-1">{error || 'The opportunity you are looking for could not be found.'}</p>
            <Link href="/research/innovation">
              <Button variant="outline" className="mt-4">Back to Opportunities</Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/research/innovation" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Opportunities
        </Link>

        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{opportunity.title}</h1>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 ${STATUS_COLORS[opportunity.status] || 'bg-slate-100 text-slate-700'}`}>
                  {STATUS_LABELS[opportunity.status] || opportunity.status}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-700">SAMPLE</span>
              </div>
              <p className="text-sm text-slate-600 mt-1">{opportunity.organizer}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
              {TYPE_LABELS[opportunity.type] || opportunity.type}
            </span>
            {opportunity.deadline && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> {new Date(opportunity.deadline).toLocaleDateString()}
              </span>
            )}
            {opportunity.submissions.length > 0 && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">
                {opportunity.submissions.length} submission{opportunity.submissions.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-2">Description</h2>
              <p className="text-sm text-slate-700 leading-relaxed">{opportunity.description}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Details</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Organizer</p>
                    <p className="text-sm text-slate-800">{opportunity.organizer}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Eligibility</p>
                    <p className="text-sm text-slate-800">{opportunity.eligibility || 'Not specified'}</p>
                  </div>
                </div>
                {opportunity.deadline && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">Deadline</p>
                      <p className="text-sm text-slate-800">{new Date(opportunity.deadline).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {opportunity.status === 'OPEN' && new Date(opportunity.deadline) > new Date() && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 mb-3">Submit</h2>
                <p className="text-xs text-slate-500 mb-3">Submit your proposal for this opportunity.</p>
                <Button className="w-full" onClick={() => setShowSubmitModal(true)}>
                  Submit Proposal
                </Button>
              </div>
            )}

            {opportunity.status !== 'OPEN' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 mb-2">Status</h2>
                <p className="text-xs text-slate-500">
                  This opportunity is currently {opportunity.status.toLowerCase()}.
                  {new Date(opportunity.deadline) < new Date() && ' The deadline has passed.'}
                </p>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3">
                Submissions ({opportunity.submissions.length})
              </h2>
              {opportunity.submissions.length === 0 ? (
                <p className="text-xs text-slate-500">No submissions yet.</p>
              ) : (
                <div className="space-y-2">
                  {opportunity.submissions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-800 truncate">{sub.title}</p>
                        <p className="text-[10px] text-slate-500">{new Date(sub.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">{sub.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowSubmitModal(false)}>
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Submit to: {opportunity.title}</h2>
              <button onClick={() => { setShowSubmitModal(false); setSubmitError(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">Submission Successful!</h3>
                <p className="text-sm text-slate-600 mt-2">Your proposal has been submitted successfully.</p>
                {submissionId && <p className="text-xs text-slate-500 mt-1">Submission ID: {submissionId}</p>}
                <Button variant="outline" className="mt-4" onClick={() => router.push(`/research/innovation/${id}`)}>Close</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {submitError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-xs text-red-700">{submitError}</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-slate-700">Proposal Title *</label>
                  <Input
                    placeholder="Enter proposal title"
                    value={submitTitle}
                    onChange={(e) => setSubmitTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Abstract *</label>
                  <textarea
                    placeholder="Describe your proposal..."
                    value={submitAbstract}
                    onChange={(e) => setSubmitAbstract(e.target.value)}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Related Project (optional)</label>
                  <select
                    value={submitProjectId}
                    onChange={(e) => setSubmitProjectId(e.target.value)}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  >
                    <option value="">Select a project...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setShowSubmitModal(false); setSubmitError(null); }} disabled={submitting}>Cancel</Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !submitTitle.trim() || !submitAbstract.trim()}
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
