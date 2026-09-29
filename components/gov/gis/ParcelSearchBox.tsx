"use client";

import { useState } from "react";
import { api, type GisSearchResultOut } from "@/lib/gov/client";

const MATCH_LABEL: Record<GisSearchResultOut["matchedOn"], string> = {
  survey_number: "Survey/Khasra/Patta No.",
  village_name: "Village",
  owner_name: "Owner",
  record_id: "Record ID",
};

export function ParcelSearchBox({ onLocate }: { onLocate: (result: GisSearchResultOut) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GisSearchResultOut[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await api.searchParcels(query.trim());
      setResults(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-sm border border-register-line bg-register-panel p-4">
      <h3 className="font-serif-display text-base font-semibold text-register-navy">Search land records</h3>
      <p className="mt-1 text-xs text-register-ink/60">
        Survey/Khasra/Patta/Parcel number, village name, owner name, or record ID &mdash; across sample-covered districts.
      </p>
      <form onSubmit={runSearch} className="mt-3 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Sharma, Mahapura, 214/A..."
          className="w-full rounded-sm border border-register-line px-2 py-1.5 text-sm"
        />
        <button
          type="submit"
          className="shrink-0 rounded-sm border border-register-navy bg-register-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-register-navy/90"
        >
          Search
        </button>
      </form>

      {loading && <p className="mt-3 text-xs text-register-ink/50">Searching...</p>}

      {results !== null && !loading && (
        <ul className="mt-3 max-h-56 space-y-1.5 overflow-y-auto">
          {results.length === 0 && <p className="text-xs text-register-ink/50">No matching parcels found.</p>}
          {results.map((r) => (
            <li key={r.parcelId}>
              <button
                onClick={() => onLocate(r)}
                className="w-full rounded-sm border border-register-line px-2.5 py-1.5 text-left text-xs transition-colors hover:border-register-navy/40"
              >
                <p className="font-medium text-register-navy">{r.surveyNumber}</p>
                <p className="text-register-ink/60">
                  {r.villageName} &middot; {r.ownerNames.join(", ")}
                </p>
                <p className="text-[10px] text-register-ink/40">
                  matched on {MATCH_LABEL[r.matchedOn]} &middot; {r.recordId}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
