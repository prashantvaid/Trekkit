import { useEffect, useRef, useState } from "react";
import PlannerDestinationSearch from "../components/planner/PlannerDestinationSearch.jsx";
import { api } from "../api.js";

/** Search location independent of trip setup — defaults to trip destination but user can override. */
export function useSearchLocation(tripDestination) {
  const [location, setLocation] = useState(tripDestination || null);
  const userOverride = useRef(false);

  useEffect(() => {
    if (!userOverride.current && tripDestination) {
      setLocation(tripDestination);
    }
  }, [tripDestination?.name, tripDestination?.lat, tripDestination?.lng, tripDestination?.countryCode]);

  function setSearchLocation(loc) {
    userOverride.current = true;
    setLocation(loc);
  }

  function resetToTripDestination() {
    userOverride.current = false;
    setLocation(tripDestination || null);
  }

  return { location, setSearchLocation, resetToTripDestination, hasOverride: userOverride.current };
}

export async function resolveSearchLocation(location) {
  if (location?.lat != null && location?.lng != null) return location;
  const q = location?.name?.trim();
  if (!q) return null;
  try {
    const { results } = await api.geocode(q);
    const hit = results?.[0];
    if (!hit) return null;
    let countryCode = hit.country_code || null;
    if (!countryCode && /japan|tokyo|kyoto|osaka|jp/i.test(hit.name || hit.secondary || "")) {
      countryCode = "JP";
    }
    const primary = hit.primary || hit.name.split(",")[0];
    const isJapanCountry = /^japan$/i.test(primary);
    return {
      name: isJapanCountry ? "Tokyo" : primary,
      lat: hit.lat,
      lng: hit.lng,
      countryCode,
      displayName: hit.name,
      searchHint: isJapanCountry ? "Searching hotels around Tokyo — pick a city for narrower results." : null,
    };
  } catch {
    return null;
  }
}

export function PlannerSearchLocationField({
  location,
  onChange,
  tripDestination,
  onResetTrip,
  label = "Where",
  placeholder = "Search any city worldwide…",
}) {
  return (
    <div className="planner-search-location-field">
      <PlannerDestinationSearch
        label={label}
        placeholder={placeholder}
        value={location}
        onChange={onChange}
      />
      {tripDestination?.name &&
        location?.name !== tripDestination.name && (
          <button type="button" className="link-btn small planner-search-location-reset" onClick={onResetTrip}>
            Use trip destination ({tripDestination.name})
          </button>
        )}
    </div>
  );
}
