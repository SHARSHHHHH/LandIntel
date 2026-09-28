import Link from 'next/link';
import { Database, ExternalLink, MapPin } from 'lucide-react';

interface Dataset {
  id: string;
  name: string;
  provider: string;
  type: string;
  geographicScope: string;
  temporalScope: string | null;
  variables: string[];
  format: string;
  spatialResolution: string | null;
  crs: string | null;
  licenseAccess: string;
  sourceUrl: string | null;
  updateFrequency: string | null;
  version: string;
  qualityStatus: string;
  dataStatus: string;
  createdAt: Date;
}

interface DatasetCardProps {
  dataset: Dataset;
}

export function DatasetCard({ dataset }: DatasetCardProps) {
  const qualityColors = {
    VERIFIED: 'bg-emerald-100 text-emerald-800',
    PARTIALLY_VERIFIED: 'bg-amber-100 text-amber-800',
    UNVERIFIED: 'bg-red-100 text-red-800',
    UNKNOWN: 'bg-slate-100 text-slate-700',
  };

  const dataStatusColors = {
    REAL: 'bg-emerald-100 text-emerald-800',
    SAMPLE: 'bg-amber-100 text-amber-800',
    DERIVED: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">
          {dataset.type}
        </span>
        <div className="flex gap-1.5">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${dataStatusColors[dataset.dataStatus as keyof typeof dataStatusColors] || dataStatusColors.SAMPLE}`}>
            {dataset.dataStatus}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${qualityColors[dataset.qualityStatus as keyof typeof qualityColors] || qualityColors.UNKNOWN}`}>
            {dataset.qualityStatus}
          </span>
        </div>
      </div>

      <Link href={`/research/datasets/${dataset.id}`}>
        <h3 className="text-sm font-bold text-slate-900 leading-snug hover:text-blue-600 cursor-pointer line-clamp-2">
          {dataset.name}
        </h3>
      </Link>

      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
        Provider: {dataset.provider}
      </p>

      <div className="flex flex-wrap gap-1.5 pt-1">
        {dataset.variables.slice(0, 4).map((v) => (
          <span key={v} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
            {v}
          </span>
        ))}
        {dataset.variables.length > 4 && (
          <span className="text-[10px] text-slate-400 px-2 py-0.5">
            +{dataset.variables.length - 4} more
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
          <MapPin className="w-3 h-3" />
          {dataset.geographicScope}
        </span>
        <Link
          href={`/research/datasets/${dataset.id}`}
          className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
        >
          View Details <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}