import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import CountryPicker from "../components/CountryPicker.jsx";
import CountryStepHero from "../components/CountryStepHero.jsx";
import { CountryFlag } from "../countryFlags.jsx";
import { TripSetupNav, TripSetupProgress } from "../components/TripSetupSteps.jsx";
import { getMapPresetsForCountry } from "../mapPresets.js";
import { loadPrefs, mapPresetsWithUserDefaults } from "../settingsPrefs.js";

function defaultTripPublic() {
  return loadPrefs().defaultPublic !== false;
}

export default function NewTrip() {
  const navigate = useNavigate();
  const [step, setStep] = useState("country");
  const [country, setCountry] = useState(null);
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(defaultTripPublic());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function canAccess(stepId) {
    if (stepId === "country") return true;
    if (stepId === "title") return !!country;
    return false;
  }

  function goToTitle() {
    if (!country) {
      setError("Choose a country to continue.");
      return;
    }
    setError("");
    setStep("title");
  }

  async function submit(e) {
    e.preventDefault();
    if (!country) {
      setError("Choose a country to continue.");
      setStep("country");
      return;
    }
    if (!title.trim()) {
      setError("Give your trip a title.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const mapPresets = mapPresetsWithUserDefaults(getMapPresetsForCountry(country.name));
      const { trip } = await api.createTrip({
        title: title.trim(),
        description: null,
        is_public: isPublic,
        country: country.name,
        country_lat: country.lat,
        country_lng: country.lng,
        destination: country.name,
        destination_lat: country.lat,
        destination_lng: country.lng,
        map_presets: JSON.stringify(mapPresets),
      });
      navigate(`/trips/${trip.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="page new-trip">
      <div className="new-trip-container">
        <header className="new-trip-head">
          <div className="new-trip-head-copy">
            <span className="nt-badge">New trip</span>
            <h1>Track a trip</h1>
            <p className="muted small">Pick a country, name it, then build your route on a live 3D map.</p>
          </div>
          <TripSetupProgress step={step} />
        </header>

        <div className={`card new-trip-form ${busy ? "is-busy" : ""}`}>
          <TripSetupNav step={step} onStep={setStep} canAccess={canAccess} />

          {step === "country" ? (
            <div key="country" className={`new-trip-step country-step nt-step-enter ${country ? "country-ready" : ""}`}>
              <div className="country-step-layout">
                <CountryStepHero country={country} />
                <div className="country-step-picker">
                  <CountryPicker picked={country} onPick={setCountry} large />
                </div>
              </div>
              {error && <div className="error">{error}</div>}
              <button
                type="button"
                className="btn-primary btn-xl country-step-cta"
                onClick={goToTitle}
                disabled={!country}
              >
                Continue to name your trip
              </button>
            </div>
          ) : step === "title" ? (
            <form key="title" className="new-trip-step title-step nt-step-enter" onSubmit={submit}>
              <div className="title-step-layout">
                <div className="title-step-intro">
                  <div className="country-step-hero compact">
                    <span className="country-step-pin" aria-hidden>✈️</span>
                    <span className="country-step-eyebrow">Step 2</span>
                    <h2>Name your trip</h2>
                    <p className="country-step-lead">
                      Just a title for now — you can add a description after your map is ready.
                    </p>
                  </div>
                  {country && (
                    <div className="new-trip-country-pill">
                      <CountryFlag name={country.name} code={country.code} size="md" />
                      <span className="muted small">Tracking in</span>
                      <strong>{country.name}</strong>
                      <button type="button" className="link-btn small" onClick={() => setStep("country")}>Change</button>
                    </div>
                  )}
                </div>

                <div className="title-step-fields">
                  <label className="title-field-lg">
                    Trip title
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Two weeks across Japan"
                      required
                      autoFocus
                    />
                  </label>

                  <div className="visibility-toggle">
                    <button
                      type="button"
                      className={isPublic ? "active" : ""}
                      onClick={() => setIsPublic(true)}
                    >
                      Public
                      <span className="muted small">Shows on the feed</span>
                    </button>
                    <button
                      type="button"
                      className={!isPublic ? "active" : ""}
                      onClick={() => setIsPublic(false)}
                    >
                      Private
                      <span className="muted small">Only you can see it</span>
                    </button>
                  </div>

                  {error && <div className="error">{error}</div>}

                  <div className="new-trip-actions">
                    <button type="button" className="btn-secondary btn-lg" onClick={() => setStep("country")}>Back</button>
                    <button className="btn-primary btn-xl" disabled={busy}>
                      {busy ? "Opening map…" : "Create trip & open map"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
