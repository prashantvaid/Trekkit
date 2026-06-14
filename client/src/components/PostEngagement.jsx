import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import PostComments from "./PostComments.jsx";
import { IconComment, IconLike, IconShare } from "./EngagementIcons.jsx";

function formatCount(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 10000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export default function PostEngagement({
  post,
  currentUser,
  variant = "feed",
  showComments = true,
  onCommentCountChange,
}) {
  const [likes, setLikes] = useState(post.kudos ?? 0);
  const [liked, setLiked] = useState(!!post.likedByViewer);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
  const [commentsOpen, setCommentsOpen] = useState(variant === "detail");
  const [shareLabel, setShareLabel] = useState("Share");
  const [likeBusy, setLikeBusy] = useState(false);

  async function toggleLike(e) {
    e?.preventDefault();
    e?.stopPropagation();
    if (likeBusy || !currentUser) return;
    setLikeBusy(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((n) => (wasLiked ? Math.max(0, n - 1) : n + 1));
    try {
      const res = await api.togglePostKudos(post.id);
      setLikes(res.kudos);
      setLiked(res.liked);
    } catch {
      setLiked(wasLiked);
      setLikes((n) => (wasLiked ? n + 1 : Math.max(0, n - 1)));
    } finally {
      setLikeBusy(false);
    }
  }

  async function share(e) {
    e?.preventDefault();
    e?.stopPropagation();
    const url = `${window.location.origin}/posts/${post.id}`;
    const data = {
      title: post.title ? `${post.title} · Trekkit` : "A post on Trekkit",
      url,
    };
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

      <div className="engagement-actions" role="group" aria-label="Post actions">
        <button
          type="button"
          className={`engagement-btn${liked ? " is-active" : ""}`}
          onClick={toggleLike}
          disabled={!currentUser || likeBusy}
          aria-pressed={liked}
        >
          <IconLike filled={liked} />
          <span className="engagement-btn-label">Like</span>
        </button>

        {showComments && (
          <button
            type="button"
            className={`engagement-btn${commentsOpen ? " is-active" : ""}`}
            onClick={() => setCommentsOpen((v) => !v)}
            aria-expanded={commentsOpen}
          >
            <IconComment />
            <span className="engagement-btn-label">Comment</span>
          </button>
        )}

        <button type="button" className="engagement-btn" onClick={share}>
          <IconShare />
          <span className="engagement-btn-label">{shareLabel}</span>
        </button>
      </div>

      {!currentUser && variant === "feed" && (
        <p className="engagement-signin muted small">
          <Link to="/login">Sign in</Link> to like and comment
        </p>
      )}

      {showComments && commentsOpen && (
        <div className="engagement-comments" id={`post-comments-${post.id}`}>
          <PostComments
            postId={post.id}
            postAuthorId={post.author?.id ?? post.user_id}
            currentUser={currentUser}
            onCountChange={handleCommentCountChange}
            compact={variant === "feed"}
          />
        </div>
      )}
    </div>
  );
}
