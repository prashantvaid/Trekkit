import { useEffect, useId, useRef, useState } from "react";
import {
  addMonths,
  buildCalendarGrid,
  compareIso,
  formatDisplayDate,
  MONTHS_LONG,
  parseIsoDate,
  toIsoDate,
  todayIso,
} from "../dateUtils.js";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DatePicker({
  value = "",
  onChange,
  label,
  hint,
  placeholder = "Pick a date",
  min,
  max,
  clearable = true,
  displayStyle = "long",
  className = "",
  id: idProp,
}) {
  const autoId = useId();
  const id = idProp || autoId;
  const rootRef = useRef(null);
  const parsed = parseIsoDate(value);
  const today = parseIsoDate(todayIso());

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() =>
    parsed ? { year: parsed.year, month: parsed.month } : { year: today.year, month: today.month }
  );

  useEffect(() => {
    if (parsed) setView({ year: parsed.year, month: parsed.month });
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function isDisabledCell(cell) {
    const iso = toIsoDate(cell.year, cell.month, cell.day);
    if (min && compareIso(iso, min) < 0) return true;
    if (max && compareIso(iso, max) > 0) return true;
    return false;
  }

  function selectCell(cell) {
    if (isDisabledCell(cell)) return;
    const iso = toIsoDate(cell.year, cell.month, cell.day);
    onChange?.(iso);
    setView({ year: cell.year, month: cell.month });
    setOpen(false);
  }

  function shiftMonth(delta) {
    setView((v) => addMonths(v.year, v.month, delta));
  }

  const cells = buildCalendarGrid(view.year, view.month);
  const display = value ? formatDisplayDate(value, displayStyle) : "";

  return (
    <div className={`date-picker-wrap ${className}`.trim()} ref={rootRef}>
      {label && (
        <label className="date-picker-label" htmlFor={id}>
          {label}
          {hint && <span className="date-picker-hint muted small">{hint}</span>}
        </label>
      )}
      <div className={`date-picker-trigger${value ? " has-value" : ""}`}>
        <button
          id={id}
          type="button"
          className="date-picker-trigger-btn"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="date-picker-icon" aria-hidden>📅</span>
          <span className={display ? "date-picker-value" : "date-picker-placeholder"}>
            {display || placeholder}
          </span>
          <span className={`date-picker-chevron${open ? " open" : ""}`} aria-hidden />
        </button>
        {clearable && value && (
          <button
            type="button"
            className="date-picker-clear"
            aria-label="Clear date"
            onClick={() => onChange?.("")}
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="date-picker-popover" role="dialog" aria-label={label || "Choose date"}>
          <div className="date-picker-nav">
            <button type="button" className="date-picker-nav-btn" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
              ‹
            </button>
            <p className="date-picker-month">
              {MONTHS_LONG[view.month]} {view.year}
            </p>
            <button type="button" className="date-picker-nav-btn" aria-label="Next month" onClick={() => shiftMonth(1)}>
              ›
            </button>
          </div>

          <div className="date-picker-weekdays">
            {WEEKDAYS.map((d) => (
              <span key={d} className="date-picker-weekday">{d}</span>
            ))}
          </div>

          <div className="date-picker-grid">
            {cells.map((cell, i) => {
              const iso = toIsoDate(cell.year, cell.month, cell.day);
              const selected = value === iso;
              const isToday =
                today &&
                cell.year === today.year &&
                cell.month === today.month &&
                cell.day === today.day;
              const disabled = isDisabledCell(cell);
              return (
                <button
                  key={`${iso}-${i}`}
                  type="button"
                  className={[
                    "date-picker-day",
                    cell.outside && "outside",
                    selected && "selected",
                    isToday && "today",
                    disabled && "disabled",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={disabled}
                  onClick={() => selectCell(cell)}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="date-picker-footer">
            <button
              type="button"
              className="date-picker-footer-btn"
              onClick={() => {
                const t = todayIso();
                if (!max || compareIso(t, max) <= 0) {
                  if (!min || compareIso(t, min) >= 0) {
                    onChange?.(t);
                    setOpen(false);
                  }
                }
              }}
            >
              Today
            </button>
            {clearable && (
              <button
                type="button"
                className="date-picker-footer-btn muted"
                onClick={() => {
                  onChange?.("");
                  setOpen(false);
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
