import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import CountrySetupPanel from "./CountrySetupPanel.jsx";
import CountryStepHero from "./CountryStepHero.jsx";
import TripGlobe from "./TripGlobe.jsx";
import TripPhotoStrip from "./TripPhotoStrip.jsx";
import { collectTripPhotos } from "./TripPhotoCollage.jsx";
import DateRangePicker from "./DateRangePicker.jsx";
import { CountryFlag, getCountryCode } from "../countryFlags.jsx";
import { getMapPresetsForCountry } from "../mapPresets.js";
import { mapPresetsWithUserDefaults } from "../settingsPrefs.js";
import { loadLastOrigin, saveLastOrigin, tripToOrigin } from "../tripOrigin.js";

export const TRACK_STEPS = [
  { id: "country", n: 1, tab: "1. Where are you going?", progress: "Country" },
  { id: "title", n: 2, tab: "2. Name your trip", progress: "Title" },
  { id: "map", n: 3, tab: "3. Build on the map", progress: "Map" },
  { id: "story", n: 4, tab: "4. Tell your story", progress: "Story" },
];

export function stepNumber(stepId) {
  return TRACK_STEPS.find((s) => s.id === stepId)?.n ?? 1;
}

function tripToCountry(trip) {
  if (!trip?.country) return null;
  return {
    name: trip.country,
    lat: trip.country_lat,
    lng: trip.country_lng,
    code: getCountryCode(trip.country),
  };
}

export function globeStopsFromTrip(trip) {
  if (trip.stops?.length) return trip.stops;
  if (Number.isFinite(trip.country_lat) && Number.isFinite(trip.country_lng)) {
    return [{ name: trip.country || trip.title, lat: trip.country_lat, lng: trip.country_lng }];
  }
  return [];
}

/** Original new-trip tab bar — shared on create + map pages */
export function TripSetupNav({ step, onStep, canAccess }) {
  return (
    <div className="new-trip-tabs" role="tablist" aria-label="Trip setup steps">
      {TRACK_STEPS.map((s) => {
        const allowed = canAccess ? canAccess(s.id) : true;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={step === s.id}
            className={`new-trip-tab ${step === s.id ? "active" : ""}`}
            onClick={() => allowed && onStep(s.id)}
            disabled={!allowed}
          >
            {s.tab}
          </button>
        );
      })}
    </div>
  );
}

/** Numbered progress pills from the new-trip header */
export function TripSetupProgress({ step }) {
  const activeN = stepNumber(step);
  return (
    <ol className="new-trip-progress" aria-label="Trip setup progress">
      {TRACK_STEPS.map((s) => (
        <li
          key={s.id}
          className={`nt-progress-item ${s.n === activeN ? "active" : ""} ${s.n < activeN ? "done" : ""}`}
        >
          <span className="nt-progress-num">{s.n}</span>
          <span className="nt-progress-label">{s.progress}</span>
        </li>
      ))}
    </ol>
  );
}

export function TripSetupCountryPanel({ trip, onSaved, onContinue }) {
  const [country, setCountry] = useState(() => tripToCountry(trip));
  const [origin, setOrigin] = useState(() => tripToOrigin(trip) || loadLastOrigin());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCountry(tripToCountry(trip));
    setOrigin(tripToOrigin(trip) || loadLastOrigin());
  }, [trip.country, trip.country_lat, trip.country_lng, trip.origin_country, trip.origin_country_lat, trip.origin_country_lng]);

  function handleOriginChange(next) {
    setOrigin(next);
    saveLastOrigin(next);
  }

  async function save(nextStep) {
    if (!origin) {
      setError("Choose where you're traveling from.");
      return;
    }
    if (!country) {
      setError("Choose where you're going.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const mapPresets = mapPresetsWithUserDefaults(getMapPresetsForCountry(country.name));
      const { trip: updated } = await api.updateTrip(trip.id, {
        country: country.name,
        country_lat: country.lat,
        country_lng: country.lng,
        map_presets: JSON.stringify(mapPresets),
        destination: country.name,
        destination_lat: country.lat,
        destination_lng: country.lng,
        origin_country: origin?.name ?? null,
        origin_country_lat: origin?.lat ?? null,
        origin_country_lng: origin?.lng ?? null,
      });
      onSaved(updated);
      if (nextStep) onContinue(nextStep);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="new-trip-step country-step">
      <CountrySetupPanel
        destination={country}
        onDestinationChange={setCountry}
        origin={origin}
        onOriginChange={handleOriginChange}
        defaultTab="origin"
      />
      {error && <div className="error">{error}</div>}
      <div className="new-trip-actions">
        <button type="button" className="btn-secondary btn-lg" onClick={() => onContinue("map")}>
          Back to map
        </button>
        <button type="button" className="btn-primary btn-xl" disabled={busy || !origin || !country} onClick={() => save("title")}>
          {busy ? "Saving…" : "Save & continue"}
        </button>
      </div>
    </div>
  );
}

export function TripSetupTitlePanel({ trip, onSaved, onContinue }) {
  const [title, setTitle] = useState(trip.title || "");
  const [startDate, setStartDate] = useState(trip.start_date || "");
  const [endDate, setEndDate] = useState(trip.end_date || "");
  const [isPublic, setIsPublic] = useState(!!trip.is_public);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(trip.title || "");
    setStartDate(trip.start_date || "");
    setEndDate(trip.end_date || "");
    setIsPublic(!!trip.is_public);
  }, [trip.title, trip.start_date, trip.end_date, trip.is_public]);

  async function save(nextStep) {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Give your trip a title.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { trip: updated } = await api.updateTrip(trip.id, {
        title: trimmed,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        is_public: isPublic,
      });
      onSaved(updated);
      if (nextStep) onContinue(nextStep);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const country = tripToCountry(trip);
  const origin = tripToOrigin(trip);

  return (
    <form
      className="new-trip-step title-step"
      onSubmit={(e) => {
        e.preventDefault();
        save("map");
      }}
    >
      <div className="title-step-layout">
        <div className="title-step-intro">
          <div className="country-step-hero compact">
            <span className="country-step-pin" aria-hidden>✈️</span>
            <span className="country-step-eyebrow">Step 2</span>
            <h2>Name your trip</h2>
            <p className="country-step-lead muted">Update the title or who can see this trip on the feed.</p>
          </div>
          {country && (
            <div className="new-trip-country-pill">
              {origin ? (
                <>
                  <CountryFlag name={origin.name} code={origin.code} size="md" />
                  <span className="muted small">From</span>
                  <strong>{origin.name}</strong>
                  <span className="country-route-arrow muted" aria-hidden>→</span>
                  <CountryFlag name={country.name} code={country.code} size="md" />
                  <span className="muted small">To</span>
                  <strong>{country.name}</strong>
                </>
              ) : (
                <>
                  <CountryFlag name={country.name} code={country.code} size="md" />
                  <span className="muted small">Tracking in</span>
                  <strong>{country.name}</strong>
                </>
              )}
              <button type="button" className="link-btn small" onClick={() => onContinue("country")}>
                Change
              </button>
            </div>
          )}
        </div>
        <div className="title-step-fields">
          <label className="title-field-lg">
            Trip title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Two weeks across Japan"
              required
            />
          </label>
          <DateRangePicker
            label="When did you go?"
            hint="Optional — shows on your trip card"
            start={startDate}
            end={endDate}
            onChange={({ start, end }) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
          <div className="visibility-toggle">
            <button type="button" className={isPublic ? "active" : ""} onClick={() => setIsPublic(true)}>
              Public
              <span className="muted small">Shows on the feed</span>
            </button>
            <button type="button" className={!isPublic ? "active" : ""} onClick={() => setIsPublic(false)}>
              Private
              <span className="muted small">Only you can see it</span>
            </button>
          </div>
          {error && <div className="error">{error}</div>}
          <div className="new-trip-actions">
            <button type="button" className="btn-secondary btn-lg" onClick={() => onContinue("country")}>
              Back
            </button>
            <button type="submit" className="btn-primary btn-xl" disabled={busy}>
              {busy ? "Saving…" : "Save & open map"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export function TripSetupStoryPanel({ trip, onSaved, onContinue, onPosted, compact = false }) {
  const [text, setText] = useState(trip.description || "");
  const [isPublic, setIsPublic] = useState(trip.is_public !== false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const celebrateGlobeRef = useRef(null);

  const stopCount = trip.stops?.length || 0;
  const globeStops = globeStopsFromTrip(trip);
  const tripOrigin = tripToOrigin(trip);
  const photos = collectTripPhotos(trip);
  const canPost = stopCount > 0;

  function focusCelebratePhoto(photo) {
    celebrateGlobeRef.current?.zoomToPhoto?.(photo);
  }

  useEffect(() => {
    setText(trip.description || "");
    setIsPublic(trip.is_public !== false);
  }, [trip.description, trip.is_public]);

  async function postTrip() {
    if (!canPost) {
      setError("Add at least one stop on the map before posting.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { trip: updated } = await api.postTrip(trip.id, {
        description: text.trim() || undefined,
        is_public: isPublic,
      });
      onSaved(updated);
      setCelebrate(true);
      onPosted?.(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (celebrate) {
    return (
      <div className="new-trip-step story-step story-posted">
        <div className="story-posted-head">
          <span className="story-posted-badge">Posted</span>
          <h2>Your trip is live on the feed</h2>
          <p className="muted">
            {isPublic
              ? "Friends will see your route on the animated globe."
              : "It’s on your feed — only you can see it while private."}
          </p>
        </div>
        <div className="story-globe-stage story-globe-stage-lg">
          <TripGlobe
            ref={celebrateGlobeRef}
            stops={globeStops}
            origin={tripOrigin}
            photos={photos}
            height={420}
            autoRotate
            showRoute
            showPhotoPins
            onPhotoClick={focusCelebratePhoto}
          />
        </div>
        {photos.length > 0 && (
          <TripPhotoStrip photos={photos} onPhotoSelect={focusCelebratePhoto} />
        )}
        {text.trim() && <p className="story-posted-desc">{text.trim()}</p>}
        <div className="story-posted-stats muted small">
          <span>{stopCount} stop{stopCount === 1 ? "" : "s"}</span>
          <span>·</span>
          <span>{isPublic ? "Public" : "Private"}</span>
        </div>
        <div className="new-trip-actions">
          <button type="button" className="btn-secondary btn-lg" onClick={() => onContinue("map")}>
            Keep editing map
          </button>
          <Link to="/" className="btn-primary btn-xl story-feed-link">
            Back to feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`new-trip-step story-step${compact ? " story-step-compact" : ""}`}>
      <div className={compact ? "story-step-copy" : "story-step-layout"}>
        <div className="story-step-copy">
          <h2>Tell your story</h2>
          <p className="muted small">
            {compact
              ? "Write a caption while keeping your map view — then post to the feed."
              : "Add a caption, then post — your route appears on the feed with the animated globe."}
          </p>

          <label className="trip-desc-field">
            Trip story
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What made this trip special?"
              rows={compact ? 5 : 4}
            />
          </label>

          <p className="geo-search-label">Who can see it?</p>
          <div className="visibility-toggle story-visibility">
            <button type="button" className={isPublic ? "active" : ""} onClick={() => setIsPublic(true)}>
              Public
              <span className="muted small">Feed + profile</span>
            </button>
            <button type="button" className={!isPublic ? "active" : ""} onClick={() => setIsPublic(false)}>
              Private
              <span className="muted small">Just you</span>
            </button>
          </div>

          {!canPost && (
            <p className="error small">Pin at least one stop on the map before you can post.</p>
          )}
          {error && <div className="error">{error}</div>}
        </div>

        {!compact && (
          <div className="story-step-preview">
            <p className="story-preview-label">Feed preview</p>
            <div className="story-feed-card">
              <div className="story-feed-card-head">
                <strong>{trip.title}</strong>
                {trip.country && <span className="muted small">{trip.country}</span>}
              </div>
              {text.trim() && <p className="story-feed-card-desc muted small">{text.trim()}</p>}
              <div className="story-globe-stage">
                {globeStops.length > 0 ? (
                  <TripGlobe stops={globeStops} origin={tripOrigin} height={300} autoRotate />
                ) : (
                  <div className="globe-empty">Add stops to preview your globe</div>
                )}
              </div>
              <div className="story-feed-card-foot muted small">
                <span>{stopCount} stop{stopCount === 1 ? "" : "s"}</span>
                <span>Animated route on the globe</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="new-trip-actions">
        <button type="button" className="btn-secondary btn-lg" onClick={() => onContinue("map")}>
          Back to map
        </button>
        <button
          type="button"
          className="btn-primary btn-xl"
          disabled={busy || !canPost}
          onClick={postTrip}
        >
          {busy ? "Posting…" : "Post trip to feed"}
        </button>
      </div>
    </div>
  );
}
