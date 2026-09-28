export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-sm bg-register-line/50 bg-[length:800px_100%] bg-[linear-gradient(90deg,rgba(220,214,200,0.4)_0%,rgba(220,214,200,0.9)_50%,rgba(220,214,200,0.4)_100%)] ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-sm border border-register-line bg-register-panel p-4">
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="mt-3 h-7 w-1/2" />
      <Skeleton className="mt-4 h-3 w-1/3" />
    </div>
  );
}
