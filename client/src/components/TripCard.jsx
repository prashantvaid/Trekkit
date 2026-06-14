import { Link, useNavigate } from "react-router-dom";
import TripRoutePlayback from "./TripGlobePlayback.jsx";
import { collectTripPhotos } from "./TripPhotoCollage.jsx";
import TripTravelJournal from "./TripTravelJournal.jsx";
import TripEngagement from "./TripEngagement.jsx";
import { parseStoredMapPresets } from "../mapPresets.js";
import { tripToOrigin } from "../tripOrigin.js";
import { useAuth } from "../auth.jsx";
import { setPlannerImport } from "../plannerImport.js";

function fmtDate(d) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return d;
  }
}

export default function TripCard({ trip, showPlannerCopy = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const photos = collectTripPhotos(trip);
  const photoCount = photos.length;
  const stopCount = trip.stops.length;
  const hasMedia = photoCount > 0 || stopCount > 0;
  const hasJournal = trip.stops.some(
    (s) => (s.notes && s.notes.trim()) || (s.photos && s.photos.length > 0)
  );

  function copyToPlanner() {
    setPlannerImport(trip);
    navigate("/plan");
  }

  const dateRange = [fmtDate(trip.start_date), fmtDate(trip.end_date)].filter(Boolean).join(" – ");
  const region = trip.country || trip.destination?.split(",")[0];
  const tripOrigin = tripToOrigin(trip);

  return (
    <article className="card trip-card feed-post">
      <header className="trip-card-head">
        <Link to={`/u/${trip.author.id}`} className="avatar">
          {trip.author.avatar_url ? (
            <img src={trip.author.avatar_url} alt={trip.author.username} />
          ) : (
            <span>{trip.author.username[0]?.toUpperCase()}</span>
          )}
        </Link>
        <div className="trip-card-meta">
          <Link to={`/u/${trip.author.id}`} className="username">{trip.author.username}</Link>
          <div className="trip-card-sub muted small">
            {dateRange && <span>{dateRange}</span>}
            {dateRange && region && <span className="dot-sep">·</span>}
            {region && <span>{region}</span>}
          </div>
        </div>
        <Link to={`/trips/${trip.id}`} className="feed-post-link">View trip</Link>
      </header>

      <Link to={`/trips/${trip.id}`} className="trip-title-link">
        <h2 className="trip-title">{trip.title}</h2>
      </Link>
      {trip.description && <p className="trip-desc feed-post-desc">{trip.description}</p>}

      {hasMedia ? (
        <div className="trip-card-media">
          {stopCount > 0 ? (
            <div className="trip-card-map">
              <TripRoutePlayback
                stops={trip.stops}
                origin={tripOrigin}
                photos={photos}
                tripId={trip.id}
                height={360}
                mapHeight={photoCount > 0 ? 460 : 520}
                autoRotate
                showControls
                showPhotoStrip={photoCount > 0}
                focus={
                  Number.isFinite(trip.country_lat)
                    ? { lat: trip.country_lat, lng: trip.country_lng }
                    : null
                }
                defaultPresets={parseStoredMapPresets(trip.map_presets)}
              />
            </div>
          ) : (
            <div className="globe-empty feed-post-empty">No stops on this trip yet.</div>
          )}
        </div>
      ) : (
        <div className="globe-empty feed-post-empty">No stops or photos yet.</div>
      )}

      {hasJournal && (
        <TripTravelJournal
          stops={trip.stops}
          authorName={trip.author.username}
          compact
          maxEntries={3}
        />
      )}

      <div className="trip-stats feed-post-stats">
        <span className="feed-stat">{stopCount} stop{stopCount === 1 ? "" : "s"}</span>
        <span className="feed-stat">{photoCount} photo{photoCount === 1 ? "" : "s"}</span>
        {showPlannerCopy && stopCount > 0 && (
          <button className="feed-action" onClick={copyToPlanner}>
            Add to planner
          </button>
        )}
      </div>

      {!showPlannerCopy && (
        <TripEngagement trip={trip} currentUser={user} variant="feed" />
      )}
    </article>
  );
}
