import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Comments({ tripId, currentUser, onCountChange }) {
  const [comments, setComments] = useState(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listComments(tripId)
      .then(({ comments }) => setComments(comments))
      .catch(() => setComments([]));
  }, [tripId]);

  function announce(list) {
    onCountChange && onCountChange(list.length);
  }

  async function submit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError("");
    try {
      const { comment } = await api.addComment(tripId, body.trim());
      setComments((c) => {
        const next = [...c, comment];
        announce(next);
        return next;
      });
      setBody("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    try {
      await api.deleteComment(tripId, id);
      setComments((c) => {
        const next = c.filter((x) => x.id !== id);
        announce(next);
        return next;
      });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="comments" id="comments">
      <h2>Comments {comments ? `(${comments.length})` : ""}</h2>

      {currentUser && (
        <form className="comment-form" onSubmit={submit}>
          <div className="avatar sm">
            {currentUser.avatar_url ? (
              <img src={currentUser.avatar_url} alt={currentUser.username} />
            ) : (
              <span>{currentUser.username[0]?.toUpperCase()}</span>
            )}
          </div>
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            maxLength={500}
          />
          <button className="btn-primary" style={{ width: "auto" }} disabled={busy || !body.trim()}>
            {busy ? "…" : "Post"}
          </button>
        </form>
      )}

      {error && <div className="error">{error}</div>}

      {comments === null ? (
        <p className="muted">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="muted">No comments yet — be the first to say something nice.</p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment">
              <Link to={`/u/${c.author.id}`} className="avatar sm">
                {c.author.avatar_url ? (
                  <img src={c.author.avatar_url} alt={c.author.username} />
                ) : (
                  <span>{c.author.username[0]?.toUpperCase()}</span>
                )}
              </Link>
              <div className="comment-body">
                <div className="comment-head">
                  <Link to={`/u/${c.author.id}`} className="username">{c.author.username}</Link>
                  <span className="muted small">{timeAgo(c.created_at)}</span>
                  {currentUser?.id === c.author.id && (
                    <button className="link-btn danger small" onClick={() => remove(c.id)}>Delete</button>
                  )}
                </div>
                <p className="comment-text">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
