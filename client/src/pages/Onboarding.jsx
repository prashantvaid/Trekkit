import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { api } from "../api.js";
import LandingGlobe from "../components/LandingGlobe.jsx";
import { INTEREST_OPTIONS } from "../constants.js";
import DatePicker from "../components/DatePicker.jsx";
import { todayIso } from "../dateUtils.js";

export default function Onboarding() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ bio: "", birthday: "", interests: [], avatar_url: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  function updateProfile(k, v) {
    setProfile((p) => ({ ...p, [k]: v }));
  }
  function toggleInterest(tag) {
    setProfile((p) => ({
      ...p,
      interests: p.interests.includes(tag)
        ? p.interests.filter((t) => t !== tag)
        : [...p.interests, tag],
    }));
  }

  async function handleAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { url } = await api.uploadImage(file);
      updateProfile("avatar_url", url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function finishProfile(e) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { user } = await api.updateMe({
        bio: profile.bio || undefined,
        birthday: profile.birthday || undefined,
        interests: profile.interests,
        avatar_url: profile.avatar_url || undefined,
      });
      setUser(user);
      navigate("/");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  function skipProfile() {
    navigate("/");
  }

  return (
    <div className="auth-page">
      <aside className="auth-side">
        <Link to="/" className="auth-back">← Back to home</Link>
        <div className="auth-side-globe">
          <LandingGlobe size={360} />
        </div>
        <h2 className="auth-side-title">Welcome aboard{user ? `, ${user.username}` : ""}! 🎉</h2>
        <p className="auth-side-text">
          Your account is ready. Add a few details so fellow travelers get to know you.
        </p>
      </aside>

      <div className="auth-main">
        <form className="auth-form" onSubmit={finishProfile}>
          <h1 className="auth-title">Set up your profile</h1>
          <p className="auth-subtitle muted">You can always change these later in your profile.</p>

          <div className="avatar-upload">
            <div className="avatar-preview">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar preview" />
              ) : (
                <span>{user?.username?.[0]?.toUpperCase() || "🙂"}</span>
              )}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
              <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? "Uploading…" : profile.avatar_url ? "Change photo" : "Add profile photo"}
              </button>
              <p className="muted small" style={{ margin: "8px 0 0" }}>JPG or PNG, up to 8MB.</p>
            </div>
          </div>

          <DatePicker
            label="Birthday"
            hint="Optional"
            value={profile.birthday}
            onChange={(v) => updateProfile("birthday", v)}
            placeholder="Select your birthday"
            max={todayIso()}
            min="1920-01-01"
          />

          <label>Bio
            <textarea
              value={profile.bio}
              onChange={(e) => updateProfile("bio", e.target.value)}
              placeholder="Tell people what kind of traveler you are…"
              rows={3}
            />
          </label>

          <div className="interests-label">Interests <span className="muted small">(pick a few)</span></div>
          <div className="chips">
            {INTEREST_OPTIONS.map((tag) => (
              <button
                type="button"
                key={tag}
                className={`chip ${profile.interests.includes(tag) ? "active" : ""}`}
                onClick={() => toggleInterest(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          {error && <div className="error">{error}</div>}

          <button className="btn-primary" disabled={busy}>
            {busy ? "Finishing…" : "Finish & start exploring"}
          </button>
          <p className="auth-foot">
            <button type="button" className="link-inline" onClick={skipProfile} disabled={busy}>
              Skip for now
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
