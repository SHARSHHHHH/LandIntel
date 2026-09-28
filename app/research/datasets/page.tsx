import { getDatabase, mapDataset } from '@/lib/research/db';
import { AppShell } from '@/components/research/layout/AppShell';
import { DatasetCard } from '@/components/research/datasets/DatasetCard';
import { DatasetFilters } from '@/components/research/datasets/DatasetFilters';
import { Database } from 'lucide-react';

export default async function DatasetsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { search, provider, type, geographicScope, qualityStatus, dataStatus, sort } = searchParams;

  const SORTABLE_FIELDS: Record<string, string> = {
    createdAt: 'created_at',
    name: 'name',
    provider: 'provider',
    type: 'type',
    geographicScope: 'geographic_scope',
    qualityStatus: 'quality_status',
    dataStatus: 'data_status',
  };

  const conditions: string[] = [];
  const args: any[] = [];
  if (search) {
    const like = `%${search.toLowerCase()}%`;
    conditions.push(
      '(LOWER(name) LIKE ? OR LOWER(variables) LIKE ? OR LOWER(geographic_scope) LIKE ? OR LOWER(provider) LIKE ?)'
    );
    args.push(like, like, like, like);
  }
  if (provider) {
    conditions.push('provider = ?');
    args.push(provider);
  }
  if (type) {
    conditions.push('type = ?');
    args.push(type);
  }
  if (geographicScope) {
    conditions.push('LOWER(geographic_scope) LIKE ?');
    args.push(`%${geographicScope.toLowerCase()}%`);
  }
  if (qualityStatus) {
    conditions.push('quality_status = ?');
    args.push(qualityStatus);
  }
  if (dataStatus) {
    conditions.push('data_status = ?');
    args.push(dataStatus);
  }

  const [field, direction] = sort ? sort.split(':') : ['createdAt', 'desc'];
  const column = SORTABLE_FIELDS[field] || 'created_at';
  const dir = direction === 'asc' ? 'ASC' : 'DESC';
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const db = getDatabase();
  const rows = db
    .prepare(`SELECT * FROM datasets ${where} ORDER BY ${column} ${dir} LIMIT 50`)
    .all(...args) as any[];
  const datasets = rows.map(mapDataset).filter((d): d is NonNullable<typeof d> => d !== null);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" /> Dataset Explorer
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Discover verified land-use, satellite, socioeconomic, and GIS datasets with transparent quality status.
          </p>
        </div>

        {/* Filters */}
        <DatasetFilters />

        {/* Results Count & List */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              Results: <span className="text-blue-600">{datasets.length}</span> datasets found
            </h2>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              SAMPLE DATA
            </span>
          </div>

          {datasets.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Database className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-semibold text-slate-800">No datasets found</h3>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {datasets.map((ds) => (
                <DatasetCard key={ds.id} dataset={ds} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}