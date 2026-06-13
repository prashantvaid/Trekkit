import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import LandingGlobe from "../components/LandingGlobe.jsx";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "register" : "login");
  const [form, setForm] = useState({ username: "", email: "", password: "", emailOrUsername: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function switchMode(next) {
    setMode(next);
    setError("");
  }

  async function submitAccount(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(form.emailOrUsername, form.password);
        navigate("/");
      } else {
        // create + authenticate the account, then send them to the onboarding page
        await register(form.username, form.email, form.password);
        navigate("/welcome");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-side">
        <Link to="/" className="auth-back">← Back to home</Link>
        <div className="auth-side-globe">
          <LandingGlobe size={360} />
        </div>
        <h2 className="auth-side-title">Your next chapter starts here.</h2>
        <p className="auth-side-text">
          Join travelers mapping their journeys, one pin at a time.
        </p>
      </aside>

      <div className="auth-main">
        <form className="auth-form" onSubmit={submitAccount}>
          <Link to="/" className="auth-logo-link">
            <span className="brand-mark">🌍</span> Trekkit
          </Link>
          <h1 className="auth-title">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="auth-subtitle muted">
            {mode === "login"
              ? "Log in to pick up where you left off."
              : "It's free, and your first trip takes two minutes."}
          </p>

          <div className="auth-tabs">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>
              Log in
            </button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>
              Sign up
            </button>
          </div>

          {mode === "register" ? (
            <>
              <label>Username
                <input value={form.username} onChange={(e) => update("username", e.target.value)} required />
              </label>
              <label>Email
                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
              </label>
            </>
          ) : (
            <label>Email or username
              <input value={form.emailOrUsername} onChange={(e) => update("emailOrUsername", e.target.value)} required />
            </label>
          )}

          <label>Password
            <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required />
          </label>

          {error && <div className="error">{error}</div>}

          <button className="btn-primary" disabled={busy}>
            {busy ? "…" : mode === "login" ? "Log in" : "Continue"}
          </button>

          <p className="auth-foot muted">
            {mode === "login" ? "New to Trekkit? " : "Already have an account? "}
            <button type="button" className="link-inline" onClick={() => switchMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "Create an account" : "Log in instead"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
