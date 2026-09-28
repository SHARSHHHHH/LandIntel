'use client';

import { useState, useTransition } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/research/ui/button';
import { BASE_PATH } from "@/lib/research/base-path";

export function NewQuestionForm({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!question.trim()) {
      setError('Question text is required.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`${BASE_PATH}/api/research/projects/${projectId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: question.trim(), description: description.trim() || undefined }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to create question');
          return;
        }

        setQuestion('');
        setDescription('');
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
          Question created successfully.
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Research Question <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          placeholder="Enter your research question"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Description <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          placeholder="Provide additional context or context for this question"
        />
      </div>

      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Adding...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-1.5" /> Add Question
          </>
        )}
      </Button>
    </form>
  );
}
