import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { POST_TOPICS } from "../constants/posts.js";
import { loadPrefs } from "../settingsPrefs.js";

function defaultPublic() {
  return loadPrefs().defaultPublic !== false;
}

export default function NewPost() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState("Travel tips");
  const [coverUrl, setCoverUrl] = useState("");
  const [isPublic, setIsPublic] = useState(defaultPublic());
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleCover(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { url } = await api.uploadImage(file);
      setCoverUrl(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!body.trim()) {
      setError("Write something to share.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { post } = await api.createPost({
        title: title.trim() || undefined,
        body: body.trim(),
        topic,
        cover_url: coverUrl || undefined,
        is_public: isPublic,
      });
      navigate(`/posts/${post.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="page new-post-page">
      <div className="new-post-container">
        <header className="new-trip-head">
          <div className="new-trip-head-copy">
            <span className="nt-badge">Share insight</span>
            <h1>Write a post</h1>
            <p className="muted small">
              Share travel tips, culture notes, or advice — like a short blog or LinkedIn post.
            </p>
          </div>
        </header>

        <form className={`card new-post-form ${busy ? "is-busy" : ""}`} onSubmit={submit}>
          <label className="settings-form-label">
            Headline <span className="muted small">(optional)</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How I plan a two-week trip on a budget"
              maxLength={120}
            />
          </label>

          <label className="settings-form-label">
            Your post
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share what you learned, a tip, or a story that helps other travelers…"
              rows={10}
              required
            />
          </label>

          <div className="new-post-topics">
            <p className="settings-form-label" style={{ marginBottom: 6 }}>Topic</p>
            <div className="chips settings-chips">
              {POST_TOPICS.map((t) => (
                <button
                  type="button"
                  key={t}
                  className={`chip ${topic === t ? "active" : ""}`}
                  onClick={() => setTopic(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="new-post-cover">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleCover} />
            {coverUrl ? (
              <div className="new-post-cover-preview">
                <img src={coverUrl} alt="" />
                <button type="button" className="link-btn small" onClick={() => setCoverUrl("")}>
                  Remove image
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-secondary settings-btn"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : "Add cover image (optional)"}
              </button>
            )}
          </div>

          <div className="visibility-toggle">
            <button type="button" className={isPublic ? "active" : ""} onClick={() => setIsPublic(true)}>
              Public
              <span className="muted small">Shows on the feed</span>
            </button>
            <button type="button" className={!isPublic ? "active" : ""} onClick={() => setIsPublic(false)}>
              Private
              <span className="muted small">Only you can see it</span>
            </button>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="new-trip-actions">
            <button type="button" className="btn-secondary btn-lg" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary btn-xl" disabled={busy}>
              {busy ? "Publishing…" : "Publish post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
