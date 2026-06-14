import { useEffect, useState } from "react";
import { api } from "../../api.js";
import BottomSheet from "./BottomSheet.jsx";
import TransportIcon from "../TransportIcon.jsx";

function ResultCard({ item, onSelect }) {
  return (
    <button type="button" className="planner-result-card" onClick={() => onSelect(item)}>
      {item.image ? (
        <div className="planner-result-photo" style={{ backgroundImage: `url(${item.image})` }} />
      ) : (
        <div className="planner-result-photo planner-result-photo-placeholder" />
      )}
      <div className="planner-result-body">
        <strong>{item.title}</strong>
        {item.subtitle && <span className="muted small">{item.subtitle}</span>}
        <div className="planner-result-meta">
          {item.rating != null && <span>★ {item.rating.toFixed(1)}</span>}
          {item.price != null && (
            <span>
              {item.currency || "USD"} {Number(item.price).toFixed(0)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

const TYPE_CONFIG = {
  hotel: { title: "Find a hotel", searchType: "hotel", icon: "hotel" },
  flight: { title: "Find a flight", searchType: "flight", icon: "flight" },
  restaurant: { title: "Find a restaurant", searchType: "restaurant", icon: "restaurant" },
  activity: { title: "Find an activity", searchType: "activity", icon: "activity" },
};

export default function ActivitySearchSheet({
  open,
  onClose,
  activityType,
  plan,
  dayDate,
  onSelect,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const cfg = TYPE_CONFIG[activityType] || TYPE_CONFIG.activity;
  const dest = plan?.destination;
  const origin = plan?.origin;

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setError("");
      setNote("");
    }
  }, [open]);

  useEffect(() => {
    if (!open || activityType === "note") return;
    const t = setTimeout(() => search(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query, activityType, dayDate]);

  async function search() {
    if (activityType === "note") return;

    setLoading(true);
    setError("");
    setNote("");

    try {
      if (activityType === "hotel") {
        const { results: found, error: err, note: n } = await api.plannerHotels({
          city: dest?.name,
          checkIn: dayDate || plan?.dates?.start,
          checkOut: plan?.dates?.end || dayDate,
          adults: plan?.travelers || 1,
          lat: dest?.lat,
          lng: dest?.lng,
          countryCode: dest?.countryCode,
        });
        setResults(found || []);
        if (err) setError(err);
        if (n) setNote(n);
      } else if (activityType === "flight") {
        const { results: found, error: err, note: n } = await api.plannerFlights({
          origin: origin?.cityCode || origin?.name || "NYC",
          destination: dest?.cityCode || dest?.name,
          date: dayDate || plan?.dates?.start,
          adults: plan?.travelers || 1,
        });
        setResults(found || []);
        if (err) setError(err);
        if (n) setNote(n);
      } else if (dest?.lat != null && dest?.lng != null) {
        const { results: found, error: err } = await api.plannerPlaces({
          q: query,
          lat: dest.lat,
          lng: dest.lng,
          type: activityType === "restaurant" ? "restaurant" : "activity",
        });
        setResults(found || []);
        if (err) setError(err);
      } else {
        setError("Set a destination with coordinates first.");
      }
    } catch (e) {
      setError(e.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(item) {
    onSelect?.({
      type: activityType,
      title: item.title,
      subtitle: item.subtitle,
      lat: item.lat,
      lng: item.lng,
      price: item.price,
      currency: item.currency,
      meta: item.meta,
    });
    onClose?.();
  }

  function addCustomNote() {
    if (!note.trim() && !query.trim()) return;
    onSelect?.({
      type: "note",
      title: query.trim() || note.trim(),
      notes: note.trim(),
    });
    onClose?.();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={cfg.title} tall>
      {activityType === "note" ? (
        <div className="planner-sheet-note">
          <label>
            Title
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Free morning to explore"
            />
          </label>
          <label>
            Notes
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Details, reminders…"
              rows={4}
            />
          </label>
          <button type="button" className="btn-primary" onClick={addCustomNote}>
            Add to itinerary
          </button>
        </div>
      ) : (
        <>
          {(activityType === "restaurant" || activityType === "activity") && (
            <div className="planner-sheet-search">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search near ${dest?.name || "destination"}…`}
              />
            </div>
          )}
          {activityType === "flight" && origin && (
            <p className="muted small planner-sheet-hint">
              {origin.name || origin.cityCode} → {dest?.name || dest?.cityCode} · {dayDate}
            </p>
          )}
          {loading && <p className="muted small">Searching…</p>}
          {error && <div className="error small">{error}</div>}
          {note && !error && <p className="muted small">{note}</p>}
          <div className="planner-result-scroll">
            {results.map((r) => (
              <ResultCard key={r.id || r.title} item={r} onSelect={handleSelect} />
            ))}
            {!loading && !results.length && !error && (
              <p className="muted small">No results — check API keys or try another search.</p>
            )}
          </div>
        </>
      )}
    </BottomSheet>
  );
}

// Reuse transport icons for activity types in builder
export function ActivityTypeIcon({ type, size = 18 }) {
  const map = { hotel: "train", flight: "plane", restaurant: "walk", activity: "bike", note: "walk" };
  return <TransportIcon mode={map[type] || "walk"} size={size} />;
}
