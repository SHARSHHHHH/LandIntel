export function ContourField({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 600"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      {[...Array(9)].map((_, i) => {
        const r = 40 + i * 34;
        const offsetX = (i % 3) * 14 - 14;
        const offsetY = (i % 2) * 10;
        return (
          <circle
            key={i}
            cx={300 + offsetX}
            cy={260 + offsetY}
            r={r}
            stroke="currentColor"
            strokeWidth={i === 4 ? 1.4 : 1}
            opacity={0.5 - i * 0.045}
          />
        );
      })}
    </svg>
  );
}
