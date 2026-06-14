import BottomSheet from "./BottomSheet.jsx";
import { PLANNER_SLOTS, SLOT_LABELS, createActivity } from "../../planner/plannerModel.js";
import { hotelItineraryNotes } from "../../planner/travelLinks.js";

const DEFAULT_SLOT = {
  flight: "morning",
  hotel: "evening",
  restaurant: "afternoon",
  activity: "afternoon",
  note: "afternoon",
};

export default function AddToItinerarySheet({
  open,
  onClose,
  plan,
  item,
  activityType,
  onAdded,
  defaultDayId,
  defaultSlot,
}) {
  if (!open || !item || !plan) return null;

  const defaultSlotKey = defaultSlot || DEFAULT_SLOT[activityType] || "afternoon";
  const defaultDay = plan.days?.find((d) => d.id === defaultDayId);

  function addTo(dayId, slot) {
    const activity = createActivity(activityType, {
      title: item.title,
      subtitle: item.subtitle,
      lat: item.lat,
      lng: item.lng,
      price: item.price,
      currency: item.currency,
      notes: activityType === "hotel" ? hotelItineraryNotes(item) : "",
      meta: { ...item.meta, image: item.image || item.meta?.image || null },
    });
    onAdded?.({ dayId, slot, activity, createDay: !dayId });
    onClose?.();
  }

  if (!plan.days?.length) {
    return (
      <BottomSheet open={open} onClose={onClose} title="Add to itinerary">
        <p className="muted small planner-add-sheet-lead">
          Add <strong>{item.title}</strong> to your trip. We&apos;ll create Day 1 for you.
        </p>
        <button type="button" className="btn-primary" onClick={() => addTo(null, defaultSlotKey)}>
          Add to Day 1 · {SLOT_LABELS[defaultSlotKey]}
        </button>
      </BottomSheet>
    );
  }

  if (defaultDayId && defaultDay) {
    return (
      <BottomSheet open={open} onClose={onClose} title="Add to itinerary">
        <p className="muted small planner-add-sheet-lead">
          Add <strong>{item.title}</strong> to your trip
        </p>
        <button
          type="button"
          className="btn-primary planner-add-quick-btn"
          onClick={() => addTo(defaultDayId, defaultSlotKey)}
        >
          Add to {defaultDay.label} · {SLOT_LABELS[defaultSlotKey]}
        </button>
        <details className="planner-add-sheet-more">
          <summary className="link-btn small">Choose a different day or time</summary>
          <div className="planner-add-sheet-days">
            {(plan.days || []).map((day) => (
              <div key={day.id} className="planner-add-sheet-day">
                <strong>{day.label || day.date}</strong>
                <div className="planner-add-sheet-slots">
                  {PLANNER_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`planner-add-slot-btn${slot === defaultSlotKey && day.id === defaultDayId ? " suggested" : ""}`}
                      onClick={() => addTo(day.id, slot)}
                    >
                      {SLOT_LABELS[slot]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Add to itinerary">
      <p className="muted small planner-add-sheet-lead">
        Pick a day and time slot for <strong>{item.title}</strong>
      </p>
      <div className="planner-add-sheet-days">
        {(plan.days || []).map((day) => (
          <div key={day.id} className="planner-add-sheet-day">
            <strong>{day.label || day.date}</strong>
            <div className="planner-add-sheet-slots">
              {PLANNER_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`planner-add-slot-btn${slot === defaultSlotKey ? " suggested" : ""}`}
                  onClick={() => addTo(day.id, slot)}
                >
                  {SLOT_LABELS[slot]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}
