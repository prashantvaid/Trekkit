import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import TripMap from "../components/TripMap.jsx";
import AddStop from "../components/AddStop.jsx";
import TripItinerary from "../components/TripItinerary.jsx";
import TripRegionSetup from "../components/TripRegionSetup.jsx";
import TripDescription from "../components/TripDescription.jsx";
import TripRoutePlayback from "../components/TripGlobePlayback.jsx";
import TripTravelJournal from "../components/TripTravelJournal.jsx";
import TripEngagement from "../components/TripEngagement.jsx";
import { collectTripPhotos } from "../components/TripPhotoCollage.jsx";
import {
  TripSetupNav,
  TripSetupCountryPanel,
  TripSetupTitlePanel,
  TripSetupStoryPanel,
  globeStopsFromTrip,
} from "../components/TripSetupSteps.jsx";
import { CountryFlag } from "../countryFlags.jsx";
import { getMapRegion, hasMapRegion } from "../mapPresets.js";
import { tripToOrigin } from "../tripOrigin.js";

function fmtDate(d) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return d;
  }
}

export default function TripDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState("");
  const [selectedStopId, setSelectedStopId] = useState(null);
  const [draftPin, setDraftPin] = useState(null);
  const [setupStep, setSetupStep] = useState("map");
  const [setupMode, setSetupMode] = useState(false);
  const [configuringStop, setConfiguringStop] = useState(false);
  const stopRefs = useRef({});

  function goToSetup(step) {
    setSetupMode(true);
    setSetupStep(step);
  }

  async function load() {
    try {
      const { trip } = await api.getTrip(id);
      setTrip(trip);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <div className="page"><div className="error">{error}</div></div>;
  if (!trip) return <div className="page"><div className="muted">Loading…</div></div>;

  const isOwner = user && user.id === trip.user_id;
  const stops = trip.stops;
  const photoCount = stops.reduce((n, s) => n + (s.photos?.length || 0), 0);
  const dateRange = [fmtDate(trip.start_date), fmtDate(trip.end_date)].filter(Boolean).join(" – ");
  const mapRegion = getMapRegion(trip);
  const mapReady = hasMapRegion(trip);
  const isTracking = isOwner && mapReady && (!trip.posted_at || setupMode);
  const globeStops = globeStopsFromTrip(trip);
  const tripOrigin = tripToOrigin(trip);
  const mapHeight = isTracking ? "clamp(440px, 68vh, 720px)" : isOwner ? 560 : 460;

  function focusStop(stop) {
    setSelectedStopId(stop.id);
    const el = stopRefs.current[stop.id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleDeleteTrip() {
    if (!confirm("Delete this trip for good?")) return;
    await api.deleteTrip(trip.id);
    navigate("/");
  }

  async function handleDeleteStop(stopId) {
    await api.deleteStop(trip.id, stopId);
    if (selectedStopId === stopId) setSelectedStopId(null);
    load();
  }

  return (
    <div className={`page trip-detail ${isTracking ? "trip-detail-tracking" : ""}`}>
      <div className="trip-detail-container">
      {trip.posted_at && (
        <div className="trip-detail-nav">
          <Link to="/" className="trip-back-feed">← Back to feed</Link>
        </div>
      )}
      {isTracking ? (
        <>
        <div className="trip-track-bar">
          <div className="trip-track-bar-main">
            {trip.country && (
              <CountryFlag name={trip.country} size="sm" className="trip-track-flag" />
            )}
            <h1>{trip.title}</h1>
            <span className={`trip-vis ${trip.is_public ? "public" : "private"}`}>
              {trip.is_public ? "Public" : "Private"}
            </span>
          </div>
          <div className="trip-track-bar-actions">
            <button type="button" className="link-btn danger small" onClick={handleDeleteTrip}>Delete</button>
          </div>
        </div>
        <div className="card trip-setup-form">
          <TripSetupNav step={setupStep} onStep={goToSetup} />
          {setupStep === "country" && (
            <TripSetupCountryPanel trip={trip} onSaved={setTrip} onContinue={goToSetup} />
          )}
          {setupStep === "title" && (
            <TripSetupTitlePanel trip={trip} onSaved={setTrip} onContinue={goToSetup} />
          )}
          {(setupStep === "map" || setupStep === "story") && (
            <div className="trip-setup-map-body">
              <div className="trip-studio is-owner is-tracking">
                <div className="studio-map-col">
                  <div className="trip-map-wrap">
                    <TripMap
                      stops={stops}
                      origin={tripOrigin}
                      draft={draftPin}
                      focus={
                        mapRegion
                          ? { lat: mapRegion.lat, lng: mapRegion.lng, name: mapRegion.name }
                          : null
                      }
                      defaultPresets={mapRegion?.presets}
                      height={mapHeight}
                      onStopClick={focusStop}
                      highlightStopId={selectedStopId}
                      preserveView={setupStep === "story"}
                    >
                      <div className="map-legend">
                        <span className="map-legend-count">{stops.length} stop{stops.length === 1 ? "" : "s"}</span>
                        {tripOrigin && (
                          <span className="map-legend-origin">From {tripOrigin.name}</span>
                        )}
                        {photoCount > 0 && (
                          <span className="map-legend-photos">{photoCount} photo{photoCount === 1 ? "" : "s"} on map</span>
                        )}
                        {draftPin ? (
                          <span className="map-legend-draft">Placing “{draftPin.name}”…</span>
                        ) : stops.length === 0 && mapRegion ? (
                          <span className="muted small">Centered on {mapRegion.name}</span>
                        ) : (
                          stops.length > 1 && <span className="muted small">Routes colored by how you traveled</span>
                        )}
                      </div>
                      {stops.length === 0 && setupStep === "map" && (
                        <div className="map-empty-hint">
                          Search a place in the sidebar to drop your first pin →
                        </div>
                      )}
                    </TripMap>
                  </div>
                </div>
                <div className="studio-side">
                  {setupStep === "map" && (
                    <>
                      <AddStop
                          tripId={trip.id}
                          stops={stops}
                          onAdded={load}
                          onDraftChange={setDraftPin}
                          onConfiguringChange={setConfiguringStop}
                          bias={mapRegion ? { lat: mapRegion.lat, lng: mapRegion.lng } : null}
                        />
                      {!configuringStop && (
                        <>
                      <div className="card itinerary-card">
                        <div className="itinerary-head">
                          <h2>Itinerary</h2>
                          <span className="muted small">{stops.length} stop{stops.length === 1 ? "" : "s"}</span>
                        </div>
                        {stops.length === 0 ? (
                          <p className="muted">No stops pinned yet.</p>
                        ) : (
                          <TripItinerary
                            stops={stops}
                            tripId={trip.id}
                            isOwner={isOwner}
                            selectedStopId={selectedStopId}
                            stopRefs={stopRefs}
                            onFocusStop={focusStop}
                            onDeleteStop={handleDeleteStop}
                            onChange={load}
                          />
                        )}
                      </div>
                      {stops.length > 0 && (
                        <button
                          type="button"
                          className="btn-primary studio-story-cta"
                          onClick={() => goToSetup("story")}
                        >
                          Continue to story →
                        </button>
                      )}
                        </>
                      )}
                    </>
                  )}
                  {setupStep === "story" && (
                    <TripSetupStoryPanel
                      trip={trip}
                      onSaved={setTrip}
                      onContinue={goToSetup}
                      compact
                      onPosted={() => {
                        setSetupMode(true);
                        setSetupStep("story");
                        load();
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        </>
      ) : (
        <>
          <div className="trip-hero">
            <div className="trip-hero-main">
              <div className="trip-hero-meta">
                <Link to={`/u/${trip.author.id}`} className="trip-hero-author">
                  <span className="avatar sm">
                    {trip.author.avatar_url ? (
                      <img src={trip.author.avatar_url} alt={trip.author.username} />
                    ) : (
                      <span>{trip.author.username[0]?.toUpperCase()}</span>
                    )}
                  </span>
                  {trip.author.username}
                </Link>
                {dateRange && <span className="dot-sep">·</span>}
                {dateRange && <span className="muted small">{dateRange}</span>}
                <span className={`trip-vis ${trip.is_public ? "public" : "private"}`}>
                  {trip.is_public ? "Public" : "Private"}
                </span>
              </div>
              <h1>{trip.title}</h1>
              {trip.description && <p className="trip-desc">{trip.description}</p>}
            </div>
            {isOwner && (
              <button className="link-btn danger" onClick={handleDeleteTrip}>Delete trip</button>
            )}
          </div>
          {isOwner && trip.posted_at && (
            <div className="trip-actions">
              <button type="button" className="btn-secondary action-btn action-btn-lg" onClick={() => goToSetup("map")}>
                Edit on map
              </button>
            </div>
          )}
          {trip.posted_at && globeStops.length > 0 && (
            <div className="card trip-posted-globe">
              <div className="trip-card-map">
                <TripRoutePlayback
                  stops={globeStops}
                  origin={tripOrigin}
                  photos={collectTripPhotos(trip)}
                  tripId={trip.id}
                  height={400}
                  mapHeight={480}
                  autoRotate
                  showControls
                  showPhotoStrip={photoCount > 0}
                  focus={
                    mapRegion
                      ? { lat: mapRegion.lat, lng: mapRegion.lng }
                      : null
                  }
                  defaultPresets={mapRegion?.presets}
                />
              </div>
            </div>
          )}
          {trip.posted_at && stops.some((s) => s.notes?.trim() || s.photos?.length) && (
            <TripTravelJournal
              stops={stops}
              authorName={trip.author.username}
            />
          )}
          {trip.posted_at && trip.is_public && (
            <div className="card trip-engagement-card">
              <TripEngagement trip={trip} currentUser={user} variant="detail" />
            </div>
          )}
        </>
      )}

      {isOwner && !mapReady ? (
        <TripRegionSetup trip={trip} onComplete={setTrip} />
      ) : !isTracking ? (
      <div className={`trip-studio ${isOwner ? "is-owner" : ""} ${isTracking ? "is-tracking" : ""}`}>
        <div className="studio-map-col">
          {mapReady ? (
          <div className="trip-map-wrap">
            <TripMap
              stops={stops}
              origin={tripOrigin}
              draft={draftPin}
              focus={
                mapRegion
                  ? { lat: mapRegion.lat, lng: mapRegion.lng, name: mapRegion.name }
                  : null
              }
              defaultPresets={mapRegion?.presets}
              height={mapHeight}
              onStopClick={focusStop}
              highlightStopId={selectedStopId}
            >
              <div className="map-legend">
                <span className="map-legend-count">{stops.length} stop{stops.length === 1 ? "" : "s"}</span>
                {tripOrigin && (
                  <span className="map-legend-origin">From {tripOrigin.name}</span>
                )}
                {photoCount > 0 && (
                  <span className="map-legend-photos">{photoCount} photo{photoCount === 1 ? "" : "s"} on map</span>
                )}
                {draftPin ? (
                  <span className="map-legend-draft">Placing “{draftPin.name}”…</span>
                ) : stops.length === 0 && mapRegion ? (
                  <span className="muted small">Centered on {mapRegion.name}</span>
                ) : (
                  stops.length > 1 && <span className="muted small">Routes colored by how you traveled</span>
                )}
              </div>
              {stops.length === 0 && isOwner && (
                <div className="map-empty-hint">
                  Search a place {isTracking ? "in the sidebar" : "on the right"} to drop your first pin →
                </div>
              )}
            </TripMap>
          </div>
          ) : (
            <div className="card region-setup-placeholder">
              <p className="muted">The map will appear once the trip owner sets a country.</p>
            </div>
          )}
        </div>

        <div className="studio-side">
          {isOwner && mapReady && !isTracking && (
            <TripDescription trip={trip} onSaved={setTrip} />
          )}

          {isOwner && mapReady && (
            <AddStop
                tripId={trip.id}
                stops={stops}
                onAdded={load}
                onDraftChange={setDraftPin}
                onConfiguringChange={setConfiguringStop}
                bias={mapRegion ? { lat: mapRegion.lat, lng: mapRegion.lng } : null}
              />
          )}

          {!configuringStop && (
          <div className="card itinerary-card">
            <div className="itinerary-head">
              <h2>{trip.posted_at ? "Travel journal" : "Itinerary"}</h2>
              <span className="muted small">{stops.length} stop{stops.length === 1 ? "" : "s"}</span>
            </div>
            {stops.length === 0 ? (
              <p className="muted">No stops pinned yet.</p>
            ) : (
              <TripItinerary
                stops={stops}
                tripId={trip.id}
                isOwner={isOwner}
                selectedStopId={selectedStopId}
                stopRefs={stopRefs}
                onFocusStop={focusStop}
                onDeleteStop={isOwner ? handleDeleteStop : null}
                onChange={load}
              />
            )}
          </div>
          )}
        </div>
      </div>
      ) : null}
      </div>
    </div>
  );
}
