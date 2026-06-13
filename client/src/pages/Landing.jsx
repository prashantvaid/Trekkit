import { Link } from "react-router-dom";
import LandingGlobe from "../components/LandingGlobe.jsx";
import DashboardDemo from "../components/DashboardDemo.jsx";
import Reveal from "../components/Reveal.jsx";
import LandingNav from "../components/LandingNav.jsx";
import CountUp from "../components/CountUp.jsx";
import PostcardStack from "../components/PostcardStack.jsx";
import FeatureStepper from "../components/FeatureStepper.jsx";
import Footer from "../components/Footer.jsx";
import RotatingWord from "../components/RotatingWord.jsx";
import PlannerPreview from "../components/PlannerPreview.jsx";

const STATS = [
  { to: 190, suffix: "+", label: "countries to explore" },
  { staticValue: "∞", label: "pins per trip" },
  { staticValue: "3D", label: "interactive globe" },
  { to: 100, suffix: "%", label: "free to start" },
];

const FEATURES = [
  { icon: "🗺️", title: "Day-by-day tracking", text: "Log each leg of your trip as it happens and keep an effortless travel diary." },
  { icon: "🌍", title: "A living 3D globe", text: "Every journey renders as glowing pins and arcs across an interactive planet." },
  { icon: "📸", title: "Photos on the map", text: "Pin your favorite shots exactly where you took them, stop by stop." },
  { icon: "🧭", title: "Build itineraries", text: "Search any place on earth and plan your route before you even pack." },
  { icon: "👋", title: "Follow friends", text: "See where your people are wandering and cheer them on with kudos." },
  { icon: "✨", title: "A feed worth scrolling", text: "Trips from you and the travelers you follow, mapped and beautiful." },
];

const STEPS = [
  { n: "01", title: "Start a trip", text: "Give it a name and dates. That's the whole setup." },
  { n: "02", title: "Drop your pins", text: "Search a place, add the day and a note, and it lands on your map." },
  { n: "03", title: "Share the journey", text: "Post it to your feed and let friends explore where you went." },
];

export default function Landing() {
  return (
    <div className="landing">
      <LandingNav />

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" aria-hidden>
          <span className="blob blob-1" />
          <span className="blob blob-2" />
        </div>
        <div className="hero-inner">
          <div className="hero-copy">
            <Reveal as="div" variant="up" className="hero-badge">🌍 Your travel journal, mapped</Reveal>
            <Reveal as="h1" variant="up" delay={80} className="hero-title">
              Every trip,{" "}
              <RotatingWord words={["mapped.", "pinned.", "remembered.", "charted.", "relived."]} />
            </Reveal>
            <Reveal as="p" variant="up" delay={160} className="hero-sub">
              Trekkit turns your travels into a living map. Track trips day by day, drop a pin
              wherever you wander, attach your photos, and watch it all come alive on an
              interactive 3D globe you can share with friends.
            </Reveal>
            <Reveal as="div" variant="up" delay={240} className="hero-cta">
              <Link to="/login?mode=signup" className="btn-primary big">Start your map — it's free</Link>
              <Link to="/login" className="btn-ghost big">Log in</Link>
            </Reveal>
            <Reveal as="div" variant="up" delay={320} className="hero-mini">
              No credit card · Unlimited pins · Built for wanderers
            </Reveal>
          </div>
          <Reveal variant="scale" delay={120} className="hero-visual">
            <LandingGlobe size={460} />
          </Reveal>
        </div>
      </section>

      {/* Stat strip */}
      <section className="stat-strip">
        {STATS.map((s, i) => (
          <Reveal key={s.label} variant="up" delay={i * 80} className="stat">
            <div className="stat-big">
              <CountUp to={s.to} suffix={s.suffix} staticValue={s.staticValue} />
            </div>
            <div className="stat-small">{s.label}</div>
          </Reveal>
        ))}
      </section>

      {/* How it works + animated demo */}
      <section id="how" className="section how">
        <Reveal as="h2" variant="up" className="section-title">From wheels-down to shared in three steps</Reveal>
        <Reveal as="p" variant="up" delay={80} className="section-lead muted">
          Watch it work — this is the actual trip builder, pinning a route across Japan.
        </Reveal>

        <div className="how-grid">
          <Reveal variant="left" className="how-demo">
            <DashboardDemo />
          </Reveal>
          <ol className="how-steps">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.n} variant="right" delay={i * 120} className="how-step">
                <span className="step-num">{s.n}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p className="muted">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Interactive 3-step tour */}
      <section className="section tour">
        <Reveal as="h2" variant="up" className="section-title">Take the tour</Reveal>
        <Reveal as="p" variant="up" delay={80} className="section-lead muted">
          Click through the three steps that take you from idea to shared map.
        </Reveal>
        <Reveal variant="up" delay={120}>
          <FeatureStepper />
        </Reveal>
      </section>

      {/* Features */}
      <section id="features" className="section features">
        <Reveal as="h2" variant="up" className="section-title">Everything your trips deserve</Reveal>
        <Reveal as="p" variant="up" delay={80} className="section-lead muted">
          A travel log, a planner, and a social map — all in one place.
        </Reveal>
        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} variant="up" delay={(i % 3) * 100} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p className="muted">{f.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Showcase — postcard stack */}
      <section className="section showcase">
        <Reveal variant="left" className="showcase-cards">
          <PostcardStack />
        </Reveal>
        <div className="showcase-copy">
          <Reveal as="h2" variant="right" className="section-title left">Every trip becomes a keepsake</Reveal>
          <Reveal as="p" variant="right" delay={100} className="muted">
            Each journey turns into a shareable card — the places, the photos, the route — collected
            in one feed. It's your passport and your photo album, reimagined as a map.
          </Reveal>
          <Reveal variant="right" delay={200}>
            <Link to="/login?mode=signup" className="btn-primary">Start collecting</Link>
          </Reveal>
        </div>
      </section>

      {/* Trip planning */}
      <section className="section planning">
        <div className="planning-copy">
          <Reveal as="span" variant="right" className="soon-badge">Coming soon</Reveal>
          <Reveal as="h2" variant="right" delay={60} className="section-title left">Plan it before you live it</Reveal>
          <Reveal as="p" variant="right" delay={120} className="muted">
            Map out your next trip day by day: drag in must-see spots, rough out a schedule,
            track a budget, and tick off a packing list. When you're on the road, your plan
            becomes the trip you track — no starting from scratch.
          </Reveal>
          <Reveal as="ul" variant="right" delay={180} className="planning-points">
            <li>Day-by-day itinerary builder</li>
            <li>Save ideas &amp; suggested places</li>
            <li>Budget estimator &amp; packing checklist</li>
            <li>🧭 Sherpa, your AI travel guide, drafts it for you</li>
            <li>One tap to turn a plan into a tracked trip</li>
          </Reveal>
          <Reveal variant="right" delay={240}>
            <Link to="/login?mode=signup" className="btn-primary">Get early access</Link>
          </Reveal>
        </div>
        <Reveal variant="left" className="planning-visual">
          <PlannerPreview />
        </Reveal>
      </section>

      {/* Final CTA */}
      <section className="cta-band">
        <Reveal as="h2" variant="scale" className="cta-title">Your next adventure deserves a map.</Reveal>
        <Reveal variant="up" delay={120}>
          <Link to="/login?mode=signup" className="btn-light big">Create your free account</Link>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
