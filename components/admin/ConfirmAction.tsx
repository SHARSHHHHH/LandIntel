"use client";

interface ConfirmActionProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmAction({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmActionProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-register-ink/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-sm rounded-sm border border-register-line bg-register-panel p-5 shadow-raised">
        <h2 className="font-serif-display text-lg font-semibold text-register-navy">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-register-ink/70">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-sm border border-register-line bg-white px-3 py-1.5 text-sm text-register-ink transition-colors hover:bg-register-bg disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-sm bg-register-navy px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-register-navy2 disabled:opacity-60"
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
