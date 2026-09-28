export function Footer() {
  return (
    <footer className="border-t bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold">BhumiKosh</p>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              A public knowledge ecosystem for research, policy innovation and
              evidence-based land governance in India.
            </p>
          </div>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span>Demo build for SIH 2026 · DoLR</span>
            <span>Data is illustrative sample</span>
          </div>
        </div>
      </div>
    </footer>
  );
}