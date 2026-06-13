import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import {
  POPULAR_COUNTRIES,
  getMapPresetsForCountry,
  formatPresetSummary,
} from "../mapPresets.js";
import { CountryFlag, getCountryCode } from "../countryFlags.jsx";

export default function CountryPicker({ picked, onPick, large = false }) {
  const [query, setQuery] = useState(picked?.name || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const boxRef = useRef(null);
  const skipSearch = useRef(false);

  const presets = picked ? getMapPresetsForCountry(picked.name) : null;

  useEffect(() => {
    if (picked?.name) setQuery(picked.name);
  }, [picked?.name]);

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { results: r } = await api.geocode(q, { type: "country" });
        setResults(r);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onDoc(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function selectCountry(c) {
    const name = c.name.split(",")[0].trim();
    const code = c.code || c.country_code || getCountryCode(name);
    onPick({ name, lat: c.lat, lng: c.lng, code });
    skipSearch.current = true;
    setQuery(name);
    setResults([]);
    setOpen(false);
  }

  return (
    <div className={`country-picker ${large ? "country-picker-lg" : ""}`}>
      <div className="region-quick-picks">
        <span className="region-quick-label">Popular</span>
        <div className="region-chip-row">
          {POPULAR_COUNTRIES.map((c) => (
            <button
              key={c.name}
              type="button"
              className={`region-chip ${picked?.name === c.name ? "active" : ""}`}
              onClick={() => selectCountry(c)}
            >
              <CountryFlag name={c.name} code={c.code} size="sm" />
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <label className="geo-search-label">Country</label>
      <div className="geo-search geo-search-lg" ref={boxRef}>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (picked) onPick(null);
          }}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Search any country…"
          autoComplete="off"
        />
        {searching && <span className="geo-spinner" aria-hidden />}
        {open && results.length > 0 && (
          <ul className="geo-dropdown">
            {results.map((r, i) => {
              const parts = r.name.split(",");
              return (
                <li key={i} onClick={() => selectCountry(r)}>
                  <CountryFlag name={parts[0]} code={r.country_code} size="sm" />
                  <span className="geo-text">
                    <span className="geo-primary">{parts[0]}</span>
                    {parts.length > 1 && (
                      <span className="geo-secondary">{parts.slice(1).join(",").trim()}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {presets && (
        <div className="region-preset-preview">
          <div className="region-preset-head">
            <CountryFlag name={picked.name} code={picked.code} size="lg" className="region-preset-flag" />
            <div>
              <div className="region-preset-country">{picked.name}</div>
              <h3>Map presets</h3>
            </div>
          </div>
          <ul className="region-preset-list">
            {formatPresetSummary(presets).map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
          <p className="muted small">You can change these anytime from the map controls.</p>
        </div>
      )}
    </div>
  );
}
