import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import TripCard from "../components/TripCard.jsx";
import PostCard from "../components/PostCard.jsx";

export default function Feed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api.feed()
      .then(({ items: feedItems }) => setItems(feedItems || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Your feed</h1>
          <p className="muted">Trips and insights from you and people you follow.</p>
        </div>
      </div>

      {loading && <div className="muted">Loading…</div>}
      {error && <div className="error">{error}</div>}

      {!loading && items.length === 0 && (
        <div className="card empty-state">
          <p>Nothing here yet.</p>
          <p className="muted">
            Follow travelers on <Link to="/friends">Friends</Link>, or{" "}
            <Link to="/post">create your first post</Link>.
          </p>
        </div>
      )}

      <div className="feed-list">
        {items.map((item) =>
          item.type === "post" ? (
            <PostCard key={`post-${item.post.id}`} post={item.post} />
          ) : (
            <TripCard key={`trip-${item.trip.id}`} trip={item.trip} />
          )
        )}
      </div>
    </div>
  );
}
