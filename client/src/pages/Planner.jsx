import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { TripPlannerProvider } from "../context/TripPlannerContext.jsx";
import PlannerHome from "./planner/PlannerHome.jsx";
import PlannerSetup from "./planner/PlannerSetup.jsx";
import PlannerBuilder from "./planner/PlannerBuilder.jsx";
import PlannerSummary from "./planner/PlannerSummary.jsx";
import PlannerSearch from "./planner/PlannerSearch.jsx";

function PlannerSearchRedirect() {
  const { planId } = useParams();
  return <Navigate to={`/plan/${planId}/search/flights`} replace />;
}

export default function Planner() {
  return (
    <TripPlannerProvider>
      <Routes>
        <Route index element={<PlannerHome />} />
        <Route path="new/setup" element={<PlannerSetup />} />
        <Route path=":planId/setup" element={<PlannerSetup />} />
        <Route path=":planId/build" element={<PlannerBuilder />} />
        <Route path=":planId/summary" element={<PlannerSummary />} />
        <Route path=":planId/search/:tab" element={<PlannerSearch />} />
        <Route path=":planId/search" element={<PlannerSearchRedirect />} />
        <Route path="*" element={<Navigate to="/plan" replace />} />
      </Routes>
    </TripPlannerProvider>
  );
}
