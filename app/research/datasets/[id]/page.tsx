import { getDatabase, mapDataset } from '@/lib/research/db';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/research/layout/AppShell';
import { DatasetDetail } from '@/components/research/datasets/DatasetDetail';

export default async function DatasetDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const db = getDatabase();
  const row = db.prepare('SELECT * FROM datasets WHERE id = ?').get(id) as any;
  const dataset = mapDataset(row);

  if (!dataset) {
    notFound();
  }

  return (
    <AppShell>
      <div className="py-8">
        <DatasetDetail dataset={dataset} />
      </div>
    </AppShell>
  );
}