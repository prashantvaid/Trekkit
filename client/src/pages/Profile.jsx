import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import TripCard from "../components/TripCard.jsx";
import PostCard from "../components/PostCard.jsx";
import { instagramUrl } from "../instagramUtils.js";
import { loadPrefs } from "../settingsPrefs.js";
import { PROFILE_HIGHLIGHTS } from "../profileStats.js";

function formatBirthday(d) {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return d;
  }
}

export default function Profile() {
  const { userId } = useParams();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [trips, setTrips] = useState([]);
  const [posts, setPosts] = useState([]);
  const [savedTrips, setSavedTrips] = useState([]);
  const [error, setError] = useState("");

  function load() {
    Promise.all([api.getProfile(userId), api.userTrips(userId), api.userPosts(userId)])
      .then(async ([{ user }, { trips: userTrips }, { posts: userPosts }]) => {
        setProfile(user);
        setTrips(userTrips);
        setPosts(userPosts);
        if (me?.id === userId) {
          const { trips: bookmarked } = await api.bookmarks();
          setSavedTrips(bookmarked);
        } else {
          setSavedTrips([]);
        }
      })
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, me?.id]);

  useEffect(() => {
    if (window.location.hash !== "#saved") return;
    const el = document.getElementById("saved");
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(t);
  }, [savedTrips, profile]);

  async function toggleFollow() {
    if (profile.isFollowing) await api.unfollow(profile.id);
    else await api.follow(profile.id);
    load();
  }

  if (error) return <div className="page"><div className="error">{error}</div></div>;
  if (!profile) return <div className="page"><div className="muted">Loading…</div></div>;

  const isMe = me?.id === profile.id;
  const stats = profile.stats || {};
  const prefs = loadPrefs();
  const showHighlights = !isMe || prefs.showTripStats !== false;
  const hasHighlights = showHighlights && PROFILE_HIGHLIGHTS.some((h) => (stats[h.key] ?? 0) > 0);

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
            <p className="muted small profile-meta">Born {formatBirthday(profile.birthday)}</p>
          )}
          {profile.instagram && (
            <a
              href={instagramUrl(profile.instagram)}
              className="profile-instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              @{profile.instagram}
            </a>
          )}
          <div className="profile-social">
            <span><strong>{profile.followingCount}</strong> following</span>
            <span><strong>{profile.followerCount}</strong> followers</span>
          </div>
          {hasHighlights && (
            <div className="profile-highlights">
              {PROFILE_HIGHLIGHTS.map((h) => {
                const value = stats[h.key] ?? 0;
                if (!value) return null;
                return (
                  <span key={h.key}>
                    <strong>{value}</strong> {h.label}
                  </span>
                );
              })}
            </div>
          )}
          {isMe && (
            <Link to="/settings" state={{ section: "stats" }} className="profile-stats-link muted small">
              View detailed stats →
            </Link>
          )}
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

      {posts.length > 0 && (
        <section className="profile-section profile-posts-section">
          <div className="page-head page-head-tight">
            <h2>{isMe ? "Your posts" : `${profile.username}'s insights`}</h2>
            {isMe && <Link to="/post" className="muted small">Create new →</Link>}
          </div>
          <div className="feed-list profile-posts-list">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

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

      {isMe && (
        <section id="saved" className="profile-section">
          <div className="page-head page-head-tight">
            <h2>Saved trips</h2>
            <p className="muted small">Trips you've bookmarked for inspiration.</p>
          </div>
          {savedTrips.length === 0 ? (
            <div className="card empty-state">
              <p className="muted">No saved trips yet.</p>
              <p className="muted small">
                Tap <b>Save</b> on any trip in your <Link to="/">feed</Link> to bookmark it here.
              </p>
            </div>
          ) : (
            <div className="feed-list">
              {savedTrips.map((t) => (
                <TripCard key={t.id} trip={t} showPlannerCopy />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
