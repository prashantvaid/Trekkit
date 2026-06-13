import { Link } from "react-router-dom";

// A reusable traveler card (avatar, name, bio, shared interests, follow toggle).
// Used on the Friends page for search results, suggestions, and the following list.
export default function PersonCard({ u, onToggle }) {
  return (
    <div className="person-card">
      <Link to={`/u/${u.id}`} className="avatar lg">
        {u.avatar_url ? <img src={u.avatar_url} alt={u.username} /> : <span>{u.username[0]?.toUpperCase()}</span>}
      </Link>
      <Link to={`/u/${u.id}`} className="username person-name">{u.username}</Link>
      {u.bio && <p className="muted small person-bio">{u.bio}</p>}
      {u.shared?.length > 0 && (
        <div className="person-shared">
          {u.shared.slice(0, 3).map((t) => (
            <span key={t} className="chip static active">{t}</span>
          ))}
        </div>
      )}
      <button
        className={`person-follow ${u.following ? "btn-secondary" : "btn-primary"}`}
        onClick={() => onToggle(u)}
      >
        {u.following ? "Following" : "+ Follow"}
      </button>
    </div>
  );
}
