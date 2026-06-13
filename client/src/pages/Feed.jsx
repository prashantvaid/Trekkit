import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import TripCard from "../components/TripCard.jsx";

export default function Feed() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api.feed()
      .then(({ trips }) => setTrips(trips))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-head">
        <h1>Your feed</h1>
        <p className="muted">Trips from you and the people you follow.</p>
      </div>

      {loading && <div className="muted">Loading…</div>}
      {error && <div className="error">{error}</div>}

      {!loading && trips.length === 0 && (
        <div className="card empty-state">
          <p>Nothing here yet.</p>
          <p className="muted">
            Follow travelers on <Link to="/friends">Friends</Link>, or{" "}
            <Link to="/trips/new">track your first trip</Link>.
          </p>
        </div>
      )}

      <div className="feed-list">
        {trips.map((t) => (
          <TripCard key={t.id} trip={t} />
        ))}
      </div>
    </div>
  );
}
