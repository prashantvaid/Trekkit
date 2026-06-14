import { Link } from "react-router-dom";
import LandingNav from "../components/LandingNav.jsx";
import Reveal from "../components/Reveal.jsx";
import Footer from "../components/Footer.jsx";
import { HOW_TOPICS, HOW_ORDER } from "../components/info/topics.js";

const STEP_NUMS = ["01", "02", "03"];

export default function HowItWorks() {
  const steps = HOW_ORDER.map((slug) => HOW_TOPICS[slug]);

  return (
    <div className="landing info-page how-all-page">
      <LandingNav />

      <header className="info-hero">
        <Reveal as="div" variant="up" className="hero-badge">🧭 How it works</Reveal>
        <Reveal as="h1" variant="up" delay={60} className="info-hero-title">
          Three steps to a shared map
        </Reveal>
        <Reveal as="p" variant="up" delay={100} className="info-hero-lead muted">
          From blank trip to a route your friends can explore — create, pin, and share.
        </Reveal>
        <Reveal variant="up" delay={140}>
          <Link to="/login?mode=signup" className="btn-primary">Start free</Link>
        </Reveal>
      </header>

      <div className="info-body">
        <div className="info-timeline" aria-hidden>
          {STEP_NUMS.map((n, i) => (
            <span key={n} className={`info-timeline-step t${i}`}>
              <span className="info-timeline-dot" />
              <span>{n}</span>
            </span>
          ))}
          <span className="info-timeline-line" />
        </div>

        <div className="how-all-steps">
          {steps.map((step, i) => {
            const Visual = step.visual;
            const flip = i % 2 === 1;
            return (
              <Reveal key={step.slug} variant={flip ? "right" : "left"} delay={i * 60}>
                <article className={`info-section${flip ? " flip" : ""}`}>
                  <div className="info-section-visual">
                    <Visual stage={i === 1} />
                  </div>
                  <div className="info-section-copy">
                    <span className="info-step-badge">Step {STEP_NUMS[i]}</span>
                    <h2>{step.title}</h2>
                    <p className="muted">{step.lead}</p>
                    {step.paragraphs.map((p) => (
                      <p key={p} className="muted how-extra">{p}</p>
                    ))}
                    <ul className="info-bullets">
                      {step.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                    <span className="info-tag">{step.tag}</span>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>

      <section className="info-cta">
        <Reveal as="h2" variant="scale" className="info-cta-title">Start your first trip</Reveal>
        <Reveal variant="up" delay={80}>
          <Link to="/login?mode=signup" className="btn-light">Sign up free</Link>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
