import Link from 'next/link';
import { Sparkles, Calendar, Award } from 'lucide-react';

interface InnovationItem {
  id: string;
  title: string;
  type: string;
  organizer: string;
  deadline: Date;
  status: string;
}

export function InnovationOpportunities({ opportunities }: { opportunities: InnovationItem[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Innovation Opportunities
        </h2>
        <Link href="/research/innovation" className="text-xs font-medium text-blue-600 hover:underline">
          View All Hub →
        </Link>
      </div>

      <div className="space-y-3">
        {opportunities.map((opp) => (
          <div key={opp.id} className="p-3.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-all flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded uppercase">
                {opp.type}
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {opp.status}
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 leading-snug">{opp.title}</h3>
            <p className="text-[11px] text-slate-500">{opp.organizer}</p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Deadline: {new Date(opp.deadline).toLocaleDateString()}
              </span>
              <Link href="/research/innovation" className="text-blue-600 font-semibold hover:underline">
                Apply / Participate →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
