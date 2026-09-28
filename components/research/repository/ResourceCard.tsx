import Link from 'next/link';
import { Bookmark, BookOpen, ExternalLink } from 'lucide-react';

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
  publicationDate?: string;
}

interface ResourceCardProps {
  resource: Resource;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">
          {resource.resourceType}
        </span>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
          resource.dataStatus === 'REAL'
            ? 'bg-emerald-100 text-emerald-800'
            : resource.dataStatus === 'DERIVED'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-amber-100 text-amber-800'
        }`}>
          {resource.dataStatus}
        </span>
      </div>

      <Link href={`/research/repository/${resource.id}`}>
        <h3 className="text-sm font-bold text-slate-900 leading-snug hover:text-blue-600 cursor-pointer line-clamp-2">
          {resource.title}
        </h3>
      </Link>

      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
        {resource.authors.join(', ')} ({resource.publicationYear || 'N/A'}) — {resource.organization}
      </p>

      <div className="flex flex-wrap gap-1.5 pt-1">
        {resource.keywords.slice(0, 3).map((kw) => (
          <span key={kw} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
            {kw}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
        <span className="text-[10px] text-slate-500 font-medium">
          {resource.state && `${resource.state}`}
          {resource.district && `, ${resource.district}`}
        </span>
        <Link
          href={`/research/repository/${resource.id}`}
          className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
        >
          View Details <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
