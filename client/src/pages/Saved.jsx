import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import TripCard from "../components/TripCard.jsx";

export default function Saved() {
  const [trips, setTrips] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .bookmarks()
      .then(({ trips }) => setTrips(trips))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="page"><div className="error">{error}</div></div>;

  return (
    <div className="page">
      <div className="page-head">
        <h1>Saved trips</h1>
        <p className="muted">Trips you've bookmarked for inspiration — add any itinerary to your trip planner.</p>
      </div>

      {trips === null ? (
        <div className="muted">Loading…</div>
      ) : trips.length === 0 ? (
        <div className="card empty-state">
          <p className="muted">No saved trips yet.</p>
          <p className="muted small">
            Tap <b>Save</b> on any trip in your <Link to="/">feed</Link> to bookmark it here.
          </p>
        </div>
      ) : (
        <div className="feed-list">
          {trips.map((t) => (
            <TripCard key={t.id} trip={t} showPlannerCopy />
          ))}
        </div>
      )}
    </div>
  );
}
