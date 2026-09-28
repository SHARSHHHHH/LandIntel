export function ProjectStatusBadge({ status }: { status: string }) {
  const styles =
    status === 'ACTIVE'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'COMPLETED'
        ? 'bg-blue-100 text-blue-800'
        : status === 'ARCHIVED'
          ? 'bg-slate-100 text-slate-600'
          : 'bg-amber-100 text-amber-800';

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${styles}`}>
      {status}
    </span>
  );
}