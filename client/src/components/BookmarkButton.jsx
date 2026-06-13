import { useState } from "react";
import { api } from "../api.js";

// Toggles a saved/bookmarked trip with an optimistic update.
export default function BookmarkButton({ tripId, initial = false, className = "action-btn", onChange }) {
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle(e) {
    e?.preventDefault();
    e?.stopPropagation();
    if (busy) return;
    setBusy(true);
    const optimistic = !saved;
    setSaved(optimistic);
    try {
      const { bookmarked } = await api.toggleBookmark(tripId);
      setSaved(bookmarked);
      onChange && onChange(bookmarked);
    } catch {
      setSaved(!optimistic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className={`${className} ${saved ? "saved" : ""}`} onClick={toggle} aria-pressed={saved}>
      {saved ? "Saved" : "Bookmark"}
    </button>
  );
}
