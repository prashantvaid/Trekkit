import { Link } from "react-router-dom";

export function collectTripPhotos(trip) {
  return (trip.stops || []).flatMap((stop, si) =>
    (stop.photos || []).flatMap((photo, pi) => {
      const hasGps = Number.isFinite(photo.lat) && Number.isFinite(photo.lng);
      const lat = hasGps ? Number(photo.lat) : Number(stop.lat);
      const lng = hasGps ? Number(photo.lng) : Number(stop.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
      return [{
        ...photo,
        lat,
        lng,
        hasGps,
        stopName: stop.name,
        key: `${stop.id || si}-${photo.id || pi}`,
      }];
    })
  );
}

export default function TripPhotoCollage({ photos, tripId, max = 5 }) {
  if (!photos.length) return null;

  const shown = photos.slice(0, max);
  const extra = photos.length - shown.length;
  const layout = Math.min(shown.length, 5);

  return (
    <Link to={`/trips/${tripId}`} className={`feed-photo-collage layout-${layout}`}>
      {shown.map((photo, i) => (
        <div key={photo.key} className="collage-cell">
          <img src={photo.url} alt={photo.caption || photo.stopName || "Trip photo"} loading="lazy" />
          {i === shown.length - 1 && extra > 0 && (
            <span className="collage-more">+{extra} more</span>
          )}
        </div>
      ))}
    </Link>
  );
}
