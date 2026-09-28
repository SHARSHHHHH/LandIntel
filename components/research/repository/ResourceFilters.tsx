'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';

export function ResourceFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get('search') || '';
  const currentType = searchParams.get('type') || '';
  const currentState = searchParams.get('state') || '';
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

  const hasActiveFilters = currentSearch || currentType || currentState || currentDataStatus;

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Global Search */}
        <div className="md:col-span-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, abstract, keywords..."
            defaultValue={currentSearch}
            onChange={(e) => handleSearch({ search: e.target.value, type: currentType, state: currentState, dataStatus: currentDataStatus })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* Resource Type */}
        <select
          value={currentType}
          onChange={(e) => handleSearch({ search: currentSearch, type: e.target.value, state: currentState, dataStatus: currentDataStatus })}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
        >
          <option value="">All Resource Types</option>
          <option value="Research Paper">Research Paper</option>
          <option value="Government Report">Government Report</option>
          <option value="Policy Report">Policy Report</option>
          <option value="Case Study">Case Study</option>
          <option value="Legal Document">Legal Document</option>
          <option value="Dataset">Dataset</option>
          <option value="Project Report">Project Report</option>
        </select>

        {/* State Filter */}
        <select
          value={currentState}
          onChange={(e) => handleSearch({ search: currentSearch, type: currentType, state: e.target.value, dataStatus: currentDataStatus })}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
        >
          <option value="">All States</option>
          <option value="Tamil Nadu">Tamil Nadu</option>
          <option value="Kerala">Kerala</option>
          <option value="Karnataka">Karnataka</option>
          <option value="Maharashtra">Maharashtra</option>
          <option value="All India">All India</option>
        </select>

        {/* Data Status */}
        <select
          value={currentDataStatus}
          onChange={(e) => handleSearch({ search: currentSearch, type: currentType, state: currentState, dataStatus: e.target.value })}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
        >
          <option value="">All Statuses</option>
          <option value="REAL">REAL</option>
          <option value="SAMPLE">SAMPLE</option>
          <option value="DERIVED">DERIVED</option>
        </select>
      </div>
    </div>
  );
}
