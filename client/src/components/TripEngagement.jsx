import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import Comments from "./Comments.jsx";
import { IconBookmark, IconComment, IconLike, IconShare } from "./EngagementIcons.jsx";

function formatCount(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 10000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export default function TripEngagement({
  trip,
  currentUser,
  variant = "feed",
  showSave = true,
  showComments = true,
  onCommentCountChange,
}) {
  const [likes, setLikes] = useState(trip.kudos ?? 0);
  const [liked, setLiked] = useState(!!trip.likedByViewer);
  const [saved, setSaved] = useState(!!trip.bookmarkedByViewer);
  const [commentCount, setCommentCount] = useState(trip.commentCount ?? 0);
  const [commentsOpen, setCommentsOpen] = useState(variant === "detail");
  const [shareLabel, setShareLabel] = useState("Share");
  const [likeBusy, setLikeBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  async function toggleLike(e) {
    e?.preventDefault();
    e?.stopPropagation();
    if (likeBusy || !currentUser) return;
    setLikeBusy(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((n) => (wasLiked ? Math.max(0, n - 1) : n + 1));
    try {
      const res = await api.toggleKudos(trip.id);
      setLikes(res.kudos);
      setLiked(res.liked);
    } catch {
      setLiked(wasLiked);
      setLikes((n) => (wasLiked ? n + 1 : Math.max(0, n - 1)));
    } finally {
      setLikeBusy(false);
    }
  }

  async function toggleSave(e) {
    e?.preventDefault();
    e?.stopPropagation();
    if (saveBusy || !currentUser) return;
    setSaveBusy(true);
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      const { bookmarked } = await api.toggleBookmark(trip.id);
      setSaved(bookmarked);
    } catch {
      setSaved(wasSaved);
    } finally {
      setSaveBusy(false);
    }
  }

  async function share(e) {
    e?.preventDefault();
    e?.stopPropagation();
    const url = `${window.location.origin}/trips/${trip.id}`;
    const data = { title: trip.title ? `${trip.title} · Trekkit` : "A trip on Trekkit", url };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        /* fall through */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareLabel("Copied");
      setTimeout(() => setShareLabel("Share"), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  function handleCommentCountChange(count) {
    setCommentCount(count);
    onCommentCountChange?.(count);
  }

  function toggleComments(e) {
    e?.preventDefault();
    e?.stopPropagation();
    setCommentsOpen((v) => !v);
  }

  const counts = [];
  if (likes > 0) counts.push(`${formatCount(likes)} like${likes === 1 ? "" : "s"}`);
  if (commentCount > 0) counts.push(`${formatCount(commentCount)} comment${commentCount === 1 ? "" : "s"}`);

  return (
    <div className={`trip-engagement trip-engagement-${variant}`}>
      {counts.length > 0 && (
        <div className="engagement-counts">
          {counts.map((text, i) => (
            <span key={text}>
              {i > 0 && <span className="engagement-count-sep"> · </span>}
              <button
                type="button"
                className="engagement-count-link"
                onClick={text.includes("comment") ? () => setCommentsOpen(true) : undefined}
              >
                {text}
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="engagement-actions" role="group" aria-label="Trip actions">
        <button
          type="button"
          className={`engagement-btn${liked ? " is-active" : ""}`}
          onClick={toggleLike}
          disabled={!currentUser || likeBusy}
          aria-pressed={liked}
          aria-label={liked ? "Unlike trip" : "Like trip"}
          title={currentUser ? (liked ? "Unlike" : "Like") : "Sign in to like"}
        >
          <IconLike filled={liked} />
          <span className="engagement-btn-label">Like</span>
        </button>

        {showComments && (
          <button
            type="button"
            className={`engagement-btn${commentsOpen ? " is-active" : ""}`}
            onClick={toggleComments}
            aria-expanded={commentsOpen}
            aria-label="Comments"
          >
            <IconComment />
            <span className="engagement-btn-label">Comment</span>
          </button>
        )}

        <button
          type="button"
          className="engagement-btn"
          onClick={share}
          aria-label="Share trip"
        >
          <IconShare />
          <span className="engagement-btn-label">{shareLabel}</span>
        </button>

        {showSave && currentUser && (
          <button
            type="button"
            className={`engagement-btn engagement-btn-save${saved ? " is-active" : ""}`}
            onClick={toggleSave}
            disabled={saveBusy}
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved" : "Save trip"}
          >
            <IconBookmark filled={saved} />
            <span className="engagement-btn-label">{saved ? "Saved" : "Save"}</span>
          </button>
        )}
      </div>

      {!currentUser && variant === "feed" && (
        <p className="engagement-signin muted small">
          <Link to="/login">Sign in</Link> to like and comment
        </p>
      )}

      {showComments && commentsOpen && (
        <div className="engagement-comments" id={`comments-${trip.id}`}>
          <Comments
            tripId={trip.id}
            tripAuthorId={trip.author?.id ?? trip.user_id}
            currentUser={currentUser}
            onCountChange={handleCommentCountChange}
            compact={variant === "feed"}
          />
        </div>
      )}
    </div>
  );
}
