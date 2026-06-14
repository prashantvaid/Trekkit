import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTripPlanner } from "../../context/TripPlannerContext.jsx";
import FlightsSearchPanel from "../../components/planner/FlightsSearchPanel.jsx";
import HotelsSearchPanel from "../../components/planner/HotelsSearchPanel.jsx";
import PlacesSearchPanel from "../../components/planner/PlacesSearchPanel.jsx";
import AddToItinerarySheet from "../../components/planner/AddToItinerarySheet.jsx";
import { emptySlots, plannerUid } from "../../planner/plannerModel.js";

const TABS = [
  { id: "flights", label: "Flights", icon: "✈️" },
  { id: "hotels", label: "Hotels", icon: "🏨" },
  { id: "restaurants", label: "Restaurants", icon: "🍽️" },
  { id: "activities", label: "Things to do", icon: "🎯" },
];

export default function PlannerSearch() {
  const { planId, tab } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const addContext = location.state;
  const { plans, updatePlan, setActivePlan } = useTripPlanner();
  const plan = plans.find((p) => p.id === planId);

  const [pending, setPending] = useState(null);
  const [pendingType, setPendingType] = useState(null);
  const [addedToast, setAddedToast] = useState("");

  const activeTab = TABS.some((t) => t.id === tab) ? tab : null;

  useEffect(() => {
    if (plan) setActivePlan(plan.id);
  }, [plan, setActivePlan]);

  useEffect(() => {
    if (!addedToast) return;
    const t = setTimeout(() => setAddedToast(""), 2800);
    return () => clearTimeout(t);
  }, [addedToast]);

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

  if (!activeTab) {
    return <Navigate to={`/plan/${plan.id}/search/flights`} replace />;
  }

  const activityType =
    activeTab === "flights"
      ? "flight"
      : activeTab === "hotels"
        ? "hotel"
        : activeTab === "restaurants"
          ? "restaurant"
          : "activity";

  function handlePick(item) {
    setPending(item);
    setPendingType(activityType);
  }

  function handleAdded({ dayId, slot, activity, createDay }) {
    let nextDays = [...(plan.days || [])];
    if (createDay || !nextDays.length) {
      nextDays.push({
        id: plannerUid(),
        date: plan.dates?.start || "",
        label: "Day 1",
        slots: emptySlots(),
      });
    }
    const targetDayId = dayId || nextDays[nextDays.length - 1].id;
    nextDays = nextDays.map((d) =>
      d.id === targetDayId
        ? { ...d, slots: { ...d.slots, [slot]: [...(d.slots[slot] || []), activity] } }
        : d
    );
    updatePlan(plan.id, { days: nextDays, phase: "build" });
    const dayLabel = nextDays.find((d) => d.id === targetDayId)?.label || "itinerary";
    setAddedToast(`Added to ${dayLabel}`);
    setPending(null);
    if (addContext?.returnTo === "build") {
      navigate(`/plan/${plan.id}/build`, { replace: true });
    }
  }

  return (
    <div className="page planner-page planner-search-page">
      <div className="planner-container planner-search-container">
        <header className="planner-search-head">
          <div>
            <Link to="/plan" className="planner-search-back">← Planner</Link>
            <h1>Explore & plan</h1>
            <p className="muted small">
              Search anywhere — compare flights, stays, and places before or after you lock in a destination.
              {plan.destination?.name ? ` Trip: ${plan.destination.name}.` : ""}
            </p>
          </div>
          <div className="planner-search-head-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate(`/plan/${plan.id}/setup`)}>
              Trip setup
            </button>
            <button type="button" className="btn-primary" onClick={() => navigate(`/plan/${plan.id}/build`)}>
              Itinerary
            </button>
          </div>
        </header>

        <nav className="planner-search-tabs" aria-label="Search categories">
          {TABS.map((t) => (
            <NavLink
              key={t.id}
              to={`/plan/${plan.id}/search/${t.id}`}
              className={({ isActive }) => `planner-search-tab${isActive ? " active" : ""}`}
            >
              <span aria-hidden>{t.icon}</span>
              {t.label}
            </NavLink>
          ))}
        </nav>

        {activeTab === "flights" && <FlightsSearchPanel plan={plan} onPick={handlePick} />}
        {activeTab === "hotels" && <HotelsSearchPanel plan={plan} onPick={handlePick} />}
        {activeTab === "restaurants" && (
          <PlacesSearchPanel plan={plan} placeType="restaurant" onPick={handlePick} />
        )}
        {activeTab === "activities" && (
          <PlacesSearchPanel plan={plan} placeType="activity" onPick={handlePick} />
        )}

        {addedToast && <div className="planner-search-toast">{addedToast}</div>}
      </div>

      <AddToItinerarySheet
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        plan={plan}
        item={pending}
        activityType={pendingType}
        onAdded={handleAdded}
        defaultDayId={addContext?.dayId}
        defaultSlot={addContext?.slot}
      />
    </div>
  );
}

export { TABS as PLANNER_SEARCH_TABS };
