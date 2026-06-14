import { useEffect } from "react";
import { createPortal } from "react-dom";

export function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  danger = true,
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="confirm-dialog-root" role="presentation">
      <button type="button" className="confirm-dialog-backdrop" aria-label="Close" onClick={onClose} />
      <div
        className="confirm-dialog-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className={`confirm-dialog-icon${danger ? " confirm-dialog-icon-danger" : ""}`} aria-hidden>
          {danger ? <TrashIcon /> : "?"}
        </div>
        <h2 id="confirm-dialog-title" className="confirm-dialog-title">{title}</h2>
        {message && <p className="confirm-dialog-message">{message}</p>}
        <div className="confirm-dialog-actions">
          <button type="button" className="btn-secondary confirm-dialog-cancel" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? "btn-danger" : "btn-primary"}
            onClick={() => {
              onConfirm?.();
              onClose?.();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
