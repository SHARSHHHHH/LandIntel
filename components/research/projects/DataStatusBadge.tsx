export function DataStatusBadge({ dataStatus }: { dataStatus: string }) {
  const styles =
    dataStatus === 'REAL'
      ? 'bg-emerald-100 text-emerald-800'
      : dataStatus === 'DERIVED'
        ? 'bg-purple-100 text-purple-800'
        : 'bg-amber-100 text-amber-800';

  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${styles}`}>
      {dataStatus}
    </span>
  );
}