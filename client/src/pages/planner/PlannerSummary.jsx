import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTripPlanner } from "../../context/TripPlannerContext.jsx";
import WizardProgress from "../../components/planner/WizardProgress.jsx";
import TripMap from "../../components/TripMap.jsx";
import ConfirmDialog, { TrashIcon } from "../../components/ConfirmDialog.jsx";
import {
  PLANNER_SLOTS,
  SLOT_LABELS,
  planActivityCount,
  planMapPins,
  planTotalCost,
  formatActivityPrice,
} from "../../planner/plannerModel.js";

export default function PlannerSummary() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { plans, updatePlan, setActivePlan, deletePlan } = useTripPlanner();
  const plan = plans.find((p) => p.id === planId);
  const cardRef = useRef(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (plan) {
      setActivePlan(plan.id);
      if (plan.phase !== "summary") updatePlan(plan.id, { phase: "summary" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id]);

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

  const { total, currency } = planTotalCost(plan);
  const pins = planMapPins(plan);
  const mapStops = pins.map((p, i) => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    sort_order: i,
  }));

  async function exportCard() {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#faf8f5",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `${plan.destination?.name || "trip"}-plan.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      window.print();
    }
  }

  function confirmDeletePlan() {
    deletePlan(plan.id);
    navigate("/plan");
  }

  const deleteName = plan.destination?.name || "this trip";

  return (
    <div className="page planner-page planner-wizard">
      <div className="planner-container planner-wizard-container">
        <WizardProgress step="summary" />

        <header className="planner-builder-head">
          <div>
            <h1>Trip summary</h1>
            <p className="muted small">
              {planActivityCount(plan)} activities · est. {currency} {total.toFixed(0)}
            </p>
          </div>
          <div className="planner-builder-head-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate(`/plan/${plan.id}/build`)}>
              Edit itinerary
            </button>
            <button type="button" className="btn-danger-outline" onClick={() => setDeleteConfirmOpen(true)}>
              <TrashIcon />
              Delete plan
            </button>
            <button type="button" className="btn-primary planner-gradient-btn" onClick={exportCard}>
              Share as image
            </button>
          </div>
        </header>

        <div className="planner-summary-grid">
          <div className="planner-summary-card-wrap" ref={cardRef}>
            <div className="planner-summary-card card">
              <div className="planner-summary-hero">
                <span className="planner-badge">Your trip</span>
                <h2>{plan.destination?.name}</h2>
                {plan.origin && (
                  <p className="planner-summary-route">
                    From {plan.origin.name} → {plan.destination.name}
                  </p>
                )}
                <p className="muted small">
                  {plan.dates?.start}
                  {plan.dates?.end && plan.dates.end !== plan.dates?.start ? ` – ${plan.dates.end}` : ""}
                </p>
                {plan.tripTypes?.length > 0 && (
                  <div className="day-picker planner-summary-tags">
                    {plan.tripTypes.map((t) => (
                      <span key={t} className="day-chip active">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {plan.days.map((day) => {
                const items = PLANNER_SLOTS.flatMap((slot) =>
                  (day.slots[slot] || []).map((a) => ({ ...a, slot }))
                );
                if (!items.length) return null;
                return (
                  <section key={day.id} className="planner-summary-day">
                    <h3>{day.label}</h3>
                    <span className="muted small">{day.date}</span>
                    <ul>
                      {items.map((act) => (
                        <li key={act.id}>
                          <span className="planner-summary-slot">{SLOT_LABELS[act.slot]}</span>
                          <strong>{act.title}</strong>
                          {act.price != null && (
                            <span className="muted small"> · {formatActivityPrice(act)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}

              <footer className="planner-summary-foot">
                <strong>Estimated total: {currency} {total.toFixed(0)}</strong>
                <span className="muted small">Hotels priced per night · totals include full stay</span>
              </footer>
            </div>
          </div>

          {mapStops.length > 0 && (
            <div className="card planner-summary-map">
              <h3>Map</h3>
              <TripMap stops={mapStops} height={360} />
            </div>
          )}
        </div>

        <div className="planner-wizard-actions">
          <Link to="/trips/new" className="btn-primary btn-xl planner-gradient-btn">
            Track this trip on the map →
          </Link>
          <button type="button" className="btn-secondary btn-lg" onClick={() => navigate("/plan")}>
            Back to planner home
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDeletePlan}
        title={`Delete ${deleteName}?`}
        message="This permanently removes the itinerary and all its stops. You can't undo this."
        confirmLabel="Delete trip"
        cancelLabel="Keep it"
      />
    </div>
  );
}
