'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/research/layout/AppShell';
import { Button } from '@/components/research/ui/button';
import { Input } from '@/components/research/ui/input';
import { ArrowLeft, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function NewInnovationPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    type: 'hackathon',
    organizer: '',
    description: '',
    deadline: '',
    eligibility: '',
    status: 'OPEN',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.organizer.trim() || !form.description.trim()) {
      setError('Title, organizer, and description are required');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/research/innovation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          organizer: form.organizer,
          description: form.description,
          deadline: form.deadline ? new Date(form.deadline) : new Date(),
          eligibility: form.eligibility,
          status: form.status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create opportunity');
      }

      setSuccess(true);
      setTimeout(() => router.push('/innovation'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/innovation')}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <h1 className="text-xl font-bold text-slate-900">Create New Opportunity</h1>

        {success ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900">Opportunity Created!</h2>
            <p className="text-sm text-slate-500 mt-1">Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-700">Title *</label>
              <Input
                placeholder="Enter opportunity title"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Type</label>
              <select
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="hackathon">Hackathon</option>
                <option value="Pilot Project">Pilot Project</option>
                <option value="Case Study Competition">Case Study Competition</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Organizer *</label>
              <Input
                placeholder="Enter organizer name"
                value={form.organizer}
                onChange={(e) => handleChange('organizer', e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Description *</label>
              <textarea
                placeholder="Describe the opportunity..."
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Deadline</label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => handleChange('deadline', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none"
                >
                  <option value="OPEN">Open</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Eligibility</label>
              <Input
                placeholder="Eligibility criteria"
                value={form.eligibility}
                onChange={(e) => handleChange('eligibility', e.target.value)}
                className="mt-1"
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Creating...
                </>
              ) : 'Create Opportunity'}
            </Button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
