import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TripGlobe from "./TripGlobe.jsx";
import TripPhotoCollage, { collectTripPhotos } from "./TripPhotoCollage.jsx";
import ShareButton from "./ShareButton.jsx";
import BookmarkButton from "./BookmarkButton.jsx";
import { api } from "../api.js";
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
  const [kudos, setKudos] = useState(trip.kudos);
  const [liked, setLiked] = useState(trip.likedByViewer);
  const photos = collectTripPhotos(trip);
  const photoCount = photos.length;
  const stopCount = trip.stops.length;
  const hasMedia = photoCount > 0 || stopCount > 0;

  function copyToPlanner() {
    setPlannerImport(trip);
    navigate("/plan");
  }

  async function toggleKudos() {
    setLiked((v) => !v);
    setKudos((k) => (liked ? k - 1 : k + 1));
    try {
      const res = await api.toggleKudos(trip.id);
      setKudos(res.kudos);
      setLiked(res.liked);
    } catch {
      setLiked((v) => !v);
    }
  }

  const dateRange = [fmtDate(trip.start_date), fmtDate(trip.end_date)].filter(Boolean).join(" – ");
  const region = trip.country || trip.destination?.split(",")[0];

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
        <div className={`trip-card-media ${photoCount > 0 ? "has-photos" : "map-only"}`}>
          {photoCount > 0 && (
            <TripPhotoCollage photos={photos} tripId={trip.id} />
          )}
          {stopCount > 0 && (
            <div className="trip-card-map">
              <TripGlobe
                stops={trip.stops}
                height={photoCount > 0 ? 220 : 360}
                autoRotate={photoCount === 0}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="globe-empty feed-post-empty">No stops or photos yet.</div>
      )}

      <div className="trip-stats feed-post-stats">
        <span className="feed-stat">{stopCount} stop{stopCount === 1 ? "" : "s"}</span>
        <span className="feed-stat">{photoCount} photo{photoCount === 1 ? "" : "s"}</span>
        {!showPlannerCopy && (
          <button className={`feed-action ${liked ? "liked" : ""}`} onClick={toggleKudos}>
            Kudos <span className="feed-action-count">{kudos}</span>
          </button>
        )}
        <ShareButton tripId={trip.id} title={trip.title} className="feed-action" />
        <BookmarkButton tripId={trip.id} initial={trip.bookmarkedByViewer} className="feed-action" />
        {showPlannerCopy && stopCount > 0 && (
          <button className="feed-action" onClick={copyToPlanner}>
            Add to planner
          </button>
        )}
      </div>
    </article>
  );
}
