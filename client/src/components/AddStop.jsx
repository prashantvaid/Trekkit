import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";

function fmtCoords(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function categoryLabel(type) {
  if (!type) return null;
  return type.replace(/_/g, " ");
}

// Itinerary builder: POI-aware search with live map preview and coordinates.
export default function AddStop({ tripId, nextDay = 1, onAdded, onDraftChange, bias = null }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);
  const [day, setDay] = useState(nextDay);
  const [notes, setNotes] = useState("");
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const boxRef = useRef(null);
  const skipNextRef = useRef(false);

  useEffect(() => setDay(nextDay), [nextDay]);

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
    skipNextRef.current = true;
    setQuery(shortName);
    setResults([]);
    setOpen(false);
    onDraftChange?.({
      name: shortName,
      lat: r.lat,
      lng: r.lng,
      place_type: r.category || r.type || null,
    });
  }

  function reset(clearDraft = true) {
    setQuery("");
    setResults([]);
    setPicked(null);
    setNotes("");
    if (clearDraft) onDraftChange?.(null);
  }

  async function addStop() {
    if (!picked) return;
    setBusy(true);
    setError("");
    try {
      await api.addStop(tripId, {
        name: picked.shortName || picked.name,
        lat: picked.lat,
        lng: picked.lng,
        place_type: picked.category || picked.type || null,
        day: Number(day) || null,
        notes: notes || null,
      });
      reset();
      setDay((d) => Number(d) + 1);
      onAdded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const searchOpen = open && results.length > 0;

  return (
    <div className={`add-stop${searchOpen ? " is-search-open" : ""}`}>
      <div className="add-stop-head">
        <h3>Add a stop</h3>
        <p className="muted small">Search landmarks, addresses, or cities — coordinates appear as you pick.</p>
      </div>

      <label className="geo-search-label">Location</label>
      <div className="geo-search geo-search-lg" ref={boxRef}>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (picked) setPicked(null);
          }}
          onFocus={() => results.length && setOpen(true)}
          placeholder="e.g. Tokyo Tower, Shibuya Crossing"
          autoComplete="off"
        />
        {searching && <span className="geo-spinner" aria-hidden />}
        {open && results.length > 0 && (
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

      {picked && (
        <div className="picked">
          <div className="picked-row">
            <span className="picked-badge">Selected</span>
            <span className="picked-name">{picked.name}</span>
          </div>
          <div className="picked-coords">
            <span className="picked-coords-label">Coordinates</span>
            <code>{fmtCoords(picked.lat, picked.lng)}</code>
            {picked.category && <span className="picked-type">{categoryLabel(picked.category)}</span>}
          </div>
          <div className="picked-fields">
            <label className="day-field">Day
              <input type="number" min="1" value={day} onChange={(e) => setDay(e.target.value)} />
            </label>
            <label className="notes-field">Notes
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What happened here?"
              />
            </label>
          </div>
          <div className="picked-actions">
            <button className="btn-secondary" type="button" onClick={() => reset()}>Cancel</button>
            <button className="btn-primary btn-lg" type="button" onClick={addStop} disabled={busy}>
              {busy ? "Adding…" : "Add to itinerary"}
            </button>
          </div>
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
}
