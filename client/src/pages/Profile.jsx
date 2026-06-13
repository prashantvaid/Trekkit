import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import TripCard from "../components/TripCard.jsx";

function formatBirthday(d) {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return d;
  }
}

const METRIC_DEFS = [
  { key: "tripCount", label: "Trips", icon: "🗺" },
  { key: "stopCount", label: "Stops", icon: "📍" },
  { key: "photoCount", label: "Photos", icon: "📷" },
  { key: "countryCount", label: "Countries", icon: "🌍" },
  { key: "daysTraveled", label: "Days traveled", icon: "📅" },
  { key: "kudosReceived", label: "Kudos", icon: "👏" },
  { key: "commentsReceived", label: "Comments", icon: "💬" },
  { key: "followerCount", label: "Followers", icon: "👥" },
];

export default function Profile() {
  const { userId } = useParams();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState("");

  function load() {
    Promise.all([api.getProfile(userId), api.userTrips(userId)])
      .then(([{ user }, { trips }]) => {
        setProfile(user);
        setTrips(trips);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function toggleFollow() {
    if (profile.isFollowing) await api.unfollow(profile.id);
    else await api.follow(profile.id);
    load();
  }

  if (error) return <div className="page"><div className="error">{error}</div></div>;
  if (!profile) return <div className="page"><div className="muted">Loading…</div></div>;

  const isMe = me?.id === profile.id;
  const stats = profile.stats || {};
  const metrics = METRIC_DEFS.map((m) => ({
    ...m,
    value: m.key === "followerCount" ? profile.followerCount : (stats[m.key] ?? 0),
  }));

  return (
    <div className="page page-compact">
      <div className="card profile-head">
        <div className="avatar lg">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} />
          ) : (
            <span>{profile.username[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="profile-info">
          <div className="profile-title-row">
            <h1>{profile.username}</h1>
            {isMe && <Link to="/settings" className="profile-edit-link muted small">Edit</Link>}
          </div>
          {profile.bio && <p className="muted profile-bio">{profile.bio}</p>}
          {profile.birthday && (
            <p className="muted small profile-meta">🎂 {formatBirthday(profile.birthday)}</p>
          )}
          <div className="profile-social">
            <span><strong>{profile.followingCount}</strong> following</span>
          </div>
          {profile.interests?.length > 0 && (
            <div className="profile-interests">
              {profile.interests.map((tag) => (
                <span key={tag} className="chip static">{tag}</span>
              ))}
            </div>
          )}
        </div>
        {!isMe && (
          <button className={profile.isFollowing ? "btn-secondary btn-sm" : "btn-primary btn-sm"} onClick={toggleFollow}>
            {profile.isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      <div className="profile-metrics">
        {metrics.map((m) => (
          <div key={m.key} className="profile-metric">
            <span className="profile-metric-icon" aria-hidden>{m.icon}</span>
            <span className="profile-metric-value">{m.value}</span>
            <span className="profile-metric-label">{m.label}</span>
          </div>
        ))}
      </div>

      <div className="page-head page-head-tight">
        <h2>{isMe ? "Your trips" : `${profile.username}'s trips`}</h2>
        {!isMe && profile.stats?.tripCount !== trips.length && (
          <span className="muted small">{profile.stats?.tripCount ?? trips.length} public</span>
        )}
      </div>

      {trips.length === 0 ? (
        <div className="card empty-state"><p className="muted">No trips to show yet.</p></div>
      ) : (
        <div className="feed-list">
          {trips.map((t) => (
            <TripCard key={t.id} trip={t} />
          ))}
        </div>
      )}
    </div>
  );
}
