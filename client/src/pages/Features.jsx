import { Link } from "react-router-dom";
import LandingNav from "../components/LandingNav.jsx";
import Reveal from "../components/Reveal.jsx";
import Footer from "../components/Footer.jsx";

const SECTIONS = [
  {
    id: "map",
    icon: "🌍",
    title: "A living 3D trip map",
    text: "Every stop you log becomes a glowing pin on an interactive globe, connected by animated arcs that trace your route in the exact order you traveled. Spin it, zoom it, and relive the journey from above.",
  },
  {
    id: "photos",
    icon: "📸",
    title: "Photos pinned where they happened",
    text: "Attach your favorite shots to the exact stop they belong to. Tap any pin to open its gallery — your memories live on the map, not buried in a camera roll.",
  },
  {
    id: "plan",
    icon: "🧭",
    title: "Plan itineraries before you go",
    text: "Search any place on earth and add it to an upcoming trip. Set the day, jot a note, and build a day-by-day plan you can follow once you land.",
  },
  {
    id: "social",
    icon: "👋",
    title: "Friends, feed & kudos",
    text: "Follow other travelers, see their trips appear in your feed, and cheer them on with kudos. Discover new corners of the world through the people you follow.",
  },
  {
    id: "track",
    icon: "🗺️",
    title: "Track trips day by day",
    text: "Trekkit is built for logging as you go. Add a stop the moment you arrive and watch your map fill in throughout the trip.",
  },
];

export default function Features() {
  return (
    <div className="landing">
      <LandingNav />

      <section className="features-hero">
        <Reveal as="div" variant="up" className="hero-badge">✨ Feature tour</Reveal>
        <Reveal as="h1" variant="up" delay={80} className="features-hero-title">
          Everything Trekkit can do
        </Reveal>
        <Reveal as="p" variant="up" delay={160} className="section-lead muted">
          A deeper look at the tools that turn your travels into a map worth sharing.
          More detail coming soon — this page will keep growing.
        </Reveal>
        <Reveal variant="up" delay={240}>
          <Link to="/login?mode=signup" className="btn-primary big">Start your map free</Link>
        </Reveal>
      </section>

      <section className="section feature-detail-list">
        {SECTIONS.map((s, i) => (
          <Reveal
            key={s.id}
            id={s.id}
            variant={i % 2 ? "right" : "left"}
            className={`feature-detail ${i % 2 ? "flip" : ""}`}
          >
            <div className="feature-detail-icon">{s.icon}</div>
            <div className="feature-detail-copy">
              <h2>{s.title}</h2>
              <p className="muted">{s.text}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="cta-band">
        <Reveal as="h2" variant="scale" className="cta-title">Ready to map your world?</Reveal>
        <Reveal variant="up" delay={120}>
          <Link to="/login?mode=signup" className="btn-light big">Create your free account</Link>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
