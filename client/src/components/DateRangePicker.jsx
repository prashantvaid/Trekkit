import DatePicker from "./DatePicker.jsx";
import { compareIso } from "../dateUtils.js";

export default function DateRangePicker({
  start = "",
  end = "",
  onChange,
  label = "Trip dates",
  hint,
  max,
  className = "",
}) {
  function setStart(next) {
    const patch = { start: next, end };
    if (next && end && compareIso(end, next) < 0) patch.end = next;
    onChange?.(patch);
  }

  function setEnd(next) {
    onChange?.({ start, end: next });
  }

  return (
    <div className={`date-range-picker ${className}`.trim()}>
      {label && (
        <div className="date-picker-label">
          {label}
          {hint && <span className="date-picker-hint muted small">{hint}</span>}
        </div>
      )}
      <div className="date-range-row">
        <DatePicker
          value={start}
          onChange={setStart}
          placeholder="Start"
          max={end || max}
          displayStyle="short"
          className="date-range-field"
        />
        <span className="date-range-sep" aria-hidden>→</span>
        <DatePicker
          value={end}
          onChange={setEnd}
          placeholder="End"
          min={start || undefined}
          max={max}
          displayStyle="short"
          className="date-range-field"
        />
      </div>
    </div>
  );
}
