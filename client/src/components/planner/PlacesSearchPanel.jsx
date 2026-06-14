import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import PlannerResultsWithMap from "./PlannerResultsWithMap.jsx";
import { PlannerSearchLocationField, resolveSearchLocation, useSearchLocation } from "../../planner/useSearchLocation.jsx";

export default function PlacesSearchPanel({ plan, placeType, onPick }) {
  const isRestaurant = placeType === "restaurant";
  const tripDest = plan?.destination;
  const { location, setSearchLocation, resetToTripDestination } = useSearchLocation(tripDest);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("RELEVANCE");
  const [radius, setRadius] = useState("10000");
  const [minRating, setMinRating] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => {
    if (!minRating) return results;
    const min = Number(minRating);
    return results.filter((r) => r.rating == null || r.rating >= min);
  }, [results, minRating]);

  const runSearch = useCallback(async () => {
    const resolved = await resolveSearchLocation(location);
    if (resolved?.lat == null || resolved?.lng == null) {
      setError("Pick a city from search — try Tokyo, Paris, Bali…");
      setResults([]);
      return;
    }
    if (!location?.lat && resolved.lat) {
      setSearchLocation(resolved);
    }

    setLoading(true);
    setError("");
    try {
      const data = await api.plannerPlaces({
        q: query,
        lat: resolved.lat,
        lng: resolved.lng,
        type: placeType,
        sort,
        radius,
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
  }, [location, query, placeType, sort, radius, setSearchLocation]);

  useEffect(() => {
    if (location?.lat != null) {
      const t = setTimeout(runSearch, 350);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [runSearch, location?.lat, location?.lng]);

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
              placeholder="Search any city worldwide…"
            />
          </div>
          <label className="planner-search-query-field">
            {isRestaurant ? "What" : "What"}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isRestaurant ? "Sushi, brunch, rooftop bar…" : "Museums, parks, tours…"}
            />
          </label>
          <label>
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="RELEVANCE">Best match</option>
              <option value="RATING">Top rated</option>
              <option value="DISTANCE">Nearest</option>
              <option value="POPULARITY">Popular</option>
            </select>
          </label>
          <label>
            Radius
            <select value={radius} onChange={(e) => setRadius(e.target.value)}>
              <option value="1000">1 km</option>
              <option value="3000">3 km</option>
              <option value="5000">5 km</option>
              <option value="10000">10 km</option>
              <option value="25000">25 km</option>
            </select>
          </label>
          <label>
            Min rating
            <select value={minRating} onChange={(e) => setMinRating(e.target.value)}>
              <option value="">Any</option>
              <option value="7">7+</option>
              <option value="8">8+</option>
              <option value="9">9+</option>
            </select>
          </label>
        </div>
        <button type="submit" className="btn-primary planner-search-submit" disabled={loading}>
          {loading ? "Searching…" : isRestaurant ? "Search restaurants" : "Search activities"}
        </button>
      </form>

      {error && <div className="error small">{error}</div>}

      <PlannerResultsWithMap
        searchLocation={location}
        plan={plan}
        results={filtered}
        loading={loading}
        error={null}
        selectedId={selectedId}
        onSelect={(item) => {
          setSelectedId(item.id || item.title);
          onPick?.(item);
        }}
        onHover={setSelectedId}
        actionLabel={isRestaurant ? "Add restaurant" : "Add activity"}
        emptyMessage={
          location?.lat != null
            ? "No results — try a different search or radius."
            : "Search for a city above to explore places."
        }
      />
    </div>
  );
}
