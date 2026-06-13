import { CountryFlag } from "../countryFlags.jsx";

export default function CountryStepHero({
  country,
  stepLabel = "Step 1",
  emptyHeading = "Where are you going?",
  emptyLead = "Pick the country first. We open a 3D map centered there with presets tuned for that region.",
  selectedLead = "Great choice — we'll open a 3D map centered here with presets tuned for this region.",
  compact = false,
}) {
  return (
    <div className={`country-step-hero ${compact ? "compact" : ""} ${country ? "has-country" : ""}`}>
      <div className="country-step-hero-copy">
        {!country && (
          <span className="country-step-pin country-step-pin-inline" aria-hidden>📍</span>
        )}
        <span className="country-step-eyebrow">{stepLabel}</span>
        <h2>{country ? country.name : emptyHeading}</h2>
        <p className="country-step-lead">{country ? selectedLead : emptyLead}</p>
      </div>

      <div className={`country-step-flag-stage ${country ? "is-filled" : "is-empty"}`}>
        {country ? (
          <>
            <CountryFlag
              name={country.name}
              code={country.code}
              size="xl"
              className="country-step-showcase-flag"
            />
            <span className="country-step-flag-label">{country.name}</span>
          </>
        ) : (
          <div className="country-step-flag-hint">
            <span className="country-step-flag-hint-icon" aria-hidden>🏳️</span>
            <span className="muted">Select a country to see its flag</span>
          </div>
        )}
      </div>
    </div>
  );
}
