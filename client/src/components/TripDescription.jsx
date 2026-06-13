import { useState } from "react";
import { api } from "../api.js";

export default function TripDescription({ trip, onSaved }) {
  const [editing, setEditing] = useState(!trip.description);
  const [skipped, setSkipped] = useState(false);
  const [text, setText] = useState(trip.description || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const trimmed = text.trim();
    if (!trimmed) {
      setSkipped(true);
      setEditing(false);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { trip: updated } = await api.updateTrip(trip.id, { description: trimmed });
      onSaved(updated);
      setEditing(false);
      setSkipped(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!editing && skipped && !trip.description) {
    return (
      <div className="card trip-desc-card trip-desc-card-minimal">
        <button type="button" className="link-btn" onClick={() => { setSkipped(false); setEditing(true); }}>
          + Add a trip description
        </button>
      </div>
    );
  }

  if (!editing && trip.description) {
    return (
      <div className="card trip-desc-card">
        <div className="trip-desc-card-head">
          <h3>About this trip</h3>
          <button type="button" className="link-btn small" onClick={() => setEditing(true)}>Edit</button>
        </div>
        <p className="trip-desc-text">{trip.description}</p>
      </div>
    );
  }

  return (
    <div className="card trip-desc-card trip-desc-card-prompt">
      <h3>Tell your story</h3>
      <p className="muted">Your map is ready — add a few words about this trip when you are ready.</p>
      <label className="trip-desc-field">
        Description
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What made this trip special?"
          rows={4}
        />
      </label>
      {error && <div className="error">{error}</div>}
      <div className="trip-desc-actions">
        {trip.description && (
          <button type="button" className="btn-secondary" onClick={() => { setEditing(false); setText(trip.description || ""); }}>
            Cancel
          </button>
        )}
        <button type="button" className="btn-primary" onClick={save} disabled={busy}>
          {busy ? "Saving…" : text.trim() ? "Save description" : "Skip for now"}
        </button>
      </div>
    </div>
  );
}
