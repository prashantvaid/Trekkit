import { useState } from "react";
import { api } from "../api.js";
import CountryPicker from "./CountryPicker.jsx";
import { getMapPresetsForCountry } from "../mapPresets.js";

export default function TripRegionSetup({ trip, onComplete }) {
  const [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (!picked) {
      setError("Choose the country you're tracking this trip in.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const mapPresets = getMapPresetsForCountry(picked.name);
      const { trip: updated } = await api.updateTrip(trip.id, {
        country: picked.name,
        country_lat: picked.lat,
        country_lng: picked.lng,
        map_presets: JSON.stringify(mapPresets),
        destination: picked.name,
        destination_lat: picked.lat,
        destination_lng: picked.lng,
      });
      onComplete(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card region-setup-card">
      <div className="region-setup-head">
        <span className="region-setup-step">Step 1</span>
        <h2>Where is this trip?</h2>
        <p className="muted">
          Pick the country first. We'll center the map and apply map presets tuned for that region.
        </p>
      </div>

      <CountryPicker picked={picked} onPick={setPicked} />

      {error && <div className="error">{error}</div>}

      <button
        type="button"
        className="btn-primary btn-lg region-confirm-btn"
        onClick={confirm}
        disabled={busy || !picked}
      >
        {busy ? "Saving…" : "Open map & start tracking"}
      </button>
    </div>
  );
}
