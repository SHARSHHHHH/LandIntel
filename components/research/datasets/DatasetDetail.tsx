import { Building2, Calendar, Globe, ShieldCheck, FileText, ArrowLeft, Database, Hash, MapPin, Clock, Tag, Link2 } from 'lucide-react';
import Link from 'next/link';

interface DatasetDetailProps {
  dataset: any;
}

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

export function DatasetDetail({ dataset }: DatasetDetailProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Link */}
      <Link href="/research/datasets" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> Back to Dataset Explorer
      </Link>

      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">
              {dataset.type}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${dataStatusColors[dataset.dataStatus as keyof typeof dataStatusColors] || dataStatusColors.SAMPLE}`}>
              {dataset.dataStatus}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${qualityColors[dataset.qualityStatus as keyof typeof qualityColors] || qualityColors.UNKNOWN}`}>
              {dataset.qualityStatus}
            </span>
          </div>
        </div>

        <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-2 leading-snug">
          {dataset.name}
        </h1>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          <Building2 className="inline w-3.5 h-3.5 mr-1" /> Provider: {dataset.provider}
        </p>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetadataField icon={Database} label="Dataset Type" value={dataset.type} />
        <MetadataField icon={MapPin} label="Geographic Scope" value={dataset.geographicScope} />
        <MetadataField icon={Calendar} label="Temporal Scope" value={dataset.temporalScope || 'N/A'} />
        <MetadataField icon={FileText} label="Format" value={dataset.format} />
        <MetadataField icon={Hash} label="Variables" value={dataset.variables.length > 0 ? dataset.variables.join(', ') : 'N/A'} />
        <MetadataField icon={Clock} label="Update Frequency" value={dataset.updateFrequency || 'N/A'} />
        <MetadataField icon={Tag} label="Version" value={dataset.version} />
        <MetadataField icon={Globe} label="CRS / Projection" value={dataset.crs || 'N/A'} />
        <MetadataField icon={MapPin} label="Spatial Resolution" value={dataset.spatialResolution || 'N/A'} />
        <MetadataField icon={ShieldCheck} label="License / Access" value={dataset.licenseAccess} />
        <MetadataField icon={Link2} label="Source URL" value={<a href={dataset.sourceUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{dataset.sourceUrl || 'N/A'}</a>} />
      </div>

      {/* Quality & Provenance Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Quality & Provenance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Data Provenance</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${dataStatusColors[dataset.dataStatus as keyof typeof dataStatusColors] || dataStatusColors.SAMPLE}`}>
                  {dataset.dataStatus}
                </span>
                <span className="text-slate-600">
                  {dataset.dataStatus === 'REAL' && 'Verified real data from authoritative source'}
                  {dataset.dataStatus === 'SAMPLE' && 'Sample/Demo data - not official government data'}
                  {dataset.dataStatus === 'DERIVED' && 'Derived/computed from other datasets'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Quality Status</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${qualityColors[dataset.qualityStatus as keyof typeof qualityColors] || qualityColors.UNKNOWN}`}>
                  {dataset.qualityStatus}
                </span>
                <span className="text-slate-600">
                  {dataset.qualityStatus === 'VERIFIED' && 'Data has been verified against authoritative sources'}
                  {dataset.qualityStatus === 'PARTIALLY_VERIFIED' && 'Data has been partially verified'}
                  {dataset.qualityStatus === 'UNVERIFIED' && 'Data has not been independently verified'}
                  {dataset.qualityStatus === 'UNKNOWN' && 'Verification status is unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Variables Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-3">Variables</h2>
        <div className="flex flex-wrap gap-2">
          {dataset.variables.map((v: string) => (
            <span key={v} className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium">
              {v}
            </span>
          ))}
        </div>
      </div>

      {/* Provenance Details */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-3">Provenance & Access Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 font-semibold">Source URL:</span>{' '}
            <a href={dataset.sourceUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
              {dataset.sourceUrl || 'N/A'}
            </a>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">License / Access:</span>{' '}
            <span className="text-slate-800">{dataset.licenseAccess}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">Version:</span>{' '}
            <span className="text-slate-800">{dataset.version}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">Created:</span>{' '}
            <span className="text-slate-800">{new Date(dataset.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetadataField({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{label}</span>
          <p className="text-xs text-slate-800 font-medium mt-0.5 break-all">{typeof value === 'object' ? value : value}</p>
        </div>
      </div>
    </div>
  );
}