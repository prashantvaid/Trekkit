import { Link } from "react-router-dom";
import LandingNav from "../LandingNav.jsx";
import Reveal from "../Reveal.jsx";
import Footer from "../Footer.jsx";

export default function TopicIndex({
  badge,
  title,
  lead,
  intro,
  topics,
  order,
  basePath,
  rich = false,
  ctaTitle = "Ready to map your world?",
  ctaLabel = "Create your free account",
}) {
  const items = order.map((slug) => topics[slug]);

  return (
    <div className={`landing info-page topic-index${rich ? " feature-index" : ""}`}>
      <LandingNav />

      <header className="info-hero">
        <Reveal as="div" variant="up" className="hero-badge">{badge}</Reveal>
        <Reveal as="h1" variant="up" delay={60} className="info-hero-title">{title}</Reveal>
        <Reveal as="p" variant="up" delay={100} className="info-hero-lead muted">{lead}</Reveal>
        {intro && (
          <Reveal as="p" variant="up" delay={120} className="feature-index-intro muted">{intro}</Reveal>
        )}
        <Reveal variant="up" delay={rich ? 150 : 140}>
          <Link to="/login?mode=signup" className="btn-primary">Start free</Link>
        </Reveal>
      </header>

      <div className="info-body">
        <div className="topic-index-grid">
          {items.map((t, i) => {
            const Visual = t.visual;
            return (
              <Reveal key={t.slug} variant="up" delay={i * 60}>
                <Link to={`${basePath}/${t.slug}`} className="topic-index-card">
                  <div className="topic-index-card-visual">
                    <Visual />
                  </div>
                  <div className="topic-index-card-body">
                    <span className="info-tag">{t.tag}</span>
                    <h2>{t.title}</h2>
                    {rich && t.summary ? (
                      <p className="topic-index-summary">{t.summary}</p>
                    ) : (
                      <p className="muted">{t.lead}</p>
                    )}
                    {rich && t.bullets && (
                      <ul className="topic-index-bullets">
                        {t.bullets.slice(0, 2).map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    )}
                    <span className="topic-index-more">Read more →</span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>

      <section className="info-cta info-cta--compact">
        <Reveal as="h2" variant="scale" className="info-cta-title">{ctaTitle}</Reveal>
        <Reveal variant="up" delay={80}>
          <Link to="/login?mode=signup" className="btn-light">{ctaLabel}</Link>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
