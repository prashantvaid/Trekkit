import { useState } from "react";
import StepMock from "./StepMock.jsx";

const STEPS = [
  {
    tag: "Step 1",
    title: "Pin a place in seconds",
    text: "Type any city, landmark, or hidden gem and Trekkit finds it on the map. Set the day, add a quick note, and it lands on your globe instantly — no coordinates, no fuss.",
    bullets: ["Search anywhere on earth", "Auto-placed on your 3D map", "Add the day & a note"],
    emoji: "📍",
    grad: "linear-gradient(135deg,#ff8a3c,#ff5a1f)",
  },
  {
    tag: "Step 2",
    title: "Make your memories tappable",
    text: "Attach photos to the exact stop where you took them. Every pin opens into a little gallery, so your trip lives on the map instead of buried in your camera roll.",
    bullets: ["Upload or link photos", "Grouped by stop", "Tap a pin to relive it"],
    emoji: "📸",
    grad: "linear-gradient(135deg,#ffb25e,#ff7a3c)",
  },
  {
    tag: "Step 3",
    title: "Share a map worth scrolling",
    text: "Post your trip to your feed and let friends explore where you went. They can follow along, leave kudos, and get inspired for their own next adventure.",
    bullets: ["Public or private trips", "Friends' trips in your feed", "Give & get kudos"],
    emoji: "🌍",
    grad: "linear-gradient(135deg,#ffd27a,#ffa14c)",
  },
];

export default function FeatureStepper() {
  const [active, setActive] = useState(0);
  const step = STEPS[active];
  const next = () => setActive((a) => (a + 1) % STEPS.length);
  const prev = () => setActive((a) => (a - 1 + STEPS.length) % STEPS.length);

  return (
    <div className="stepper">
      <div className="stepper-tabs">
        {STEPS.map((s, i) => (
          <button
            key={s.tag}
            className={`stepper-tab ${i === active ? "active" : ""}`}
            onClick={() => setActive(i)}
          >
            <span className="stepper-tab-num">{i + 1}</span>
            <span className="stepper-tab-label">{s.title}</span>
          </button>
        ))}
      </div>

      <div className="stepper-body">
        {/* key forces the fade/slide animation to replay on change */}
        <div className="stepper-copy" key={`copy-${active}`}>
          <span className="stepper-tag">{step.tag}</span>
          <h3>{step.title}</h3>
          <p className="muted">{step.text}</p>
          <ul className="stepper-bullets">
            {step.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <div className="stepper-controls">
            <button className="stepper-arrow" onClick={prev} aria-label="Previous step">←</button>
            <div className="stepper-dots">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  className={`stepper-dot ${i === active ? "active" : ""}`}
                  onClick={() => setActive(i)}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
            <button className="stepper-arrow" onClick={next} aria-label="Next step">→</button>
          </div>
        </div>

        <div className="stepper-visual" key={`vis-${active}`} style={{ background: step.grad }}>
          <StepMock index={active} />
        </div>
      </div>
    </div>
  );
}
