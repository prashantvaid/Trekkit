import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import PostCard from "../components/PostCard.jsx";

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .getPost(postId)
      .then(({ post: p }) => setPost(p))
      .catch((e) => setError(e.message));
  }, [postId]);

  async function handleDelete() {
    if (!window.confirm("Delete this post?")) return;
    setDeleting(true);
    try {
      await api.deletePost(postId);
      navigate("/");
    } catch (e) {
      setError(e.message);
      setDeleting(false);
    }
  }

  if (error) return <div className="page"><div className="error">{error}</div></div>;
  if (!post) return <div className="page"><div className="muted">Loading…</div></div>;

  const isOwner = user?.id === post.user_id;

  return (
    <div className="page page-compact">
      <div className="page-head page-head-tight">
        <Link to="/" className="muted small">← Back to feed</Link>
        {isOwner && (
          <button type="button" className="link-btn danger small" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete post"}
          </button>
        )}
      </div>
      <PostCard post={post} detail />
    </div>
  );
}
