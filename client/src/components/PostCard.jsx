import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import PostEngagement from "./PostEngagement.jsx";

function fmtDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return null;
  }
}

function excerpt(body, max = 320) {
  const text = (body || "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export default function PostCard({ post, detail = false }) {
  const { user } = useAuth();
  const posted = fmtDate(post.posted_at);

  return (
    <article className="card post-card feed-post">
      <header className="trip-card-head">
        <Link to={`/u/${post.author.id}`} className="avatar">
          {post.author.avatar_url ? (
            <img src={post.author.avatar_url} alt={post.author.username} />
          ) : (
            <span>{post.author.username[0]?.toUpperCase()}</span>
          )}
        </Link>
        <div className="trip-card-meta">
          <Link to={`/u/${post.author.id}`} className="username">{post.author.username}</Link>
          <div className="trip-card-sub muted small">
            {posted && <span>{posted}</span>}
            {post.topic && (
              <>
                {posted && <span className="dot-sep">·</span>}
                <span className="post-topic-tag">{post.topic}</span>
              </>
            )}
            <span className="dot-sep">·</span>
            <span className="post-type-label">Insight</span>
          </div>
        </div>
        <Link to={`/posts/${post.id}`} className="feed-post-link">View post</Link>
      </header>

      <Link to={`/posts/${post.id}`} className="post-card-body-link">
        {post.title && <h2 className="post-card-title">{post.title}</h2>}
        <p className={`post-card-text${detail ? " post-card-text-detail" : ""}`}>
          {detail ? post.body : excerpt(post.body)}
        </p>
      </Link>

      {post.cover_url && (
        <Link to={`/posts/${post.id}`} className="post-card-cover">
          <img src={post.cover_url} alt="" loading="lazy" />
        </Link>
      )}

      <PostEngagement post={post} currentUser={user} variant={detail ? "detail" : "feed"} />
    </article>
  );
}
