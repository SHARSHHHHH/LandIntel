import Link from 'next/link';
import { BookOpen, ExternalLink, Bookmark } from 'lucide-react';

interface ResourceItem {
  id: string;
  title: string;
  authors: string[];
  organization: string | null;
  resourceType: string;
  publicationYear: number | null;
  topic: string;
  dataStatus: string;
}

export function RecentResearch({ resources }: { resources: ResourceItem[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          Recommended Research Resources
        </h2>
        <Link href="/research/repository" className="text-xs font-medium text-blue-600 hover:underline">
          Explore Repository →
        </Link>
      </div>

      <div className="space-y-3">
        {resources.map((res) => (
          <div key={res.id} className="p-3.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-all flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] font-semibold tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                {res.resourceType}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                res.dataStatus === 'REAL' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {res.dataStatus}
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">{res.title}</h3>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
              <span className="truncate">{res.authors.join(', ')} ({res.publicationYear || 'N/A'})</span>
              <span className="font-medium text-slate-700">{res.topic}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
