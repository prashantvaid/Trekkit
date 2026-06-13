import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { INTEREST_OPTIONS } from "../constants.js";
import DatePicker from "../components/DatePicker.jsx";
import { loadPrefs, savePrefs } from "../settingsPrefs.js";
import { todayIso } from "../dateUtils.js";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: "👤", group: "You" },
  { id: "interests", label: "Interests", icon: "✨", group: "You" },
  { id: "map", label: "Map", icon: "🗺", group: "Experience" },
  { id: "display", label: "Display", icon: "🎨", group: "Experience" },
  { id: "notifications", label: "Notifications", icon: "🔔", group: "Community" },
  { id: "privacy", label: "Privacy", icon: "🔒", group: "Community" },
  { id: "social", label: "Feed & social", icon: "👥", group: "Community" },
  { id: "account", label: "Account", icon: "🔑", group: "Account" },
];

const NEEDS_SERVER_SAVE = new Set(["profile", "interests"]);

const MAP_PRESET_OPTIONS = [
  { value: "bright", label: "Colorful city" },
  { value: "liberty", label: "Classic city" },
  { value: "apple", label: "Apple Maps" },
];

const ROUTE_STYLE_OPTIONS = [
  { value: "animated", label: "Animated route" },
  { value: "solid", label: "Solid route" },
  { value: "hidden", label: "Hide route" },
];

function SoonRow({ title, desc }) {
  return (
    <div className="settings-toggle disabled">
      <div>
        <strong>{title}</strong>
        {desc && <p className="muted small">{desc}</p>}
      </div>
      <span className="soon-pill">Soon</span>
    </div>
  );
}

function PrefToggle({ prefKey, title, desc, prefs, setPref, soon }) {
  if (soon) return <SoonRow title={title} desc={desc} />;
  return (
    <label className="settings-toggle">
      <div>
        <strong>{title}</strong>
        {desc && <p className="muted small">{desc}</p>}
      </div>
      <input
        type="checkbox"
        checked={!!prefs[prefKey]}
        onChange={(e) => setPref(prefKey, e.target.checked)}
      />
    </label>
  );
}

function PrefSelect({ prefKey, title, desc, options, prefs, setPref, soon }) {
  if (soon) {
    return (
      <div className="settings-field disabled">
        <div className="settings-field-head">
          <strong>{title}</strong>
          {desc && <span className="muted small">{desc}</span>}
        </div>
        <span className="soon-pill">Soon</span>
      </div>
    );
  }
  return (
    <label className="settings-field">
      <div className="settings-field-head">
        <strong>{title}</strong>
        {desc && <span className="muted small">{desc}</span>}
      </div>
      <select value={prefs[prefKey] ?? ""} onChange={(e) => setPref(prefKey, e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <div className="settings-group">
      {title && <p className="settings-group-title">{title}</p>}
      <div className="settings-toggles">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { user, setUser } = useAuth();
  const [section, setSection] = useState("profile");
  const [form, setForm] = useState(null);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    api.me().then(({ user: u }) => {
      setForm({
        bio: u.bio || "",
        birthday: u.birthday || "",
        interests: u.interests || [],
        avatar_url: u.avatar_url || "",
        username: u.username,
        email: u.email,
        created_at: u.created_at,
      });
    });
  }, []);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  }

  function toggleInterest(tag) {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(tag)
        ? f.interests.filter((t) => t !== tag)
        : [...f.interests, tag],
    }));
    setSaved(false);
  }

  function setPref(k, v) {
    setPrefs((p) => {
      const next = { ...p, [k]: v };
      savePrefs(next);
      return next;
    });
    setPrefsSaved(true);
    setSaved(false);
    window.setTimeout(() => setPrefsSaved(false), 2000);
  }

  async function handleAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { url } = await api.uploadImage(file);
      set("avatar_url", url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save(e) {
    e.preventDefault();
    if (!NEEDS_SERVER_SAVE.has(section)) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const { user: updated } = await api.updateMe({
        bio: form.bio,
        birthday: form.birthday || undefined,
        interests: form.interests,
        avatar_url: form.avatar_url || undefined,
      });
      setUser(updated);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!form) return <div className="page"><div className="muted">Loading settings…</div></div>;

  const memberSince = form.created_at
    ? new Date(form.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;
  const active = SECTIONS.find((s) => s.id === section);
  const railGroups = [...new Set(SECTIONS.map((s) => s.group))];

  return (
    <div className="settings-dashboard">
      <aside className="settings-rail">
        <p className="settings-rail-title">Settings</p>
        {railGroups.map((group) => (
          <div key={group} className="settings-rail-group">
            <p className="settings-rail-group-label">{group}</p>
            {SECTIONS.filter((s) => s.group === group).map((s) => (
              <button
                key={s.id}
                type="button"
                className={`settings-nav-item ${section === s.id ? "active" : ""}`}
                onClick={() => setSection(s.id)}
              >
                <span className="settings-nav-icon">{s.icon}</span>
                <span className="settings-nav-label">{s.label}</span>
              </button>
            ))}
          </div>
        ))}
      </aside>

      <div className="settings-content">
        <div className="settings-header">
          <h1>{active?.label}</h1>
          <Link to={`/u/${user.id}`} className="settings-profile-link muted small">View profile →</Link>
        </div>

        <form className="settings-main" onSubmit={save}>
          {section === "profile" && (
            <section className="card settings-panel">
              <div className="avatar-upload">
                <div className="avatar-preview">
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="avatar preview" />
                  ) : (
                    <span>{form.username[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="avatar-upload-actions">
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
                  <button type="button" className="btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? "Uploading…" : form.avatar_url ? "Change photo" : "Add photo"}
                  </button>
                  <span className="muted small">JPG/PNG, up to 8MB</span>
                </div>
              </div>
              <DatePicker
                label="Birthday"
                hint="Optional — shows on your profile"
                value={form.birthday}
                onChange={(v) => set("birthday", v)}
                placeholder="Select your birthday"
                max={todayIso()}
                min="1920-01-01"
              />
              <label>Bio
                <textarea
                  value={form.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  placeholder="What kind of traveler are you?"
                  rows={3}
                />
              </label>
              <SoonRow title="Home city" desc="Bias search and recommendations toward your area." />
              <SoonRow title="Travel links" desc="Instagram, blog, or link-in-bio on your profile." />
            </section>
          )}

          {section === "interests" && (
            <section className="card settings-panel">
              <p className="muted small settings-hint">
                Powers <Link to="/recommended">For You</Link> suggestions.
              </p>
              <div className="chips settings-chips">
                {INTEREST_OPTIONS.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    className={`chip ${form.interests.includes(tag) ? "active" : ""}`}
                    onClick={() => toggleInterest(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <p className="muted small settings-hint">{form.interests.length} selected</p>
              <SoonRow title="Budget style" desc="Backpacker, comfort, or luxury — tune destination picks." />
              <SoonRow title="Typical trip length" desc="Weekend, one week, or month-long adventures." />
            </section>
          )}

          {section === "map" && (
            <section className="card settings-panel">
              <p className="muted small settings-hint">Defaults for new trips. Saved on this device.</p>
              <SettingsGroup title="Map style">
                <PrefSelect
                  prefKey="defaultMapPreset"
                  title="Map preset"
                  desc="Starting basemap when you create a trip"
                  options={MAP_PRESET_OPTIONS}
                  prefs={prefs}
                  setPref={setPref}
                />
                <PrefSelect
                  prefKey="defaultRouteStyle"
                  title="Route line"
                  desc="How routes draw between stops"
                  options={ROUTE_STYLE_OPTIONS}
                  prefs={prefs}
                  setPref={setPref}
                />
                <PrefSelect
                  prefKey="distanceUnits"
                  title="Distance units"
                  desc="Kilometers or miles in map UI"
                  options={[
                    { value: "km", label: "Kilometers" },
                    { value: "mi", label: "Miles" },
                  ]}
                  prefs={prefs}
                  setPref={setPref}
                />
              </SettingsGroup>
              <SettingsGroup title="Photos & pins">
                <PrefToggle
                  prefKey="autoPhotoGps"
                  title="Read GPS from photos"
                  desc="Extract location from EXIF when you upload"
                  prefs={prefs}
                  setPref={setPref}
                />
                <PrefToggle
                  prefKey="showPhotoPinsOnMap"
                  title="Show all photos on map"
                  desc="Pin every upload; without GPS, cluster at stops"
                  prefs={prefs}
                  setPref={setPref}
                />
                <SoonRow title="Default map zoom" desc="How close the camera starts on new trips." />
                <SoonRow title="Offline map tiles" desc="Download regions for use without signal." />
              </SettingsGroup>
            </section>
          )}

          {section === "display" && (
            <section className="card settings-panel">
              <SettingsGroup title="Appearance">
                <PrefToggle prefKey="compactFeed" title="Compact feed" desc="Smaller cards with less padding" prefs={prefs} setPref={setPref} soon />
                <PrefToggle prefKey="darkMode" title="Dark mode" desc="Easier on the eyes at night" prefs={prefs} setPref={setPref} soon />
                <PrefToggle prefKey="reduceMotion" title="Reduce motion" desc="Less animation on maps and globes" prefs={prefs} setPref={setPref} soon />
                <PrefSelect
                  prefKey="language"
                  title="Language"
                  desc="App language"
                  options={[{ value: "en", label: "English" }]}
                  prefs={prefs}
                  setPref={setPref}
                  soon
                />
              </SettingsGroup>
              <SettingsGroup title="Accessibility">
                <SoonRow title="Larger text" desc="Increase font size across the app." />
                <SoonRow title="High contrast" desc="Stronger borders and focus states." />
              </SettingsGroup>
            </section>
          )}

          {section === "notifications" && (
            <section className="card settings-panel">
              <SettingsGroup title="Email">
                <PrefToggle prefKey="emailKudos" title="Kudos on your trips" prefs={prefs} setPref={setPref} soon />
                <PrefToggle prefKey="emailComments" title="New comments" prefs={prefs} setPref={setPref} soon />
                <PrefToggle prefKey="emailFollowers" title="New followers" prefs={prefs} setPref={setPref} soon />
                <PrefToggle prefKey="emailDigest" title="Weekly digest" desc="Top trips from people you follow" prefs={prefs} setPref={setPref} soon />
              </SettingsGroup>
              <SettingsGroup title="Push & in-app">
                <PrefToggle prefKey="pushNotifications" title="Push notifications" prefs={prefs} setPref={setPref} soon />
                <SoonRow title="In-app notification center" desc="Bell icon with a history of activity." />
                <SoonRow title="Trip reminders" desc="Nudge to add photos after a stop." />
              </SettingsGroup>
            </section>
          )}

          {section === "privacy" && (
            <section className="card settings-panel">
              <SettingsGroup title="Trips">
                <PrefToggle
                  prefKey="defaultPublic"
                  title="Public trips by default"
                  desc="New trips start visible on the feed"
                  prefs={prefs}
                  setPref={setPref}
                />
                <PrefToggle prefKey="hideStopCoordinates" title="Hide exact coordinates" desc="Show stop names only on shared trips" prefs={prefs} setPref={setPref} soon />
                <SoonRow title="Blur home location" desc="Offset pins near your home address." />
              </SettingsGroup>
              <SettingsGroup title="Profile">
                <PrefToggle prefKey="profileDiscoverable" title="Discoverable profile" desc="Appear in friend suggestions" prefs={prefs} setPref={setPref} soon />
                <PrefToggle prefKey="showTripStats" title="Show travel stats" desc="Trips, countries, and photos on profile" prefs={prefs} setPref={setPref} soon />
                <SoonRow title="Blocked accounts" desc="Manage users who can't interact with you." />
              </SettingsGroup>
            </section>
          )}

          {section === "social" && (
            <section className="card settings-panel">
              <SettingsGroup title="Feed">
                <PrefToggle prefKey="feedFollowingOnly" title="Following only" desc="Hide recommended trips from feed" prefs={prefs} setPref={setPref} soon />
                <PrefToggle prefKey="showSuggestedTravelers" title="Suggested travelers" desc="Show people to follow on Home" prefs={prefs} setPref={setPref} soon />
                <SoonRow title="Mute trip updates" desc="Hide a friend's trips without unfollowing." />
              </SettingsGroup>
              <SettingsGroup title="Interactions">
                <PrefToggle prefKey="allowComments" title="Allow comments" desc="Others can comment on your trips" prefs={prefs} setPref={setPref} soon />
                <PrefToggle prefKey="allowKudos" title="Allow kudos" desc="Others can cheer your trips" prefs={prefs} setPref={setPref} soon />
                <SoonRow title="Auto-follow back" desc="Follow people who follow you." />
                <SoonRow title="Who can message you" desc="Friends only or no one." />
              </SettingsGroup>
            </section>
          )}

          {section === "account" && (
            <section className="card settings-panel">
              <div className="settings-kv">
                <div className="settings-kv-row">
                  <span className="settings-label">Username</span>
                  <span>{form.username}</span>
                </div>
                <div className="settings-kv-row">
                  <span className="settings-label">Email</span>
                  <span>{form.email}</span>
                </div>
                {memberSince && (
                  <div className="settings-kv-row">
                    <span className="settings-label">Member since</span>
                    <span>{memberSince}</span>
                  </div>
                )}
              </div>
              <SettingsGroup title="Security">
                <SoonRow title="Change password" desc="Update your login password." />
                <SoonRow title="Two-factor authentication" desc="Extra security for your account." />
                <SoonRow title="Active sessions" desc="See devices logged into Trekkit." />
              </SettingsGroup>
              <SettingsGroup title="Data">
                <SoonRow title="Export my trips" desc="Download JSON of trips, stops, and photos." />
                <SoonRow title="Download account data" desc="GDPR-style copy of your data." />
                <SoonRow title="Delete account" desc="Permanently remove your profile and trips." />
              </SettingsGroup>
            </section>
          )}

          <div className="settings-footer card">
            {error && <div className="error">{error}</div>}
            <div className="settings-footer-actions">
              <div className="settings-footer-meta">
                {saved && <span className="settings-saved">✓ Profile saved</span>}
                {prefsSaved && !saved && <span className="settings-saved">✓ Preference saved</span>}
                <span className="muted small">
                  {NEEDS_SERVER_SAVE.has(section)
                    ? "Profile saves to your account. Other prefs save on this device."
                    : "Preferences save automatically on this device."}
                </span>
              </div>
              {NEEDS_SERVER_SAVE.has(section) && (
                <button type="submit" className="btn-primary btn-sm" disabled={busy}>
                  {busy ? "Saving…" : "Save changes"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
