import { getDatabase, mapResource } from '@/lib/research/db';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/research/layout/AppShell';
import { ResourceDetail } from '@/components/research/repository/ResourceDetail';

export default async function ResourceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const db = getDatabase();
  const row = db.prepare('SELECT * FROM research_resources WHERE id = ?').get(id) as any;
  const resource = mapResource(row);

  if (!resource) {
    notFound();
  }

  return (
    <AppShell>
      <div className="py-8">
        <ResourceDetail resource={resource} />
      </div>
    </AppShell>
  );
}
