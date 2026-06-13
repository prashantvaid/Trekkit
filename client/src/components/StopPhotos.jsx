import { useRef, useState } from "react";
import exifr from "exifr";
import { api } from "../api.js";

async function readGpsFromFile(file) {
  try {
    const gps = await exifr.gps(file);
    if (gps?.latitude != null && gps?.longitude != null) {
      return { lat: gps.latitude, lng: gps.longitude };
    }
  } catch {
    /* no EXIF or unsupported format */
  }
  return null;
}

export default function StopPhotos({ tripId, stop, isOwner, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const fileRef = useRef();

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const gps = await readGpsFromFile(file);
      const { url } = await api.uploadImage(file);
      await api.addPhoto(tripId, stop.id, {
        url,
        lat: gps?.lat ?? null,
        lng: gps?.lng ?? null,
      });
      onChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function addByUrl() {
    const url = prompt("Paste an image URL:");
    if (!url) return;
    setBusy(true);
    try {
      await api.addPhoto(tripId, stop.id, { url });
      onChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stop-photos">
      {stop.photos?.length > 0 && (
        <div className="photo-grid">
          {stop.photos.map((p) => (
            <figure key={p.id} className="photo-thumb">
              <img
                src={p.url}
                alt={p.caption || stop.name}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox(p.url);
                }}
              />
              <figcaption
                className={p.lat != null && p.lng != null ? "photo-gps-badge" : "photo-map-badge"}
                title={p.lat != null && p.lng != null ? `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}` : "Shown on map at this stop"}
              >
                {p.lat != null && p.lng != null ? "📍 GPS" : "🗺 On map"}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {isOwner && (
        <div className="photo-actions" onClick={(e) => e.stopPropagation()}>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
          <button className="link-btn small" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? "Uploading…" : "+ Upload photo"}
          </button>
          <button className="link-btn small" disabled={busy} onClick={addByUrl}>
            + Add by URL
          </button>
          <span className="muted small photo-gps-hint">Photos appear on the map at the stop (or exact GPS if available).</span>
        </div>
      )}

      {error && <div className="error small">{error}</div>}

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" />
        </div>
      )}
    </div>
  );
}
