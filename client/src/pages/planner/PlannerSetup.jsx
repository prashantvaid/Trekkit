import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTripPlanner } from "../../context/TripPlannerContext.jsx";
import WizardProgress from "../../components/planner/WizardProgress.jsx";
import PlannerDestinationSearch from "../../components/planner/PlannerDestinationSearch.jsx";
import DateRangePicker from "../../components/DateRangePicker.jsx";
import { TRIP_TYPES, buildDaySkeletons } from "../../planner/plannerModel.js";

const TRAVELER_PRESETS = [
  { n: 1, label: "Solo" },
  { n: 2, label: "Couple" },
  { n: 4, label: "Group" },
];

export default function PlannerSetup() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { plans, updatePlan, setActivePlan } = useTripPlanner();
  const plan = plans.find((p) => p.id === planId);

  const [destination, setDestination] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelers, setTravelers] = useState(1);
  const [tripTypes, setTripTypes] = useState([]);
  const [useAI, setUseAI] = useState(false);
  const [tab, setTab] = useState("destination");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!plan) return;
    setActivePlan(plan.id);
    setDestination(plan.destination);
    setOrigin(plan.origin);
    setStartDate(plan.dates?.start || "");
    setEndDate(plan.dates?.end || "");
    setTravelers(plan.travelers ?? 1);
    setTripTypes(plan.tripTypes || []);
    setUseAI(plan.useAI ?? false);
  }, [plan, setActivePlan]);

  if (!plan) {
    return (
      <div className="page planner-page">
        <div className="planner-container">
          <p className="error">Plan not found.</p>
          <button type="button" className="btn-secondary" onClick={() => navigate("/plan")}>
            Back
          </button>
        </div>
      </div>
    );
  }

  function toggleType(t) {
    setTripTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function continueToBuilder() {
    if (!destination?.name) {
      setError("Choose where you're going.");
      setTab("destination");
      return;
    }
    if (destination.lat == null || destination.lng == null) {
      setError("Pick your destination from the search list so we can find nearby restaurants and activities.");
      setTab("destination");
      return;
    }
    if (!startDate) {
      setError("Pick at least a departure date.");
      return;
    }
    const end = endDate || startDate;
    const days = buildDaySkeletons(startDate, end);

    updatePlan(plan.id, {
      destination,
      origin,
      dates: { start: startDate, end },
      travelers,
      tripTypes,
      useAI,
      days,
      phase: "build",
    });
    navigate(`/plan/${plan.id}/build`);
  }

  return (
    <div className="page planner-page planner-wizard">
      <div className="planner-container planner-wizard-container">
        <WizardProgress step="setup" />

        <div className="card planner-wizard-card">
          <header className="planner-wizard-head">
            <span className="planner-badge">Phase 1</span>
            <h1>Trip setup</h1>
            <p className="muted small">Where, when, and what kind of trip — then build your itinerary.</p>
          </header>

          <div className="country-setup-tabs planner-setup-tabs">
            <button
              type="button"
              className={`country-setup-tab${tab === "origin" ? " active" : ""}${origin ? " done" : ""}`}
              onClick={() => setTab("origin")}
            >
              <span className="country-setup-tab-label">Traveling from</span>
              {origin && <span className="country-setup-tab-pill">{origin.name}</span>}
            </button>
            <button
              type="button"
              className={`country-setup-tab${tab === "destination" ? " active" : ""}${destination ? " done" : ""}`}
              onClick={() => setTab("destination")}
            >
              <span className="country-setup-tab-label">Going to</span>
              {destination && <span className="country-setup-tab-pill">{destination.name}</span>}
            </button>
          </div>

          {tab === "origin" ? (
            <PlannerDestinationSearch
              label="Where are you traveling from?"
              placeholder="Home city or departure country…"
              value={origin}
              onChange={setOrigin}
            />
          ) : (
            <PlannerDestinationSearch
              label="Where are you going?"
              placeholder="Destination city or country…"
              value={destination}
              onChange={setDestination}
            />
          )}

          <DateRangePicker
            label="When?"
            hint="Departure and return — we create one card per day"
            start={startDate}
            end={endDate}
            onChange={({ start, end }) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />

          <div className="planner-setup-section">
            <span className="geo-search-label">Travelers</span>
            <div className="day-picker">
              {TRAVELER_PRESETS.map(({ n, label }) => (
                <button
                  key={n}
                  type="button"
                  className={`day-chip${travelers === n ? " active" : ""}`}
                  onClick={() => setTravelers(n)}
                >
                  {label} · {n}
                </button>
              ))}
            </div>
          </div>

          <div className="planner-setup-section">
            <span className="geo-search-label">Trip type</span>
            <div className="day-picker">
              {TRIP_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`day-chip${tripTypes.includes(t) ? " active" : ""}`}
                  onClick={() => toggleType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <label className="planner-ai-toggle">
            <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
            <span>
              <strong>Use AI to help plan</strong>
              <span className="muted small">Enables Ollama suggestions in the itinerary builder</span>
            </span>
          </label>

          {error && <div className="error">{error}</div>}

          <div className="planner-wizard-actions">
            <button type="button" className="btn-secondary btn-lg" onClick={() => navigate("/plan")}>
              Cancel
            </button>
            <button type="button" className="btn-primary btn-xl planner-gradient-btn" onClick={continueToBuilder}>
              Build itinerary →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
