import { useState } from "react";
import CountryPicker from "./CountryPicker.jsx";
import CountryStepHero from "./CountryStepHero.jsx";
import { CountryFlag } from "../countryFlags.jsx";

const PANEL_COPY = {
  origin: {
    stepLabel: "Traveling from",
    emptyHeading: "Where are you traveling from?",
    emptyLead: "Your home country or where this trip started — required before you pick a destination.",
    selectedLead: "This is where your journey begins.",
  },
  destination: {
    stepLabel: "Going to",
    emptyHeading: "Where are you going?",
    emptyLead: "Pick the destination country. We open a 3D map centered there with presets tuned for that region.",
    selectedLead: "Great choice — we'll open a 3D map centered here with presets tuned for this region.",
  },
};

export default function CountrySetupPanel({
  destination,
  onDestinationChange,
  origin,
  onOriginChange,
  defaultTab = "destination",
}) {
  const [tab, setTab] = useState(defaultTab);
  const activeCountry = tab === "origin" ? origin : destination;
  const copy = PANEL_COPY[tab];

  function handlePick(country) {
    if (tab === "origin") {
      onOriginChange?.(country);
      setTab("destination");
    } else {
      onDestinationChange?.(country);
    }
  }

  return (
    <div className="country-setup-panel">
      <div className="country-setup-tabs" role="tablist" aria-label="Trip countries">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "origin"}
          className={`country-setup-tab${tab === "origin" ? " active" : ""}${origin ? " done" : ""}`}
          onClick={() => setTab("origin")}
        >
          <span className="country-setup-tab-label">Traveling from</span>
          {origin && (
            <span className="country-setup-tab-pill">
              <CountryFlag name={origin.name} code={origin.code} size="sm" />
              {origin.name}
            </span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "destination"}
          className={`country-setup-tab${tab === "destination" ? " active" : ""}${destination ? " done" : ""}`}
          onClick={() => setTab("destination")}
        >
          <span className="country-setup-tab-label">Going to</span>
          {destination && (
            <span className="country-setup-tab-pill">
              <CountryFlag name={destination.name} code={destination.code} size="sm" />
              {destination.name}
            </span>
          )}
        </button>
      </div>

      {(origin && destination) && (
        <div className="country-route-summary" aria-live="polite">
          <CountryFlag name={origin.name} code={origin.code} size="sm" />
          <span>{origin.name}</span>
          <span className="country-route-arrow" aria-hidden>→</span>
          <CountryFlag name={destination.name} code={destination.code} size="sm" />
          <span>{destination.name}</span>
        </div>
      )}

      <div className="country-step-layout">
        <CountryStepHero country={activeCountry} {...copy} />
        <div className="country-step-picker">
          <CountryPicker picked={activeCountry} onPick={handlePick} large />
        </div>
      </div>
    </div>
  );
}
