import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import PlannerResultCard from "./PlannerResultCard.jsx";
import { buildFlightLinks, flightItineraryItem } from "../../planner/travelLinks.js";

export default function FlightsSearchPanel({ plan, onPick }) {
  const [origin, setOrigin] = useState(plan?.origin?.cityCode || plan?.origin?.name || "");
  const [destination, setDestination] = useState(plan?.destination?.cityCode || plan?.destination?.name || "");
  const [depart, setDepart] = useState(plan?.dates?.start || "");
  const [returnDate, setReturnDate] = useState(plan?.dates?.end || "");
  const [adults, setAdults] = useState(plan?.travelers || 1);
  const [nonStop, setNonStop] = useState(false);
  const [travelClass, setTravelClass] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [sandbox, setSandbox] = useState(false);
  const [originCode, setOriginCode] = useState("");
  const [destCode, setDestCode] = useState("");

  const externalLinks = useMemo(() => {
    if (!origin.trim() || !destination.trim() || !depart) return [];
    return buildFlightLinks({
      origin: originCode || origin.trim(),
      destination: destCode || destination.trim(),
      depart,
      returnDate: returnDate || undefined,
      adults,
    });
  }, [origin, destination, depart, returnDate, adults, originCode, destCode]);

  const runSearch = useCallback(async () => {
    if (!origin.trim() || !destination.trim() || !depart) {
      setError("Origin, destination, and departure date are required.");
      return;
    }
    setLoading(true);
    setError("");
    setNote("");
    setSandbox(false);
    try {
      const data = await api.plannerFlights({
        origin: origin.trim(),
        destination: destination.trim(),
        date: depart,
        returnDate: returnDate || undefined,
        adults,
        nonStop,
        travelClass: travelClass || undefined,
        maxPrice: maxPrice || undefined,
      });
      setResults(data.results || []);
      setSandbox(Boolean(data.sandbox));
      setOriginCode(data.originCode || "");
      setDestCode(data.destCode || "");
      if (data.error) setError(data.error);
      if (data.note) setNote(data.note);
    } catch (e) {
      setError(e.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [origin, destination, depart, returnDate, adults, nonStop, travelClass, maxPrice]);

  useEffect(() => {
    if (origin && destination && depart) runSearch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function saveRouteToItinerary() {
    const item = flightItineraryItem({
      origin: originCode || origin.trim(),
      destination: destCode || destination.trim(),
      depart,
      returnDate: returnDate || undefined,
    });
    onPick?.({
      title: item.title,
      subtitle: item.subtitle,
      price: null,
      meta: item.meta,
    });
  }

  return (
    <div className="planner-search-panel">
      <form
        className="planner-search-filters card"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
      >
        <div className="planner-search-filter-grid">
          <label>
            From
            <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="City or airport code" />
          </label>
          <label>
            To
            <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="City or airport code" />
          </label>
          <label>
            Depart
            <input type="date" value={depart} onChange={(e) => setDepart(e.target.value)} />
          </label>
          <label>
            Return
            <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
          </label>
          <label>
            Travelers
            <select value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            Cabin
            <select value={travelClass} onChange={(e) => setTravelClass(e.target.value)}>
              <option value="">Any</option>
              <option value="ECONOMY">Economy</option>
              <option value="PREMIUM_ECONOMY">Premium economy</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRST">First</option>
            </select>
          </label>
          <label>
            Max price
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="USD"
            />
          </label>
          <label className="planner-search-checkbox">
            <input type="checkbox" checked={nonStop} onChange={(e) => setNonStop(e.target.checked)} />
            Non-stop only
          </label>
        </div>
        <button type="submit" className="btn-primary planner-search-submit" disabled={loading}>
          {loading ? "Searching…" : "Search flights"}
        </button>
      </form>

      {error && <div className="error small">{error}</div>}
      {note && !error && <p className="planner-flight-notice">{note}</p>}

      {(sandbox || (!loading && !results.length && externalLinks.length > 0)) && (
        <section className="planner-flight-external card">
          <h3 className="planner-section-title">Search real flights</h3>
          <p className="muted small">
            Live airline prices from trusted booking sites
            {originCode && destCode ? ` (${originCode} → ${destCode})` : ""}.
          </p>
          <div className="planner-flight-links">
            {externalLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="planner-flight-link"
              >
                <strong>{link.title}</strong>
                <span className="muted small">{link.subtitle}</span>
                <span className="planner-flight-link-go">Open →</span>
              </a>
            ))}
          </div>
          {onPick && (
            <button type="button" className="btn-secondary planner-flight-save" onClick={saveRouteToItinerary}>
              Save this route to itinerary
            </button>
          )}
        </section>
      )}

      {!sandbox && results.length > 0 && (
        <div className="planner-search-results">
          {results.map((r) => (
            <PlannerResultCard key={r.id || r.title} item={r} onSelect={onPick} actionLabel="Add flight" />
          ))}
        </div>
      )}

      {!loading && !sandbox && !results.length && !error && !externalLinks.length && (
        <p className="muted small planner-search-empty">No flights found — try city names or airport codes (e.g. JFK, CDG).</p>
      )}
    </div>
  );
}
