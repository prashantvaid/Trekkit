import { Link } from "react-router-dom";

const OPTIONS = [
  {
    to: "/trips/new",
    icon: "🗺️",
    title: "Track a trip",
    desc: "Pick where you're going, build a route on the 3D map, and share stops and photos.",
    cta: "Start tracking",
  },
  {
    to: "/posts/new",
    icon: "✍️",
    title: "Write a post",
    desc: "Share travel tips, culture notes, or advice — like a short blog or LinkedIn post.",
    cta: "Start writing",
  },
];

export default function CreatePost() {
  return (
    <div className="page create-post-page">
      <div className="create-post-container">
        <header className="create-post-head">
          <span className="nt-badge">Create</span>
          <h1>What do you want to share?</h1>
          <p className="muted small">Track a journey on the map, or write an insight for other travelers.</p>
        </header>

        <div className="create-post-options">
          {OPTIONS.map((opt) => (
            <Link key={opt.to} to={opt.to} className="card create-post-option">
              <span className="create-post-option-icon" aria-hidden>{opt.icon}</span>
              <div className="create-post-option-copy">
                <strong>{opt.title}</strong>
                <p className="muted small">{opt.desc}</p>
                <span className="create-post-option-cta">{opt.cta} →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
