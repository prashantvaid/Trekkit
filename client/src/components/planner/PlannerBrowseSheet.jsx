import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import BottomSheet from "./BottomSheet.jsx";
import PlannerPinsMap from "./PlannerPinsMap.jsx";
import PlannerResultCard from "./PlannerResultCard.jsx";
import HotelDetailSheet from "./HotelDetailSheet.jsx";
import { ACTIVITY_TYPES, SLOT_LABELS, normalizeHotelDates } from "../../planner/plannerModel.js";
import { PlannerSearchLocationField, resolveSearchLocation, useSearchLocation } from "../../planner/useSearchLocation.jsx";
import { hotelItineraryNotes } from "../../planner/travelLinks.js";

const TITLES = {
  hotel: "Browse hotels",
  restaurant: "Browse restaurants",
  activity: "Browse things to do",
};

export default function PlannerBrowseSheet({
  open,
  onClose,
  activityType,
  plan,
  target,
  onSelect,
}) {
  const tripDest = plan?.destination;
  const { location, setSearchLocation, resetToTripDestination } = useSearchLocation(tripDest);
  const day = plan?.days?.find((d) => d.id === target?.dayId);
  const slotLabel = target?.slot ? SLOT_LABELS[target.slot] : null;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [viewHotel, setViewHotel] = useState(null);

  const hotelDates = normalizeHotelDates(plan?.dates?.start, plan?.dates?.end);

  const center = useMemo(() => {
    const loc = location || tripDest;
    if (loc?.lat != null && loc?.lng != null) return { lat: loc.lat, lng: loc.lng };
    return null;
  }, [location?.lat, location?.lng, tripDest?.lat, tripDest?.lng]);

  const runSearch = useCallback(async () => {
    const resolved = await resolveSearchLocation(location);
    if (!resolved?.name && resolved?.lat == null) {
      setError("Search for a city above — try Tokyo, Paris, Bali…");
      setResults([]);
      return;
    }
    if (resolved && !location?.lat && resolved.lat) {
      setSearchLocation(resolved);
    }

    if (activityType === "hotel") {
      const dates = normalizeHotelDates(plan?.dates?.start, plan?.dates?.end);
      if (!dates.checkIn || !dates.checkOut) {
        setError("Add trip dates in setup to see hotel prices.");
        setResults([]);
        return;
      }
      setLoading(true);
      setError("");
      setNote("");
      try {
        const data = await api.plannerHotels({
          city: resolved.name,
          checkIn: dates.checkIn,
          checkOut: dates.checkOut,
          adults: plan?.travelers || 1,
          lat: resolved.lat,
          lng: resolved.lng,
          countryCode: resolved.countryCode,
          q: query.trim() || undefined,
        });
        setResults(data.results || []);
        if (data.error && !(data.results || []).length) setError(data.error);
        else setError("");
        if (data.note) setNote(data.note);
      } catch (e) {
        setError(/429|too many requests|request limit/i.test(e.message)
          ? "Hotel price lookup is temporarily busy. Try again in a minute."
          : e.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (resolved.lat == null || resolved.lng == null) {
      setError("Pick a city from search to find places nearby.");
      setResults([]);
      return;
    }

    setLoading(true);
    setError("");
    setNote("");
    try {
      const data = await api.plannerPlaces({
        q: query,
        lat: resolved.lat,
        lng: resolved.lng,
        type: activityType === "restaurant" ? "restaurant" : "activity",
        sort: "RELEVANCE",
        radius: 10000,
        limit: 24,
      });
      setResults(data.results || []);
      if (data.error) setError(data.error);
    } catch (e) {
      setError(e.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [activityType, location, plan?.dates, plan?.travelers, query, setSearchLocation]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setError("");
      setNote("");
      setSelectedId(null);
      setViewHotel(null);
      return;
    }
    const t = setTimeout(runSearch, 200);
    return () => clearTimeout(t);
  }, [open, runSearch]);

  function pickItem(item) {
    onSelect?.({
      type: activityType,
      title: item.title,
      subtitle: item.subtitle,
      lat: item.lat,
      lng: item.lng,
      price: item.price,
      currency: item.currency,
      notes: activityType === "hotel" ? hotelItineraryNotes(item) : "",
      meta: { ...item.meta, image: item.image || item.meta?.image || null },
    });
    onClose?.();
  }

  function handleResultSelect(item) {
    if (activityType === "hotel") {
      setViewHotel(item);
      return;
    }
    pickItem(item);
  }

  const cfg = ACTIVITY_TYPES[activityType] || ACTIVITY_TYPES.activity;
  const actionLabel =
    activityType === "hotel"
      ? "View hotel"
      : activityType === "restaurant"
        ? "Add restaurant"
        : "Add activity";

  const locName = location?.name || tripDest?.name;

  return (
    <BottomSheet open={open} onClose={onClose} title={TITLES[activityType] || cfg.label} tall>
      <div className="planner-browse-sheet">
        {day && slotLabel && (
          <p className="muted small planner-browse-context">
            Adding to {day.label} · {slotLabel}
            {locName ? ` · near ${locName}` : ""}
          </p>
        )}

        <PlannerSearchLocationField
          location={location}
          onChange={setSearchLocation}
          tripDestination={tripDest}
          onResetTrip={resetToTripDestination}
          label="Where"
          placeholder="Search any city worldwide…"
        />

        <div className="planner-browse-search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              activityType === "hotel"
                ? "Filter hotels…"
                : activityType === "restaurant"
                  ? "Sushi, ramen, cafe…"
                  : "Museums, temples, parks…"
            }
          />
          <button type="button" className="btn-secondary" onClick={runSearch} disabled={loading}>
            {loading ? "…" : "Search"}
          </button>
        </div>

        {loading && !results.length && (
          <p className="muted small">Loading options near {locName || "your search"}…</p>
        )}
        {error && <div className="error small">{error}</div>}
        {note && !error && <p className="muted small">{note}</p>}

        {center && results.some((r) => r.lat != null) && (
          <PlannerPinsMap
            center={center}
            results={results}
            selectedId={selectedId}
            onPinClick={(r) => setSelectedId(r.id || r.title)}
            height={220}
          />
        )}

        <div className="planner-browse-results">
          {results.map((r) => (
            <div
              key={r.id || r.title}
              className={`planner-browse-result-wrap${selectedId === (r.id || r.title) ? " is-selected" : ""}`}
              onMouseEnter={() => setSelectedId(r.id || r.title)}
            >
              <PlannerResultCard
                item={r}
                onSelect={() => handleResultSelect(r)}
                actionLabel={actionLabel}
              />
            </div>
          ))}
          {!loading && !results.length && !error && (
            <p className="muted small">No results — try another city or search term.</p>
          )}
        </div>
      </div>

      {activityType === "hotel" && (
        <HotelDetailSheet
          open={Boolean(viewHotel)}
          onClose={() => setViewHotel(null)}
          hotel={viewHotel}
          cityName={locName}
          checkIn={hotelDates.checkIn}
          checkOut={hotelDates.checkOut}
          adults={plan?.travelers || 1}
          addLabel={day && slotLabel ? `Add to ${day.label} · ${slotLabel}` : "Add to itinerary"}
          onAddToItinerary={(item) => {
            setViewHotel(null);
            pickItem(item);
          }}
        />
      )}
    </BottomSheet>
  );
}
