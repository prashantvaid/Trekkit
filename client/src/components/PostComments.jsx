import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { IconSend } from "./EngagementIcons.jsx";

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function PostComments({ postId, currentUser, onCountChange, compact = false, postAuthorId }) {
  const [comments, setComments] = useState(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listPostComments(postId)
      .then(({ comments: list }) => {
        setComments(list);
        onCountChange?.(list.length);
      })
      .catch(() => {
        setComments([]);
        onCountChange?.(0);
      });
  }, [postId]);

  async function submit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError("");
    try {
      const { comment } = await api.addPostComment(postId, body.trim());
      setComments((c) => {
        const next = [...c, comment];
        onCountChange?.(next.length);
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
      await api.deletePostComment(postId, id);
      setComments((c) => {
        const next = c.filter((x) => x.id !== id);
        onCountChange?.(next.length);
        return next;
      });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className={`comments${compact ? " comments-compact" : ""}`}>
      {!compact && <h3 className="comments-title">Comments</h3>}

      {currentUser ? (
        <form className="comment-compose" onSubmit={submit}>
          <div className="avatar sm">
            {currentUser.avatar_url ? (
              <img src={currentUser.avatar_url} alt={currentUser.username} />
            ) : (
              <span>{currentUser.username[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="comment-compose-field">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add a comment…"
              maxLength={500}
              aria-label="Comment"
            />
            <button
              type="submit"
              className="comment-send"
              disabled={busy || !body.trim()}
              aria-label="Post comment"
            >
              <IconSend />
            </button>
          </div>
        </form>
      ) : (
        <p className="muted small comments-signin">
          <Link to="/login">Sign in</Link> to join the conversation.
        </p>
      )}

      {error && <div className="error comments-error">{error}</div>}

      {comments === null ? (
        <p className="muted small comments-loading">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="muted small comments-empty">No comments yet.</p>
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
                  <Link to={`/u/${c.author.id}`} className="comment-author">{c.author.username}</Link>
                  <span className="comment-time">{timeAgo(c.created_at)}</span>
                  {currentUser && (currentUser.id === c.author.id || currentUser.id === postAuthorId) && (
                    <button type="button" className="comment-delete" onClick={() => remove(c.id)}>
                      Delete
                    </button>
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
