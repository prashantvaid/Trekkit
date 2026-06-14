import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../auth.jsx";
import { useTripPlanner } from "../../context/TripPlannerContext.jsx";
import { planActivityCount, planProgress, resumePhase } from "../../planner/plannerModel.js";
import { takePlannerImport } from "../../plannerImport.js";
import PlannerPreview from "../../components/PlannerPreview.jsx";
import ConfirmDialog, { TrashIcon } from "../../components/ConfirmDialog.jsx";

function formatDateRange(start, end) {
  if (!start) return "Dates TBD";
  try {
    const s = new Date(start + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
    if (!end || end === start) return s;
    const e = new Date(end + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    return `${s} – ${e}`;
  } catch {
    return `${start} – ${end || ""}`;
  }
}

const GRADS = [
  "linear-gradient(135deg,#ff8a3c,#ff5a1f)",
  "linear-gradient(135deg,#ffb25e,#ff7a3c)",
  "linear-gradient(135deg,#ffd27a,#ffa14c)",
];

const ACTIONS = [
  { id: "new", label: "New trip", icon: "✨", kind: "new" },
  { id: "build", label: "Day builder", icon: "📅", kind: "build" },
  { id: "flights", label: "Flights", icon: "✈️", kind: "search", tab: "flights" },
  { id: "hotels", label: "Hotels", icon: "🏨", kind: "search", tab: "hotels" },
  { id: "food", label: "Restaurants", icon: "🍽️", kind: "search", tab: "restaurants" },
  { id: "things", label: "Things to do", icon: "🎯", kind: "search", tab: "activities" },
  { id: "ai", label: "AI planner", icon: "🤖", kind: "build" },
  { id: "summary", label: "Summary", icon: "📋", kind: "summary" },
  { id: "track", label: "Track on map", icon: "🗺️", kind: "link", to: "/trips/new" },
  { id: "saved", label: "From saved", icon: "🔖", kind: "saved" },
  { id: "explore", label: "Explore", icon: "🌍", kind: "link", to: "/recommended" },
];

export default function PlannerHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plans, activePlan, createNewPlan, setActivePlan, deletePlan } = useTripPlanner();
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const imported = takePlannerImport();
    if (imported?.days?.length) {
      const plan = createNewPlan({
        destination: imported.destination || { name: imported.name?.replace(/ \(copy\)$/, "") || "Imported trip" },
        days: imported.days.map((d, i) => ({
          id: d.id,
          date: "",
          label: d.label || `Day ${i + 1}`,
          slots: {
            morning: [],
            afternoon: [],
            evening: (d.items || []).map((item) => ({
              id: item.id,
              type: "note",
              title: item.title,
              subtitle: item.time || "",
            })),
          },
        })),
        phase: "build",
      });
      navigate(`/plan/${plan.id}/build`);
    }
  }, [createNewPlan, navigate]);

  const recentPlan = activePlan || (plans.length ? plans[plans.length - 1] : null);

  function startNew() {
    const plan = createNewPlan();
    navigate(`/plan/${plan.id}/setup`);
  }

  function openPlan(plan) {
    setActivePlan(plan.id);
    const phase = resumePhase(plan);
    if (phase === "setup") navigate(`/plan/${plan.id}/setup`);
    else if (phase === "summary") navigate(`/plan/${plan.id}/summary`);
    else navigate(`/plan/${plan.id}/build`);
  }

  function openBuild() {
    if (recentPlan) {
      setActivePlan(recentPlan.id);
      const phase = resumePhase(recentPlan);
      if (phase === "setup") navigate(`/plan/${recentPlan.id}/setup`);
      else navigate(`/plan/${recentPlan.id}/build`);
      return;
    }
    startNew();
  }

  function openSummary() {
    if (recentPlan) {
      setActivePlan(recentPlan.id);
      const phase = resumePhase(recentPlan);
      navigate(phase === "summary" ? `/plan/${recentPlan.id}/summary` : `/plan/${recentPlan.id}/build`);
      return;
    }
    startNew();
  }

  function openSearch(tab) {
    let plan = recentPlan;
    if (!plan) plan = createNewPlan();
    setActivePlan(plan.id);
    navigate(`/plan/${plan.id}/search/${tab}`);
  }

  function runAction(action) {
    if (action.kind === "new") startNew();
    else if (action.kind === "search") openSearch(action.tab);
    else if (action.kind === "build") openBuild();
    else if (action.kind === "summary") openSummary();
  }

  function confirmDeletePlan() {
    if (!deleteTarget) return;
    deletePlan(deleteTarget.id);
    setDeleteTarget(null);
  }

  const continuePlan = activePlan && resumePhase(activePlan) !== "summary" ? activePlan : null;
  const deleteName = deleteTarget?.destination?.name || "this trip";

  return (
    <div className="page planner-page planner-home-page">
      <div className="planner-container planner-home-container">
        <section className="planner-home-hero">
          <div className="planner-home-hero-copy">
            <span className="planner-badge">Trip planner</span>
            <h1>Plan your next adventure</h1>
            <button type="button" className="planner-cta-gradient planner-home-cta" onClick={startNew}>
              <span className="planner-cta-title">Start a new trip</span>
            </button>
          </div>

          <div className="planner-home-hero-visual card">
            <PlannerPreview />
          </div>
        </section>

        {continuePlan && (
          <div className="planner-continue-banner card">
            <div>
              <strong>{continuePlan.destination?.name || "Untitled trip"}</strong>
              <span className="muted small">{formatDateRange(continuePlan.dates?.start, continuePlan.dates?.end)}</span>
            </div>
            <button type="button" className="btn-primary" onClick={() => openPlan(continuePlan)}>
              Resume
            </button>
          </div>
        )}

        <section className="planner-home-actions" aria-label="Planner tools">
          {ACTIONS.map((action) =>
            action.kind === "link" ? (
              <Link key={action.id} to={action.to} className="planner-home-action card">
                <span className="planner-home-action-icon" aria-hidden>{action.icon}</span>
                <span className="planner-home-action-label">{action.label}</span>
              </Link>
            ) : action.kind === "saved" ? (
              <Link
                key={action.id}
                to={user ? `/u/${user.id}#saved` : "/login"}
                className="planner-home-action card"
              >
                <span className="planner-home-action-icon" aria-hidden>{action.icon}</span>
                <span className="planner-home-action-label">{action.label}</span>
              </Link>
            ) : (
              <button
                key={action.id}
                type="button"
                className="planner-home-action card"
                onClick={() => runAction(action)}
              >
                <span className="planner-home-action-icon" aria-hidden>{action.icon}</span>
                <span className="planner-home-action-label">{action.label}</span>
              </button>
            )
          )}
        </section>

        <section className="planner-plan-list">
          <h2 className="planner-section-title">Your plans</h2>

          {plans.length > 0 ? (
            <div className="planner-plan-grid">
              {plans.map((plan) => {
                const progress = planProgress(plan);
                const activities = planActivityCount(plan);
                return (
                  <article key={plan.id} className="planner-plan-card card">
                    <button
                      type="button"
                      className="planner-plan-card-open"
                      onClick={() => openPlan(plan)}
                    >
                      <div
                        className="planner-plan-card-photo"
                        style={{
                          background: GRADS[plans.indexOf(plan) % GRADS.length],
                        }}
                      />
                      <div className="planner-plan-card-body">
                        <strong>{plan.destination?.name || "Untitled trip"}</strong>
                        <span className="muted small">{formatDateRange(plan.dates?.start, plan.dates?.end)}</span>
                        <div className="planner-plan-progress">
                          <div className="planner-plan-progress-bar">
                            <span style={{ width: `${progress}%` }} />
                          </div>
                          <span className="muted small">{progress}% · {activities} stops</span>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="planner-plan-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(plan);
                      }}
                      aria-label={`Delete ${plan.destination?.name || "trip plan"}`}
                    >
                      <TrashIcon />
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="planner-home-empty card">
              <p className="muted small">No saved plans yet.</p>
              <button type="button" className="btn-primary" onClick={startNew}>
                Create one
              </button>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeletePlan}
        title={`Delete ${deleteName}?`}
        message="This permanently removes the itinerary and all its stops. You can't undo this."
        confirmLabel="Delete trip"
        cancelLabel="Keep it"
      />
    </div>
  );
}
