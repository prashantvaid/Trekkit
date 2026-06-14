import { useEffect, useId, useRef, useState } from "react";
import {
  addMonths,
  buildCalendarGrid,
  compareIso,
  formatDisplayDate,
  isMonthDisabled,
  isYearDisabled,
  MONTHS_LONG,
  MONTHS_SHORT,
  parseIsoDate,
  toIsoDate,
  todayIso,
  yearPageStartFor,
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
  const [panel, setPanel] = useState("days");
  const [view, setView] = useState(() =>
    parsed ? { year: parsed.year, month: parsed.month } : { year: today.year, month: today.month }
  );
  const [yearPageStart, setYearPageStart] = useState(() => yearPageStartFor(view.year));

  useEffect(() => {
    if (parsed) {
      setView({ year: parsed.year, month: parsed.month });
      setYearPageStart(yearPageStartFor(parsed.year));
    }
  }, [value]);

  useEffect(() => {
    if (!open) setPanel("days");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") {
        if (panel !== "days") setPanel("days");
        else setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, panel]);

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

  function openMonths() {
    setPanel("months");
  }

  function openYears() {
    setYearPageStart(yearPageStartFor(view.year));
    setPanel("years");
  }

  function selectMonth(month) {
    if (isMonthDisabled(view.year, month, min, max)) return;
    setView((v) => ({ ...v, month }));
    setPanel("days");
  }

  function selectYear(year) {
    if (isYearDisabled(year, min, max)) return;
    setView((v) => ({ year, month: v.month }));
    setPanel("months");
  }

  function shiftYearPage(delta) {
    setYearPageStart((start) => {
      const next = start + delta;
      const minP = min ? parseIsoDate(min) : null;
      const maxP = max ? parseIsoDate(max) : null;
      if (minP && next + 11 < minP.year) return start;
      if (maxP && next > maxP.year) return start;
      return next;
    });
  }

  const cells = buildCalendarGrid(view.year, view.month);
  const display = value ? formatDisplayDate(value, displayStyle) : "";
  const yearOptions = Array.from({ length: 12 }, (_, i) => yearPageStart + i);

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
          {panel === "days" && (
            <>
              <div className="date-picker-nav">
                <button type="button" className="date-picker-nav-btn" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
                  ‹
                </button>
                <div className="date-picker-caption">
                  <button type="button" className="date-picker-caption-part" onClick={openMonths}>
                    {MONTHS_LONG[view.month]}
                  </button>
                  <button type="button" className="date-picker-caption-part" onClick={openYears}>
                    {view.year}
                  </button>
                </div>
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
            </>
          )}

          {panel === "months" && (
            <>
              <div className="date-picker-nav">
                <button type="button" className="date-picker-panel-back" onClick={() => setPanel("days")}>
                  ← Days
                </button>
                <button type="button" className="date-picker-caption-part date-picker-caption-year" onClick={openYears}>
                  {view.year}
                </button>
                <span className="date-picker-nav-spacer" aria-hidden />
              </div>
              <div className="date-picker-month-grid">
                {MONTHS_SHORT.map((name, month) => {
                  const disabled = isMonthDisabled(view.year, month, min, max);
                  const selected = view.month === month;
                  return (
                    <button
                      key={name}
                      type="button"
                      className={[
                        "date-picker-month-cell",
                        selected && "selected",
                        disabled && "disabled",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      disabled={disabled}
                      onClick={() => selectMonth(month)}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {panel === "years" && (
            <>
              <div className="date-picker-nav">
                <button
                  type="button"
                  className="date-picker-nav-btn"
                  aria-label="Previous years"
                  onClick={() => shiftYearPage(-12)}
                >
                  ‹‹
                </button>
                <p className="date-picker-year-range">
                  {yearPageStart} – {yearPageStart + 11}
                </p>
                <button
                  type="button"
                  className="date-picker-nav-btn"
                  aria-label="Next years"
                  onClick={() => shiftYearPage(12)}
                >
                  ››
                </button>
              </div>
              <div className="date-picker-year-grid">
                {yearOptions.map((year) => {
                  const disabled = isYearDisabled(year, min, max);
                  const selected = view.year === year;
                  return (
                    <button
                      key={year}
                      type="button"
                      className={[
                        "date-picker-year-cell",
                        selected && "selected",
                        disabled && "disabled",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      disabled={disabled}
                      onClick={() => selectYear(year)}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
              <button type="button" className="date-picker-panel-back date-picker-panel-back-block" onClick={() => setPanel("months")}>
                ← Pick month
              </button>
            </>
          )}

          <div className="date-picker-footer">
            <button
              type="button"
              className="date-picker-footer-btn"
              onClick={() => {
                const t = todayIso();
                if (!max || compareIso(t, max) <= 0) {
                  if (!min || compareIso(t, min) >= 0) {
                    onChange?.(t);
                    const p = parseIsoDate(t);
                    if (p) setView({ year: p.year, month: p.month });
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
