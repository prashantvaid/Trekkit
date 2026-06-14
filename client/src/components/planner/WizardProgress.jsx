const STEPS = [
  { id: "setup", label: "Setup" },
  { id: "build", label: "Itinerary" },
  { id: "summary", label: "Summary" },
];

export default function WizardProgress({ step = "setup" }) {
  const idx = STEPS.findIndex((s) => s.id === step);
  const pct = idx <= 0 ? 33 : idx === 1 ? 66 : 100;

  return (
    <div className="wizard-progress" aria-label="Trip planner progress">
      <div className="wizard-progress-track">
        <div className="wizard-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <ol className="wizard-progress-steps">
        {STEPS.map((s, i) => (
          <li
            key={s.id}
            className={`wizard-progress-step${i <= idx ? " done" : ""}${i === idx ? " active" : ""}`}
          >
            <span className="wizard-progress-dot">{i + 1}</span>
            <span className="wizard-progress-label">{s.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
