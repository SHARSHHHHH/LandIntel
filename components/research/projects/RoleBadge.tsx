export function RoleBadge({ role }: { role: string }) {
  const styles =
    role === 'OWNER'
      ? 'bg-blue-100 text-blue-800'
      : role === 'EDITOR'
        ? 'bg-emerald-100 text-emerald-800'
        : role === 'CONTRIBUTOR'
          ? 'bg-purple-100 text-purple-800'
          : 'bg-slate-100 text-slate-700';

  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${styles}`}>
      {role}
    </span>
  );
}