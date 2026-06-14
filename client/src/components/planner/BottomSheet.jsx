import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function BottomSheet({ open, onClose, title, children, tall = false }) {
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
    <div className="bottom-sheet-root" role="presentation">
      <button type="button" className="bottom-sheet-backdrop" aria-label="Close" onClick={onClose} />
      <div
        className={`bottom-sheet-panel${tall ? " bottom-sheet-panel-tall" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="bottom-sheet-handle" aria-hidden />
        {title && (
          <header className="bottom-sheet-head">
            <h3>{title}</h3>
            <button type="button" className="bottom-sheet-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </header>
        )}
        <div className="bottom-sheet-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
