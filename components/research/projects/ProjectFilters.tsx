'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';

export function ProjectFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get('search') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentVisibility = searchParams.get('visibility') || '';

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

  const hasActiveFilters = currentSearch || currentStatus || currentVisibility;

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
        {isPending && (
          <span className="text-xs text-slate-400 animate-pulse">Loading...</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, problem, scope..."
            defaultValue={currentSearch}
            onChange={(e) => handleSearch({ search: e.target.value, status: currentStatus, visibility: currentVisibility })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        <select
          value={currentStatus}
          onChange={(e) => handleSearch({ search: currentSearch, status: e.target.value, visibility: currentVisibility })}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>

        <select
          value={currentVisibility}
          onChange={(e) => handleSearch({ search: currentSearch, status: currentStatus, visibility: e.target.value })}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
        >
          <option value="">All Visibility</option>
          <option value="Public">Public</option>
          <option value="Internal">Internal</option>
          <option value="Restricted">Restricted</option>
        </select>
      </div>
    </div>
  );
}