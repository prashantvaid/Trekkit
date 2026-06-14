import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPlan } from "../planner/plannerModel.js";
import {
  loadActivePlanId,
  loadPlans,
  saveActivePlanId,
  savePlans,
} from "../planner/plannerStorage.js";

const TripPlannerContext = createContext(null);

export function TripPlannerProvider({ children }) {
  const [plans, setPlans] = useState(() => loadPlans());
  const [activePlanId, setActivePlanIdState] = useState(() => loadActivePlanId());

  useEffect(() => {
    savePlans(plans);
  }, [plans]);

  useEffect(() => {
    saveActivePlanId(activePlanId);
  }, [activePlanId]);

  const activePlan = useMemo(
    () => plans.find((p) => p.id === activePlanId) || null,
    [plans, activePlanId]
  );

  const upsertPlan = useCallback((plan) => {
    const next = { ...plan, updatedAt: Date.now() };
    setPlans((list) => {
      const i = list.findIndex((p) => p.id === next.id);
      if (i === -1) return [next, ...list];
      const copy = [...list];
      copy[i] = next;
      return copy;
    });
    return next;
  }, []);

  const createNewPlan = useCallback((partial = {}) => {
    const plan = createPlan(partial);
    upsertPlan(plan);
    setActivePlanIdState(plan.id);
    return plan;
  }, [upsertPlan]);

  const updatePlan = useCallback(
    (id, patch) => {
      let updated = null;
      setPlans((list) =>
        list.map((p) => {
          if (p.id !== id) return p;
          updated = { ...p, ...patch, updatedAt: Date.now() };
          return updated;
        })
      );
      return updated;
    },
    []
  );

  const deletePlan = useCallback((id) => {
    setPlans((list) => list.filter((p) => p.id !== id));
    setActivePlanIdState((cur) => (cur === id ? null : cur));
  }, []);

  const setActivePlan = useCallback((id) => {
    setActivePlanIdState(id);
  }, []);

  const value = useMemo(
    () => ({
      plans,
      activePlan,
      activePlanId,
      createNewPlan,
      updatePlan,
      upsertPlan,
      deletePlan,
      setActivePlan,
    }),
    [plans, activePlan, activePlanId, createNewPlan, updatePlan, upsertPlan, deletePlan, setActivePlan]
  );

  return (
    <TripPlannerContext.Provider value={value}>{children}</TripPlannerContext.Provider>
  );
}

export function useTripPlanner() {
  const ctx = useContext(TripPlannerContext);
  if (!ctx) throw new Error("useTripPlanner must be used within TripPlannerProvider");
  return ctx;
}
