import { Link, useParams, Navigate } from "react-router-dom";
import LandingNav from "../LandingNav.jsx";
import Reveal from "../Reveal.jsx";
import Footer from "../Footer.jsx";

function neighbor(order, slug, dir) {
  const i = order.indexOf(slug);
  if (i < 0) return null;
  const j = i + dir;
  return j >= 0 && j < order.length ? order[j] : null;
}

export default function TopicPage({ topics, order, basePath, overviewLabel, dense = false }) {
  const { slug } = useParams();
  const topic = topics[slug];
  if (!topic) return <Navigate to={basePath} replace />;

  const Visual = topic.visual;
  const prevSlug = neighbor(order, slug, -1);
  const nextSlug = neighbor(order, slug, 1);
  const prevTopic = prevSlug ? topics[prevSlug] : null;
  const nextTopic = nextSlug ? topics[nextSlug] : null;

  const pageClass = dense ? "topic-page topic-page--feature" : "topic-page";

  return (
    <div className={`landing info-page ${pageClass}`}>
      <LandingNav />

      <header className="topic-hero">
        <Reveal as="div" variant="up" className="hero-badge">{topic.badge}</Reveal>
        <Reveal as="h1" variant="up" delay={50} className="topic-hero-title">{topic.title}</Reveal>
        <Reveal as="p" variant="up" delay={90} className="topic-hero-lead muted">{topic.lead}</Reveal>
        {topic.summary && (
          <Reveal as="p" variant="up" delay={110} className="topic-hero-summary">{topic.summary}</Reveal>
        )}
      </header>

      <div className="feature-main">
        <Reveal variant="scale" delay={120} className="topic-stage">
          <Visual stage />
        </Reveal>

        <div className="topic-body">
          <Reveal variant="up" delay={140} className="topic-copy">
            {topic.paragraphs.map((p) => (
              <p key={p} className="muted">{p}</p>
            ))}

            <h3 className="topic-subhead">What you get</h3>
            <ul className="info-bullets">
              {topic.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>

            {topic.highlights?.length > 0 && (
              <>
                <h3 className="topic-subhead">Key capabilities</h3>
                <div className="feature-highlights">
                  {topic.highlights.map((h) => (
                    <div key={h.title} className="feature-highlight">
                      <strong>{h.title}</strong>
                      <p className="muted">{h.text}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {topic.details?.length > 0 && (
              <>
                <h3 className="topic-subhead">How it works</h3>
                <div className="feature-details">
                  {topic.details.map((d) => (
                    <div key={d.title} className="feature-detail-block">
                      <h4>{d.title}</h4>
                      <p className="muted">{d.text}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {topic.useCases?.length > 0 && (
              <>
                <h3 className="topic-subhead">Great for</h3>
                <div className="feature-use-cases">
                  {topic.useCases.map((u) => (
                    <span key={u} className="feature-use-chip">{u}</span>
                  ))}
                </div>
              </>
            )}

            <span className="info-tag">{topic.tag}</span>
          </Reveal>
        </div>
      </div>

      <div className="topic-footer-nav">
        <nav className="topic-pager" aria-label="Topic navigation">
          {prevTopic ? (
            <Link to={`${basePath}/${prevSlug}`} className="topic-pager-link prev">
              <span className="topic-pager-dir">← Previous</span>
              <span className="topic-pager-title">{prevTopic.title}</span>
            </Link>
          ) : <span />}
          <Link to={basePath} className="topic-pager-mid">{overviewLabel}</Link>
          {nextTopic ? (
            <Link to={`${basePath}/${nextSlug}`} className="topic-pager-link next">
              <span className="topic-pager-dir">Next →</span>
              <span className="topic-pager-title">{nextTopic.title}</span>
            </Link>
          ) : <span />}
        </nav>
      </div>

      <section className="info-cta info-cta--compact">
        <Reveal as="h2" variant="scale" className="info-cta-title">{topic.ctaTitle}</Reveal>
        <Reveal variant="up" delay={80}>
          <Link to="/login?mode=signup" className="btn-light">{topic.ctaLabel}</Link>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
