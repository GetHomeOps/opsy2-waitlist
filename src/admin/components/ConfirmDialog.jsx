export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-forest-deep/30"
        aria-label="Close"
        disabled={busy}
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative z-10 w-full max-w-[400px] rounded-2xl border border-[#e6e0d4] bg-[#fbfaf6] p-5 shadow-[0_18px_40px_rgba(24,55,47,0.16)]"
      >
        <h2 id="confirm-title" className="font-serif text-2xl font-semibold text-forest-deep">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-forest-deep/70">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-xl px-3 py-2 text-sm font-medium text-forest-deep/70 hover:text-forest-deep disabled:opacity-50"
          >
            Keep
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`rounded-xl px-3.5 py-2 text-sm font-semibold text-cream disabled:opacity-50 ${
              danger ? "bg-[#8b4a42] hover:bg-[#7a3f38]" : "bg-forest hover:bg-forest-mid"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
