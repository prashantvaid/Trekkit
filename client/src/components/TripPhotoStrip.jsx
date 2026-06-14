import { Link } from "react-router-dom";

export default function TripPhotoStrip({ photos = [], tripId, onPhotoSelect, max = 10 }) {
  if (!photos.length) return null;

  const shown = photos.slice(0, max);
  const extra = photos.length - shown.length;

  return (
    <div className="trip-photo-strip">
      <div className="trip-photo-strip-scroll">
        {shown.map((photo) => (
          <button
            key={photo.key}
            type="button"
            className={`trip-photo-strip-item${photo.hasGps ? " has-gps" : ""}`}
            onClick={() => onPhotoSelect?.(photo)}
            title={photo.stopName || "Trip photo"}
          >
            <img src={photo.url} alt={photo.caption || photo.stopName || ""} loading="lazy" />
          </button>
        ))}
        {extra > 0 && tripId && (
          <Link to={`/trips/${tripId}`} className="trip-photo-strip-more">
            +{extra} more
          </Link>
        )}
      </div>
    </div>
  );
}
