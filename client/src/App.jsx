import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth.jsx";
import Nav from "./components/Nav.jsx";
import Login from "./pages/Login.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Landing from "./pages/Landing.jsx";
import Features from "./pages/Features.jsx";
import HowItWorks from "./pages/HowItWorks.jsx";
import FeatureTopic from "./pages/FeatureTopic.jsx";
import Feed from "./pages/Feed.jsx";
import Planner from "./pages/Planner.jsx";
import Recommended from "./pages/Recommended.jsx";
import NewTrip from "./pages/NewTrip.jsx";
import NewPost from "./pages/NewPost.jsx";
import CreatePost from "./pages/CreatePost.jsx";
import PostDetail from "./pages/PostDetail.jsx";
import TripDetail from "./pages/TripDetail.jsx";
import Friends from "./pages/Friends.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";
import Notifications from "./pages/Notifications.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page"><div className="muted">Loading…</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <div className="container"><div className="muted">Loading…</div></div>;
  if (!user) return <Landing />;
  return (
    <main className="container">
      <Feed />
    </main>
  );
}

function AppRoute({ children }) {
  return (
    <Protected>
      <main className="container">{children}</main>
    </Protected>
  );
}

function SavedRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? `/u/${user.id}#saved` : "/login"} replace />;
}

function Shell() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  // these pages have their own full-bleed layout and shouldn't show the app nav
  const hideAppNav =
    pathname.startsWith("/features") ||
    pathname.startsWith("/how-it-works") ||
    pathname === "/welcome";
  return (
    <>
      {user && !hideAppNav && <Nav />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/welcome" element={<Protected><Onboarding /></Protected>} />
        <Route path="/features" element={<Features />} />
        <Route path="/features/:slug" element={<FeatureTopic />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/how-it-works/*" element={<Navigate to="/how-it-works" replace />} />
        <Route path="/" element={<Home />} />
        <Route path="/recommended" element={<AppRoute><Recommended /></AppRoute>} />
        <Route path="/saved" element={<AppRoute><SavedRedirect /></AppRoute>} />
        <Route path="/friends" element={<AppRoute><Friends /></AppRoute>} />
        <Route path="/notifications" element={<AppRoute><Notifications /></AppRoute>} />
        <Route path="/plan/*" element={<AppRoute><Planner /></AppRoute>} />
        <Route path="/post" element={<AppRoute><CreatePost /></AppRoute>} />
        <Route path="/trips/new" element={<AppRoute><NewTrip /></AppRoute>} />
        <Route path="/posts/new" element={<AppRoute><NewPost /></AppRoute>} />
        <Route path="/posts/:postId" element={<AppRoute><PostDetail /></AppRoute>} />
        <Route path="/trips/:id" element={<AppRoute><TripDetail /></AppRoute>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />
        <Route path="/u/:userId" element={<AppRoute><Profile /></AppRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  );
}
