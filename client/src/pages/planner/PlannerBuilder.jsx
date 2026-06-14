import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTripPlanner } from "../../context/TripPlannerContext.jsx";
import WizardProgress from "../../components/planner/WizardProgress.jsx";
import QuickAddSheet from "../../components/planner/QuickAddSheet.jsx";
import PlannerBrowseSheet from "../../components/planner/PlannerBrowseSheet.jsx";
import { ActivityTypeIcon } from "../../components/planner/ActivitySearchSheet.jsx";
import AIPlannerSheet from "../../components/planner/AIPlannerSheet.jsx";
import TransportIcon from "../../components/TransportIcon.jsx";
import {
  ACTIVITY_TYPES,
  PLANNER_SLOTS,
  SLOT_LABELS,
  buildDaySkeletons,
  createActivity,
  formatActivityPrice,
  planMapPins,
} from "../../planner/plannerModel.js";
import PlannerPinsMap from "../../components/planner/PlannerPinsMap.jsx";
import EditItineraryItemSheet from "../../components/planner/EditItineraryItemSheet.jsx";
import ConfirmDialog, { TrashIcon } from "../../components/ConfirmDialog.jsx";
import HotelDetailSheet from "../../components/planner/HotelDetailSheet.jsx";

const ADD_TYPES = ["hotel", "flight", "restaurant", "activity", "note"];
const BROWSE_TYPES = new Set(["hotel", "restaurant", "activity"]);

export default function PlannerBuilder() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { plans, updatePlan, setActivePlan, deletePlan } = useTripPlanner();
  const plan = plans.find((p) => p.id === planId);

  const [expandedDay, setExpandedDay] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [browseType, setBrowseType] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [viewHotel, setViewHotel] = useState(null);

  useEffect(() => {
    if (plan) setActivePlan(plan.id);
  }, [plan, setActivePlan]);

  useEffect(() => {
    if (!plan) return;
    if (!plan.days?.length && plan.dates?.start) {
      const end = plan.dates.end || plan.dates.start;
      updatePlan(plan.id, { days: buildDaySkeletons(plan.dates.start, end) });
    }
  }, [plan, updatePlan]);

  useEffect(() => {
    if (plan?.days?.[0]) setExpandedDay(plan.days[0].id);
  }, [plan?.id, plan?.days?.length]);

  if (!plan) {
    return (
      <div className="page planner-page">
        <div className="planner-container">
          <p className="error">Plan not found.</p>
          <button type="button" className="btn-secondary" onClick={() => navigate("/plan")}>Back</button>
        </div>
      </div>
    );
  }

  function patchDays(nextDays) {
    updatePlan(plan.id, { days: nextDays, phase: "build" });
  }

  function openAdd(dayId, slot, type) {
    setTarget({ dayId, slot });
    if (BROWSE_TYPES.has(type)) {
      setBrowseType(type);
      setSheet(null);
    } else {
      setSheet(type);
      setBrowseType(null);
    }
  }

  function openSearch(tab) {
    if (!target) return;
    navigate(`/plan/${plan.id}/search/${tab}`, {
      state: { dayId: target.dayId, slot: target.slot, returnTo: "build" },
    });
    setSheet(null);
    setBrowseType(null);
    setTarget(null);
  }

  function addActivity(data) {
    if (!target) return;
    const activity = createActivity(data.type || sheet || browseType, data);
    patchDays(
      plan.days.map((d) =>
        d.id === target.dayId
          ? {
              ...d,
              slots: {
                ...d.slots,
                [target.slot]: [...(d.slots[target.slot] || []), activity],
              },
            }
          : d
      )
    );
    setSheet(null);
    setBrowseType(null);
    setTarget(null);
  }

  function removeActivity(dayId, slot, actId) {
    patchDays(
      plan.days.map((d) =>
        d.id === dayId
          ? {
              ...d,
              slots: {
                ...d.slots,
                [slot]: d.slots[slot].filter((a) => a.id !== actId),
              },
            }
          : d
      )
    );
    if (editItem?.activity?.id === actId) setEditItem(null);
  }

  function saveEdit({ dayId, slot, actId, updates, newDayId, newSlot }) {
    let activity = null;
    let nextDays = plan.days.map((d) => {
      if (d.id !== dayId) return d;
      const items = d.slots[slot] || [];
      activity = items.find((a) => a.id === actId);
      return {
        ...d,
        slots: {
          ...d.slots,
          [slot]: items.filter((a) => a.id !== actId),
        },
      };
    });

    if (!activity) return;

    const updated = { ...activity, ...updates, updatedAt: Date.now() };
    const destDayId = newDayId || dayId;
    const destSlot = newSlot || slot;

    nextDays = nextDays.map((d) => {
      if (d.id !== destDayId) return d;
      return {
        ...d,
        slots: {
          ...d.slots,
          [destSlot]: [...(d.slots[destSlot] || []), updated],
        },
      };
    });

    patchDays(nextDays);
    setEditItem(null);
    if (destDayId !== dayId) setExpandedDay(destDayId);
  }

  function openEdit(dayId, slot, activity) {
    setEditItem({ dayId, slot, activity });
    setSheet(null);
    setBrowseType(null);
    setTarget(null);
  }

  function moveDay(dayId, dir) {
    const idx = plan.days.findIndex((d) => d.id === dayId);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= plan.days.length) return;
    const copy = [...plan.days];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    patchDays(copy.map((d, i) => ({ ...d, label: `Day ${i + 1}` })));
  }

  function addAiSuggestion(activity) {
    const day = plan.days.find((d) => d.id === expandedDay) || plan.days[0];
    if (!day) return;
    patchDays(
      plan.days.map((d) =>
        d.id === day.id
          ? {
              ...d,
              slots: {
                ...d.slots,
                afternoon: [...(d.slots.afternoon || []), activity],
              },
            }
          : d
      )
    );
  }

  function confirmDeletePlan() {
    deletePlan(plan.id);
    navigate("/plan");
  }

  const deleteName = plan.destination?.name || "this trip";

  const itineraryPins = planMapPins(plan).map((p) => ({
    id: p.id,
    title: p.name,
    lat: p.lat,
    lng: p.lng,
    subtitle: `${p.day} · ${p.slot}`,
  }));
  const mapCenter =
    plan.destination?.lat != null
      ? { lat: plan.destination.lat, lng: plan.destination.lng }
      : itineraryPins[0]
        ? { lat: itineraryPins[0].lat, lng: itineraryPins[0].lng }
        : null;

  return (
    <div className="page planner-page planner-wizard planner-builder-page">
      <div className="planner-container planner-wizard-container planner-builder-container">
        <WizardProgress step="build" />

        <header className="planner-builder-head">
          <div>
            <h1>{plan.destination?.name || "Itinerary"}</h1>
            <p className="muted small">
              {plan.origin?.name && `${plan.origin.name} → `}
              {plan.dates?.start}
              {plan.dates?.end && plan.dates.end !== plan.dates?.start ? ` – ${plan.dates.end}` : ""}
              · {plan.travelers} traveler{plan.travelers === 1 ? "" : "s"}
            </p>
          </div>
          <div className="planner-builder-head-actions">
            <button type="button" className="btn-primary" onClick={() => navigate(`/plan/${plan.id}/search/flights`)}>
              Search & book
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate(`/plan/${plan.id}/setup`)}>
              Edit setup
            </button>
            <button type="button" className="btn-danger-outline" onClick={() => setDeleteConfirmOpen(true)}>
              <TrashIcon />
              Delete plan
            </button>
            <button
              type="button"
              className="btn-primary planner-gradient-btn"
              onClick={() => {
                updatePlan(plan.id, { phase: "summary" });
                navigate(`/plan/${plan.id}/summary`);
              }}
            >
              Review trip →
            </button>
          </div>
        </header>

        {mapCenter && itineraryPins.length > 0 && (
          <section className="planner-itinerary-map card">
            <h2 className="planner-section-title">Your trip on the map</h2>
            <p className="muted small">Everything you&apos;ve added with a location</p>
            <PlannerPinsMap center={mapCenter} results={itineraryPins} height={240} />
          </section>
        )}

        <div className="planner-builder-days">
          {!plan.days?.length ? (
            <div className="card planner-builder-empty">
              <p className="muted">No days yet — finish trip setup with dates to build your itinerary.</p>
              <button type="button" className="btn-primary" onClick={() => navigate(`/plan/${plan.id}/setup`)}>
                Go to setup
              </button>
            </div>
          ) : (
          plan.days.map((day, dayIdx) => {
            const isOpen = expandedDay === day.id;
            const slotCount = PLANNER_SLOTS.reduce((n, s) => n + (day.slots[s]?.length || 0), 0);
            return (
              <article key={day.id} className={`card planner-day-card${isOpen ? " is-open" : ""}`}>
                <button
                  type="button"
                  className="planner-day-card-head"
                  onClick={() => setExpandedDay(isOpen ? null : day.id)}
                >
                  <div>
                    <span className="planner-day-label">{day.label}</span>
                    <span className="muted small">{day.date || "Date TBD"}</span>
                  </div>
                  <span className="planner-day-meta muted small">
                    {slotCount} item{slotCount === 1 ? "" : "s"}
                  </span>
                </button>

                {isOpen && (
                  <div className="planner-day-body">
                    <div className="planner-day-reorder">
                      <button type="button" className="link-btn small" disabled={dayIdx === 0} onClick={() => moveDay(day.id, -1)}>
                        ↑ Move day
                      </button>
                      <button
                        type="button"
                        className="link-btn small"
                        disabled={dayIdx === plan.days.length - 1}
                        onClick={() => moveDay(day.id, 1)}
                      >
                        ↓ Move day
                      </button>
                    </div>

                    {PLANNER_SLOTS.map((slot) => (
                      <section key={slot} className="planner-slot">
                        <header className="planner-slot-head">
                          <h3>{SLOT_LABELS[slot]}</h3>
                          <div className="planner-slot-add-row">
                            {ADD_TYPES.map((type) => (
                              <button
                                key={type}
                                type="button"
                                className="planner-add-type-btn"
                                title={ACTIVITY_TYPES[type].label}
                                onClick={() => openAdd(day.id, slot, type)}
                              >
                                <ActivityTypeIcon type={type} size={20} />
                                <span>{ACTIVITY_TYPES[type].label}</span>
                              </button>
                            ))}
                          </div>
                        </header>

                        <ul className="planner-activity-list">
                          {(day.slots[slot] || []).map((act) => (
                            <li key={act.id} className="planner-activity-item">
                              <button
                                type="button"
                                className="planner-activity-open"
                                onClick={() => openEdit(day.id, slot, act)}
                              >
                                <span className="planner-activity-icon">
                                  <TransportIcon
                                    mode={
                                      act.type === "flight"
                                        ? "plane"
                                        : act.type === "hotel"
                                          ? "train"
                                          : act.type === "restaurant"
                                            ? "walk"
                                            : "bike"
                                    }
                                    size={18}
                                  />
                                </span>
                                <div className="planner-activity-copy">
                                  <strong>{act.title}</strong>
                                  {act.subtitle && <span className="muted small">{act.subtitle}</span>}
                                  {act.notes && act.notes !== act.subtitle && (
                                    <span className="muted small planner-activity-notes">{act.notes}</span>
                                  )}
                                  {act.price != null && (
                                    <span className="planner-activity-price">
                                      {formatActivityPrice(act)}
                                    </span>
                                  )}
                                </div>
                              </button>
                              <div className="planner-activity-actions">
                                {act.type === "hotel" && (
                                  <button
                                    type="button"
                                    className="link-btn small"
                                    onClick={() => setViewHotel(act)}
                                  >
                                    View
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="link-btn small"
                                  onClick={() => openEdit(day.id, slot, act)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="link-btn danger small"
                                  onClick={() => removeActivity(day.id, slot, act.id)}
                                >
                                  Remove
                                </button>
                              </div>
                            </li>
                          ))}
                          {!day.slots[slot]?.length && (
                            <li className="muted small planner-slot-empty">Nothing planned yet</li>
                          )}
                        </ul>
                      </section>
                    ))}
                  </div>
                )}
              </article>
            );
          })
          )}
        </div>

        {plan.useAI && (
          <button type="button" className="planner-ai-fab" onClick={() => setAiOpen(true)}>
            ✨ AI Suggestions
          </button>
        )}

        <PlannerBrowseSheet
          open={Boolean(browseType && target)}
          onClose={() => {
            setBrowseType(null);
            setTarget(null);
          }}
          activityType={browseType}
          plan={plan}
          target={target}
          onSelect={addActivity}
        />

        <QuickAddSheet
          open={Boolean(sheet && target && !browseType)}
          onClose={() => {
            setSheet(null);
            setTarget(null);
          }}
          activityType={sheet}
          target={target}
          plan={plan}
          onAdd={addActivity}
          onSearch={openSearch}
        />

        <EditItineraryItemSheet
          open={Boolean(editItem)}
          onClose={() => setEditItem(null)}
          plan={plan}
          item={editItem}
          onSave={saveEdit}
        />

        <AIPlannerSheet
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          plan={plan}
          onAddSuggestion={addAiSuggestion}
        />

        <ConfirmDialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={confirmDeletePlan}
          title={`Delete ${deleteName}?`}
          message="This permanently removes the full itinerary and all stops. You can't undo this."
          confirmLabel="Delete trip"
          cancelLabel="Keep it"
        />

        <HotelDetailSheet
          open={Boolean(viewHotel)}
          onClose={() => setViewHotel(null)}
          hotel={
            viewHotel
              ? {
                  title: viewHotel.title,
                  subtitle: viewHotel.subtitle,
                  price: viewHotel.price,
                  currency: viewHotel.currency,
                  rating: viewHotel.meta?.stars ?? viewHotel.rating,
                  image: viewHotel.meta?.image ?? null,
                  meta: viewHotel.meta,
                }
              : null
          }
          cityName={plan.destination?.name}
          checkIn={viewHotel?.meta?.checkIn || plan.dates?.start}
          checkOut={viewHotel?.meta?.checkOut || plan.dates?.end}
          adults={plan.travelers || 1}
        />
      </div>
    </div>
  );
}
