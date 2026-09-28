import { Bookmark, Building2, Calendar, Globe, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/research/ui/button';

interface ResourceDetailProps {
  resource: {
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
    dataStatus: 'REAL' | 'SAMPLE' | 'DERIVED';
  };
}

export function ResourceDetail({ resource }: ResourceDetailProps) {
  const statusColors = {
    REAL: 'bg-emerald-100 text-emerald-800',
    SAMPLE: 'bg-amber-100 text-amber-800',
    DERIVED: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <Link href="/research/repository" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> Back to Research Repository
      </Link>

      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-2">
            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">
              {resource.resourceType}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
              statusColors[resource.dataStatus] || statusColors.SAMPLE
            }`}>
              {resource.dataStatus}
            </span>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Bookmark className="w-3.5 h-3.5" /> Save / Bookmark
          </Button>
        </div>

        <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-2 leading-snug">
          {resource.title}
        </h1>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          {resource.authors.join(', ')} ({resource.publicationYear || 'N/A'}) — {resource.organization}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Source / Provider</span>
              <p className="text-xs text-slate-800 font-medium">{resource.source}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Publication Year</span>
              <p className="text-xs text-slate-800 font-medium">{resource.publicationYear || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Globe className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Geographic Scope</span>
              <p className="text-xs text-slate-800 font-medium">
                {resource.state || 'N/A'}
                {resource.district && `, ${resource.district}`}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck className={`w-4 h-4 mt-0.5 shrink-0 ${
              resource.verificationStatus ? 'text-emerald-500' : 'text-amber-500'
            }`} />
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Verification</span>
              <p className="text-xs text-slate-800 font-medium">
                {resource.verificationStatus ? 'Verified' : 'Unverified'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Abstract Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-3">Abstract / Description</h2>
        <p className="text-sm text-slate-700 leading-relaxed">{resource.abstract}</p>
      </div>

      {/* Keywords & Topics */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-3">Topics & Keywords</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {resource.keywords.map((kw: string) => (
            <span key={kw} className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium">
              {kw}
            </span>
          ))}
        </div>
        <span className="text-xs text-slate-500 font-semibold">Topic: <span className="text-slate-800">{resource.topic}</span></span>
      </div>

      {/* Provenance Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-3">Provenance & Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 font-semibold">Source URL:</span>{' '}
            <a href={resource.sourceUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {resource.sourceUrl || 'N/A'}
            </a>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">Access Level:</span>{' '}
            <span className="text-slate-800">{resource.accessLevel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
