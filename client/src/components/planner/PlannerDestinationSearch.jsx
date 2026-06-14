import { useEffect, useRef, useState } from "react";
import { api } from "../../api.js";

export default function PlannerDestinationSearch({ value, onChange, label = "Destination", placeholder }) {
  const [query, setQuery] = useState(value?.name || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    setQuery(value?.name || "");
  }, [value?.name]);

  useEffect(() => {
    function onDoc(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { results: found } = await api.geocode(q);
        setResults(found || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function pick(r) {
    const name = r.primary || r.name.split(",")[0];
    let countryCode = r.country_code || null;
    if (!countryCode && /japan|tokyo|kyoto|osaka|jp/i.test(r.name || r.secondary || "")) {
      countryCode = "JP";
    }
    onChange?.({
      name,
      lat: r.lat,
      lng: r.lng,
      countryCode,
      cityCode: null,
      displayName: r.name,
    });
    setQuery(name);
    setOpen(false);
  }

  return (
    <div className="planner-dest-search" ref={boxRef}>
      <label className="geo-search-label">{label}</label>
      <div className="geo-search geo-search-lg">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value) onChange?.(null);
          }}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder || "Search cities worldwide…"}
          autoComplete="off"
        />
        {searching && <span className="geo-spinner" aria-hidden />}
      </div>
      {open && results.length > 0 && (
        <ul className="geo-dropdown geo-dropdown-rich">
          {results.map((r, i) => (
            <li key={`${r.lat}-${r.lng}-${i}`} onClick={() => pick(r)}>
              <span className="geo-pin" aria-hidden>📍</span>
              <span className="geo-text">
                <span className="geo-primary">{r.primary || r.name.split(",")[0]}</span>
                <span className="geo-secondary">{r.secondary || r.name}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
