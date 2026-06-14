import { useEffect, useState } from "react";
import BottomSheet from "./BottomSheet.jsx";
import { ACTIVITY_TYPES, SLOT_LABELS } from "../../planner/plannerModel.js";

const SEARCH_TAB = {
  flight: "flights",
  hotel: "hotels",
  restaurant: "restaurants",
  activity: "activities",
};

export default function QuickAddSheet({ open, onClose, activityType, target, plan, onAdd, onSearch }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const cfg = ACTIVITY_TYPES[activityType] || ACTIVITY_TYPES.note;
  const searchTab = SEARCH_TAB[activityType];
  const day = plan?.days?.find((d) => d.id === target?.dayId);
  const slotLabel = target?.slot ? SLOT_LABELS[target.slot] : null;
  const contextLabel = day && slotLabel ? `${day.label} · ${slotLabel}` : null;

  useEffect(() => {
    if (!open) {
      setTitle("");
      setSubtitle("");
      setNotes("");
      setError("");
    }
  }, [open]);

  function submit(e) {
    e?.preventDefault();
    if (!title.trim()) {
      setError("Give this item a name.");
      return;
    }
    onAdd?.({
      type: activityType,
      title: title.trim(),
      subtitle: subtitle.trim() || notes.trim(),
      notes: notes.trim(),
    });
    onClose?.();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={`Add ${cfg.label.toLowerCase()}`}>
      {contextLabel && (
        <p className="muted small planner-quick-add-context">Adding to {contextLabel}</p>
      )}
      <form className="planner-quick-add-form" onSubmit={submit}>
        <label>
          Name
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              activityType === "flight"
                ? "e.g. JFK → NRT · United"
                : activityType === "hotel"
                  ? "e.g. Park Hyatt Tokyo"
                  : activityType === "restaurant"
                    ? "e.g. Ichiran Ramen"
                    : activityType === "activity"
                      ? "e.g. TeamLab Planets"
                      : "e.g. Free morning to explore"
            }
            autoFocus
          />
        </label>
        <label>
          Details <span className="muted small">(optional)</span>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Time, address, confirmation #…"
          />
        </label>
        {activityType === "note" && (
          <label>
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reminders, links, tips…"
              rows={3}
            />
          </label>
        )}
        {error && <div className="error small">{error}</div>}
        <button type="submit" className="btn-primary planner-quick-add-submit">
          Add to itinerary
        </button>
        {searchTab && onSearch && (
          <button
            type="button"
            className="btn-secondary planner-quick-add-search"
            onClick={() => onSearch(searchTab)}
          >
            Search {cfg.label.toLowerCase()}s →
          </button>
        )}
      </form>
    </BottomSheet>
  );
}
