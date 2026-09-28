'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';

export function DatasetFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get('search') || '';
  const currentProvider = searchParams.get('provider') || '';
  const currentType = searchParams.get('type') || '';
  const currentQualityStatus = searchParams.get('qualityStatus') || '';
  const currentDataStatus = searchParams.get('dataStatus') || '';

  const handleSearch = (params: Record<string, string>) => {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) urlParams.set(key, value);
    });
    startTransition(() => {
      router.push(`${pathname}?${urlParams.toString()}`);
    });
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters = currentSearch || currentProvider || currentType || currentQualityStatus || currentDataStatus;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          Filters & Search
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-red-600 font-medium flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Global Search */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, variables, provider, scope..."
            defaultValue={currentSearch}
            onChange={(e) => handleSearch({ search: e.target.value, provider: currentProvider, type: currentType, qualityStatus: currentQualityStatus, dataStatus: currentDataStatus })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* Provider Filter */}
        <select
          value={currentProvider}
          onChange={(e) => handleSearch({ search: currentSearch, provider: e.target.value, type: currentType, qualityStatus: currentQualityStatus, dataStatus: currentDataStatus })}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
        >
          <option value="">All Providers</option>
          <option value="Sample Remote Sensing Agency">Sample Remote Sensing Agency</option>
          <option value="Sample Bureau of Economics">Sample Bureau of Economics</option>
          <option value="Sample Cartography Dept">Sample Cartography Dept</option>
          <option value="Sample Remote Sensing Lab">Sample Remote Sensing Lab</option>
        </select>

        {/* Dataset Type */}
        <select
          value={currentType}
          onChange={(e) => handleSearch({ search: currentSearch, provider: currentProvider, type: e.target.value, qualityStatus: currentQualityStatus, dataStatus: currentDataStatus })}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
        >
          <option value="">All Types</option>
          <option value="Satellite/Remote Sensing">Satellite/Remote Sensing</option>
          <option value="Socioeconomic">Socioeconomic</option>
          <option value="Land Use">Land Use</option>
          <option value="Infrastructure">Infrastructure</option>
          <option value="Climate">Climate</option>
        </select>

        {/* Quality Status */}
        <select
          value={currentQualityStatus}
          onChange={(e) => handleSearch({ search: currentSearch, provider: currentProvider, type: currentType, qualityStatus: e.target.value, dataStatus: currentDataStatus })}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
        >
          <option value="">All Quality</option>
          <option value="VERIFIED">VERIFIED</option>
          <option value="PARTIALLY_VERIFIED">PARTIALLY_VERIFIED</option>
          <option value="UNVERIFIED">UNVERIFIED</option>
          <option value="UNKNOWN">UNKNOWN</option>
        </select>

        {/* Data Status */}
        <select
          value={currentDataStatus}
          onChange={(e) => handleSearch({ search: currentSearch, provider: currentProvider, type: currentType, qualityStatus: currentQualityStatus, dataStatus: e.target.value })}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
        >
          <option value="">All Provenance</option>
          <option value="REAL">REAL</option>
          <option value="SAMPLE">SAMPLE</option>
          <option value="DERIVED">DERIVED</option>
        </select>
      </div>
    </div>
  );
}