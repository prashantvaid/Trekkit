import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import TripCard from "../components/TripCard";

const GRADS = [
  "linear-gradient(135deg,#ff8a3c,#ff5a1f)",
  "linear-gradient(135deg,#ffb25e,#ff7a3c)",
  "linear-gradient(135deg,#ffd27a,#ffa14c)",
  "linear-gradient(135deg,#ff9a5c,#ff6a2c)",
];

const MAP_URL = /\b(map|maps|locator|location_map|relief_map|flag_of|coat_of_arms|emblem|openstreetmap|osm)\b/i;
const PEOPLE_URL = /\b(portrait|headshot|selfie|person|people|woman|women|man|men|model|wedding|bikini|nude|crowd)\b/i;

function scenicUrls(urls) {
  return (urls || []).filter((u) => {
    if (!u) return false;
    const hay = decodeURIComponent(u).toLowerCase();
    return !MAP_URL.test(hay) && !PEOPLE_URL.test(hay);
  });
}

function DestPhoto({ destination, index }) {
  const urls = scenicUrls(
    destination.imageUrls?.length
      ? destination.imageUrls
      : destination.imageUrl
        ? [destination.imageUrl]
        : []
  ).slice(0, 2);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [broken, setBroken] = useState(false);

  const current = urls[photoIdx];
  const showImage = current && !broken;

  return (
    <div
      className={`dest-photo${showImage ? " dest-photo-has-image" : ""}`}
      style={!showImage ? { background: GRADS[index % GRADS.length] } : undefined}
    >
      {showImage ? (
        <img
          src={current}
          alt={`${destination.name}, ${destination.country}`}
          className="dest-photo-img"
          loading="lazy"
          onError={() => {
            if (photoIdx < urls.length - 1) {
              setPhotoIdx((i) => i + 1);
            } else {
              setBroken(true);
            }
          }}
        />
      ) : (
        <span className="dest-emoji">{destination.emoji}</span>
      )}
      {destination.matched?.length > 0 && (
        <span className="dest-match">
          ★ {destination.matched.length} match{destination.matched.length > 1 ? "es" : ""}
        </span>
      )}
    </div>
  );
}

export default function Recommended() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [destinations, setDestinations] = useState([]);
  const [hasMoreDest, setHasMoreDest] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollerRef = useRef(null);
  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    api.recommendations().then(setData).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!data) return;
    setDestinations(data.destinations);
    setHasMoreDest(data.destinationsHasMore);
  }, [data]);

  const loadMoreDestinations = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreDest) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const res = await api.recommendationDestinations({
        offset: destinations.length,
        limit: 8,
      });
      setDestinations((prev) => {
        const seen = new Set(prev.map((d) => d.id));
        const fresh = res.destinations.filter((d) => !seen.has(d.id));
        return [...prev, ...fresh];
      });
      setHasMoreDest(res.hasMore);
    } catch {
      /* keep scroll position */
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [destinations.length, hasMoreDest]);

  useEffect(() => {
    const root = scrollerRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !hasMoreDest) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMoreDestinations();
      },
      { root, rootMargin: "80px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreDest, loadMoreDestinations, destinations.length]);

  if (error) return <div className="page"><div className="error">{error}</div></div>;
  if (!data) return <div className="page"><div className="muted">Finding trips for you…</div></div>;

  const hasInterests = data.interests.length > 0;

  return (
    <div className="page recommended">
      <div className="rec-container">
        <div className="page-head">
          <h1>Recommended for you</h1>
          {hasInterests ? (
            <p className="muted">
              Tailored to your love of{" "}
              {data.interests.slice(0, 4).map((t, i) => (
                <span key={t}>
                  <strong>{t}</strong>
                  {i < Math.min(data.interests.length, 4) - 1 ? ", " : ""}
                </span>
              ))}
              .
            </p>
          ) : (
            <p className="muted">
              Popular picks to get you started. Add interests to your profile for tailored suggestions.
            </p>
          )}
        </div>

        {!hasInterests && (
          <div className="card interest-nudge">
            🎯 <strong>Want sharper recommendations?</strong> Tell us what you love —
            beaches, mountains, food, history — and we&apos;ll tune these to you.{" "}
            <Link to="/settings" className="nudge-link">Edit your interests →</Link>
          </div>
        )}
      </div>

      <section className="rec-section dest-section">
        <div className="rec-container">
          <div className="rec-section-head">
            <div>
              <h2>Destinations you&apos;ll love</h2>
              <p className="rec-sub muted">Hand-picked spots that match your travel style.</p>
            </div>
            <span className="rec-hint">Scroll to browse →</span>
          </div>
          <div className="dest-scroll-wrap">
            <div className="dest-scroller" ref={scrollerRef}>
              {destinations.map((d, i) => (
                <article className="dest-card" key={d.id}>
                  <DestPhoto destination={d} index={i} />
                  <div className="dest-body">
                    <div className="dest-name">{d.name}</div>
                    <div className="dest-country muted small">{d.country}</div>
                    <p className="dest-blurb">{d.blurb}</p>
                    <div className="dest-tags">
                      {d.tags.slice(0, 3).map((t) => (
                        <span key={t} className={`chip static ${d.matched?.includes(t) ? "active" : ""}`}>{t}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
              {loadingMore && (
                <div className="dest-card dest-card-loading" aria-hidden>
                  <div className="dest-loading-shimmer" />
                </div>
              )}
              {hasMoreDest && <div className="dest-sentinel" ref={sentinelRef} aria-hidden />}
            </div>
          </div>
        </div>
      </section>

      <div className="rec-container">
        {data.trips.length > 0 && (
          <section className="rec-section">
            <div className="rec-section-head">
              <div>
                <h2>Trips you might like</h2>
                <p className="rec-sub muted">Popular journeys from travelers across Trekkit.</p>
              </div>
            </div>
            <div className="feed-list rec-trips">
              {data.trips.map((t) => (
                <TripCard key={t.id} trip={t} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
