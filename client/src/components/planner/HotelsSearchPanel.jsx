import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import PlannerResultsWithMap from "./PlannerResultsWithMap.jsx";
import HotelDetailSheet from "./HotelDetailSheet.jsx";
import { PlannerSearchLocationField, resolveSearchLocation, useSearchLocation } from "../../planner/useSearchLocation.jsx";
import { normalizeHotelDates } from "../../planner/plannerModel.js";
import { buildHotelPriceLink } from "../../planner/travelLinks.js";

function friendlyHotelError(message = "") {
  if (/429|too many requests|request limit|4290/i.test(message)) {
    return "Hotel price lookup is temporarily busy. Browse hotels below and check rates on Google Hotels.";
  }
  return message;
}

export default function HotelsSearchPanel({ plan, onPick }) {
  const tripDest = plan?.destination;
  const { location, setSearchLocation, resetToTripDestination } = useSearchLocation(tripDest);
  const defaultDates = normalizeHotelDates(plan?.dates?.start, plan?.dates?.end);
  const [checkIn, setCheckIn] = useState(defaultDates.checkIn || "");
  const [checkOut, setCheckOut] = useState(defaultDates.checkOut || "");
  const [adults, setAdults] = useState(plan?.travelers || 1);
  const [hotelFilter, setHotelFilter] = useState("");
  const [minRating, setMinRating] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("price");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [viewHotel, setViewHotel] = useState(null);

  const filtered = useMemo(() => {
    let list = [...results];
    if (minRating) {
      const min = Number(minRating);
      list = list.filter((r) => r.rating == null || r.rating >= min);
    }
    if (maxPrice) {
      const max = Number(maxPrice);
      list = list.filter((r) => r.price == null || r.price <= max);
    }
    if (sort === "price") {
      list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    } else if (sort === "rating") {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return list;
  }, [results, minRating, maxPrice, sort]);

  const runSearch = useCallback(async () => {
    const dates = normalizeHotelDates(checkIn, checkOut);
    if (!dates.checkIn || !dates.checkOut) {
      setError("Check-in and check-out dates are required.");
      return;
    }

    const resolved = await resolveSearchLocation(location);
    if (!resolved?.name && resolved?.lat == null) {
      setError("Pick a city from search — try Tokyo, Paris, Bali…");
      return;
    }
    if (resolved && !location?.lat && resolved.lat) {
      setSearchLocation(resolved);
    }

    setLoading(true);
    setError("");
    setNote("");
    try {
      const data = await api.plannerHotels({
        city: resolved.name,
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        adults,
        lat: resolved.lat,
        lng: resolved.lng,
        countryCode: resolved.countryCode,
        q: hotelFilter.trim() || undefined,
      });
      setResults(data.results || []);
      if (data.error && !(data.results || []).length) {
        setError(friendlyHotelError(data.error));
      } else {
        setError("");
      }
      if (data.note) setNote(data.note);
      else if (resolved.searchHint) setNote(resolved.searchHint);
    } catch (e) {
      setError(friendlyHotelError(e.message));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [location, checkIn, checkOut, adults, hotelFilter, setSearchLocation]);

  useEffect(() => {
    if (checkIn && checkOut && location?.name) runSearch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="planner-search-panel">
      <form
        className="planner-search-filters card"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
      >
        <div className="planner-search-filter-grid planner-search-filter-grid-wide">
          <div className="planner-search-location-cell">
            <PlannerSearchLocationField
              location={location}
              onChange={setSearchLocation}
              tripDestination={tripDest}
              onResetTrip={resetToTripDestination}
              label="Where"
              placeholder="Tokyo, Paris, Bali…"
            />
          </div>
          <label>
            Filter
            <input
              value={hotelFilter}
              onChange={(e) => setHotelFilter(e.target.value)}
              placeholder="Hotel name, brand…"
            />
          </label>
          <label>
            Check in
            <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </label>
          <label>
            Check out
            <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </label>
          <label>
            Guests
            <select value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            Min rating
            <select value={minRating} onChange={(e) => setMinRating(e.target.value)}>
              <option value="">Any</option>
              <option value="3">3+ stars</option>
              <option value="4">4+ stars</option>
              <option value="4.5">4.5+</option>
            </select>
          </label>
          <label>
            Max price / night
            <input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="USD" />
          </label>
          <label>
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="price">Price</option>
              <option value="rating">Rating</option>
            </select>
          </label>
        </div>
        <button type="submit" className="btn-primary planner-search-submit" disabled={loading}>
          {loading ? "Searching…" : "Search hotels"}
        </button>
      </form>

      {error && !results.length && <div className="error small">{error}</div>}

      <PlannerResultsWithMap
        searchLocation={location}
        plan={plan}
        results={filtered}
        loading={loading}
        error={error && !results.length ? error : null}
        note={note && (!error || results.length) ? note : ""}
        selectedId={selectedId}
        onSelect={(item) => {
          setSelectedId(item.id || item.title);
          setViewHotel(item);
        }}
        onHover={setSelectedId}
        actionLabel="View hotel"
        emptyMessage={
          location?.name?.toLowerCase() === "japan"
            ? "Try Tokyo, Kyoto, or Osaka — or search all Japan on Google Hotels below."
            : "No hotels found — try a specific city or different dates."
        }
      />

      {!loading && !filtered.length && location?.name && checkIn && checkOut && (
        <a
          className="btn-secondary planner-hotel-google-fallback"
          href={buildHotelPriceLink({
            city: location.name.toLowerCase() === "japan" ? "Tokyo Japan" : location.name,
            checkIn,
            checkOut,
            adults,
          })}
          target="_blank"
          rel="noopener noreferrer"
        >
          Search on Google Hotels ↗
        </a>
      )}

      <HotelDetailSheet
        open={Boolean(viewHotel)}
        onClose={() => setViewHotel(null)}
        hotel={viewHotel}
        cityName={location?.name}
        checkIn={checkIn}
        checkOut={checkOut}
        adults={adults}
        onAddToItinerary={(item) => {
          setViewHotel(null);
          onPick?.(item);
        }}
      />
    </div>
  );
}
