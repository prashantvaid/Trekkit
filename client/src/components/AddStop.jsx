import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api.js";
import { TRANSPORT_MODES, transportRouteColors } from "../transportModes.js";
import TransportIcon from "./TransportIcon.jsx";
import {
  defaultDayForNewStop,
  maxTripDay,
  tripDayNumbers,
} from "../itineraryUtils.js";

function fmtCoords(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function categoryLabel(type) {
  if (!type) return null;
  return type.replace(/_/g, " ");
}

// Two-step add stop: search in one card, day/transport/notes in a second card.
export default function AddStop({ tripId, stops = [], compact = false, onAdded, onDraftChange, onConfiguringChange, bias = null }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);
  const [day, setDay] = useState(1);
  const [isNewDay, setIsNewDay] = useState(false);
  const [transportMode, setTransportMode] = useState("car");
  const [notes, setNotes] = useState("");
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const boxRef = useRef(null);
  const skipNextRef = useRef(false);

  const lastStop = stops.at(-1) || null;
  const existingDays = useMemo(() => tripDayNumbers(stops), [stops]);
  const needsTransport = stops.length > 0;
  const configuring = Boolean(picked);
  const searchOpen = open && results.length > 0;
  const dayNum = Number(day) || 1;
  const nextDayNum = maxTripDay(stops) + 1 || (existingDays.length ? existingDays.at(-1) + 1 : 1);

  useEffect(() => {
    onConfiguringChange?.(configuring);
  }, [configuring, onConfiguringChange]);

  useEffect(() => {
    return () => onConfiguringChange?.(false);
  }, [onConfiguringChange]);

  useEffect(() => {
    if (!picked) return;
    onDraftChange?.({
      name: picked.shortName || picked.name,
      lat: picked.lat,
      lng: picked.lng,
      place_type: picked.category || picked.type || null,
      transport_mode: needsTransport ? transportMode : null,
    });
  }, [picked, transportMode, needsTransport, onDraftChange]);

  useEffect(() => {
    setDay(defaultDayForNewStop(stops));
    setIsNewDay(false);
  }, [stops.length, stops.at(-1)?.id, stops.at(-1)?.day]);

  useEffect(() => {
    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      setError("");
      try {
        const opts = {};
        if (bias?.lat != null && bias?.lng != null) {
          opts.lat = bias.lat;
          opts.lng = bias.lng;
        }
        const { results: found } = await api.geocode(q, opts);
        setResults(found);
        setOpen(true);
      } catch (err) {
        setError(err.message);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, bias?.lat, bias?.lng]);

  useEffect(() => {
    function onDoc(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(r) {
    const shortName = r.primary || r.name.split(",")[0];
    const next = { ...r, shortName };
    setPicked(next);
    setError("");
    skipNextRef.current = true;
    setQuery(shortName);
    setResults([]);
    setOpen(false);
    onDraftChange?.({
      name: shortName,
      lat: r.lat,
      lng: r.lng,
      place_type: r.category || r.type || null,
      transport_mode: needsTransport ? transportMode : null,
    });
  }

  function reset(clearDraft = true) {
    setQuery("");
    setResults([]);
    setPicked(null);
    setNotes("");
    setError("");
    if (clearDraft) onDraftChange?.(null);
  }

  function selectDay(d, newDay = false) {
    setDay(d);
    setIsNewDay(newDay);
    if (newDay && lastStop) {
      const prevDay = lastStop.day != null ? Number(lastStop.day) : 1;
      if (d > prevDay) setTransportMode("plane");
    }
  }

  function startNewDay() {
    selectDay(nextDayNum, true);
  }

  async function addStop() {
    if (!picked) return;
    if (needsTransport && !transportMode) {
      setError("Choose how you traveled from the previous stop.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.addStop(tripId, {
        name: picked.shortName || picked.name,
        lat: picked.lat,
        lng: picked.lng,
        place_type: picked.category || picked.type || null,
        day: Number(day) || 1,
        notes: notes || null,
        transport_mode: needsTransport ? transportMode : null,
      });
      reset();
      onAdded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`add-stop-stack${searchOpen ? " is-search-open" : ""}${compact ? " add-stop-compact" : ""}`}>
      {!configuring && (
        <div className="card builder-card add-stop-search-card">
          <div className="add-stop-head">
            <h3>{compact ? "Add stop" : "Add a stop"}</h3>
            {!compact && (
              <p className="muted small">Search for a place — you&apos;ll configure the day next.</p>
            )}
          </div>

          <label className="geo-search-label">Location</label>
          <div className="geo-search geo-search-lg" ref={boxRef}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length && setOpen(true)}
              placeholder="e.g. Tokyo Tower, Shibuya Crossing"
              autoComplete="off"
            />
            {searching && <span className="geo-spinner" aria-hidden />}
            {searchOpen && (
              <ul className="geo-dropdown geo-dropdown-rich">
                {results.map((r, i) => (
                  <li key={`${r.lat}-${r.lng}-${i}`} onClick={() => pick(r)}>
                    <span className="geo-pin" aria-hidden>📍</span>
                    <span className="geo-text">
                      <span className="geo-primary">{r.primary || r.name.split(",")[0]}</span>
                      {(r.secondary || r.name.includes(",")) && (
                        <span className="geo-secondary">{r.secondary || r.name.split(",").slice(1).join(",").trim()}</span>
                      )}
                      {r.category && <span className="geo-type">{categoryLabel(r.category)}</span>}
                    </span>
                    <span className="geo-coords">{fmtCoords(r.lat, r.lng)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <div className="error">{error}</div>}
        </div>
      )}

      {configuring && picked && (
        <div className="card builder-card add-stop-config-card">
          <div className="add-stop-config-head">
            <button type="button" className="link-btn small add-stop-back" onClick={() => reset()}>
              ← Change place
            </button>
            <div className="add-stop-config-place">
              <span className="picked-badge">Selected</span>
              <strong>{picked.shortName || picked.name}</strong>
              {picked.category && (
                <span className="tag tag-muted">{categoryLabel(picked.category)}</span>
              )}
            </div>
          </div>

          <div className="add-stop-config-section">
            <span className="picked-section-label">Which day?</span>
            <div className="day-picker">
              {existingDays.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`day-chip${dayNum === d && !isNewDay ? " active" : ""}`}
                  onClick={() => selectDay(d, false)}
                >
                  Day {d}
                </button>
              ))}
              <button
                type="button"
                className={`day-chip day-chip-new${isNewDay ? " active" : ""}`}
                onClick={startNewDay}
              >
                + Day {nextDayNum}
              </button>
            </div>
          </div>

          {needsTransport && (
            <div className="add-stop-config-section">
              <span className="picked-section-label">
                {isNewDay ? "How did you get here?" : "From previous stop"}
              </span>
              <p className="muted small transport-color-hint">Colors match your route on the map and globe.</p>
              <div className="transport-picker transport-picker-compact">
                {TRANSPORT_MODES.map((m) => {
                  const colors = transportRouteColors(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={`transport-chip transport-chip-compact transport-chip-colored${transportMode === m.id ? " active" : ""}`}
                      style={{
                        "--transport-color": colors.line,
                        "--transport-bg": colors.bg,
                      }}
                      onClick={() => setTransportMode(m.id)}
                      title={m.label}
                    >
                      <span className="transport-chip-swatch" aria-hidden />
                      <span className="transport-chip-icon" aria-hidden>
                        <TransportIcon mode={m.id} size={16} />
                      </span>
                      <span className="transport-chip-label">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="add-stop-config-section">
            <label className="notes-field add-stop-notes-field">
              Notes <span className="muted small">(optional)</span>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What happened here?"
              />
            </label>
          </div>

          <div className="add-stop-config-actions">
            <button className="btn-secondary" type="button" onClick={() => reset()}>Cancel</button>
            <button className="btn-primary" type="button" onClick={addStop} disabled={busy}>
              {busy ? "Adding…" : `Add to Day ${dayNum}`}
            </button>
          </div>

          {error && <div className="error">{error}</div>}
        </div>
      )}
    </div>
  );
}
