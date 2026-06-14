import { useEffect, useState } from "react";
import BottomSheet from "./BottomSheet.jsx";
import { ACTIVITY_TYPES, PLANNER_SLOTS, SLOT_LABELS } from "../../planner/plannerModel.js";

export default function EditItineraryItemSheet({ open, onClose, plan, item, onSave }) {
  const activity = item?.activity;
  const cfg = ACTIVITY_TYPES[activity?.type] || ACTIVITY_TYPES.note;

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [dayId, setDayId] = useState("");
  const [slot, setSlot] = useState("afternoon");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !activity) return;
    setTitle(activity.title || "");
    setSubtitle(activity.subtitle || "");
    setNotes(activity.notes || "");
    setPrice(activity.price != null ? String(activity.price) : "");
    setCurrency(activity.currency || "USD");
    setDayId(item.dayId || plan?.days?.[0]?.id || "");
    setSlot(item.slot || "afternoon");
    setError("");
  }, [open, activity, item?.dayId, item?.slot, plan?.days]);

  function submit(e) {
    e?.preventDefault();
    if (!title.trim()) {
      setError("Name is required.");
      return;
    }
    const parsedPrice = price.trim() === "" ? null : Number(price);
    if (price.trim() !== "" && !Number.isFinite(parsedPrice)) {
      setError("Enter a valid price or leave it blank.");
      return;
    }
    onSave?.({
      dayId: item.dayId,
      slot: item.slot,
      actId: activity.id,
      updates: {
        title: title.trim(),
        subtitle: subtitle.trim(),
        notes: notes.trim(),
        price: parsedPrice,
        currency: currency.trim() || "USD",
      },
      newDayId: dayId,
      newSlot: slot,
    });
    onClose?.();
  }

  if (!activity) return null;

  return (
    <BottomSheet open={open} onClose={onClose} title={`Edit ${cfg.label.toLowerCase()}`}>
      <form className="planner-edit-item-form" onSubmit={submit}>
        <label>
          Name
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </label>
        <label>
          Details
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Time, address, confirmation #…"
          />
        </label>
        <label>
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reminders, links, tips…"
            rows={3}
          />
        </label>
        <div className="planner-edit-item-row">
          <label>
            {activity.type === "hotel" ? "Nightly rate" : "Price"}
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Optional"
            />
          </label>
          <label>
            Currency
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" />
          </label>
        </div>
        <div className="planner-edit-item-row">
          <label>
            Day
            <select value={dayId} onChange={(e) => setDayId(e.target.value)}>
              {(plan?.days || []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}{d.date ? ` · ${d.date}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Time slot
            <select value={slot} onChange={(e) => setSlot(e.target.value)}>
              {PLANNER_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {SLOT_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <div className="error small">{error}</div>}
        <button type="submit" className="btn-primary planner-edit-item-save">
          Save changes
        </button>
      </form>
    </BottomSheet>
  );
}
