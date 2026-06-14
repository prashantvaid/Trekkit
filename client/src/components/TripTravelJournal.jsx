function shortName(name) {
  return (name || "").split(",")[0].trim();
}

function fmtDay(stop) {
  if (stop.day != null) return `Day ${stop.day}`;
  if (stop.visited_on) {
    try {
      return new Date(stop.visited_on).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return null;
    }
  }
  return null;
}

/** Blog-style stop entries — notes and photos from the traveler. */
export default function TripTravelJournal({
  stops = [],
  authorName = "",
  compact = false,
  maxEntries = compact ? 3 : undefined,
}) {
  const entries = stops.filter(
    (s) => (s.notes && s.notes.trim()) || (s.photos && s.photos.length > 0)
  );
  if (entries.length === 0) return null;

  const visible = maxEntries ? entries.slice(0, maxEntries) : entries;
  const hiddenCount = entries.length - visible.length;

  return (
    <section className={`travel-journal${compact ? " travel-journal-compact" : ""}`}>
      <header className="travel-journal-head">
        <h3>{compact ? "From the road" : "Travel journal"}</h3>
        {authorName && (
          <span className="muted small">
            {compact ? `Notes by ${authorName}` : `Stop-by-stop notes from ${authorName}`}
          </span>
        )}
      </header>
      <ol className="journal-entries">
        {visible.map((stop, i) => {
          const dayLabel = fmtDay(stop);
          const globalIndex = stops.findIndex((s) => s.id === stop.id);
          return (
            <li key={stop.id} className="journal-entry">
              <div className="journal-entry-marker" aria-hidden>
                {globalIndex >= 0 ? globalIndex + 1 : i + 1}
              </div>
              <article className="journal-entry-body">
                <header className="journal-entry-head">
                  <strong>{shortName(stop.name)}</strong>
                  {dayLabel && <span className="journal-day tag">{dayLabel}</span>}
                </header>
                {stop.notes?.trim() && (
                  <p className="journal-notes">{stop.notes.trim()}</p>
                )}
                {!compact && stop.photos?.length > 0 && (
                  <div className="journal-photos">
                    {stop.photos.slice(0, compact ? 2 : 4).map((photo) => (
                      <a
                        key={photo.id}
                        href={photo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="journal-photo"
                      >
                        <img src={photo.url} alt="" loading="lazy" />
                      </a>
                    ))}
                    {stop.photos.length > (compact ? 2 : 4) && (
                      <span className="journal-photo-more muted small">
                        +{stop.photos.length - (compact ? 2 : 4)} more
                      </span>
                    )}
                  </div>
                )}
              </article>
            </li>
          );
        })}
      </ol>
      {hiddenCount > 0 && (
        <p className="journal-more muted small">
          {hiddenCount} more stop{hiddenCount === 1 ? "" : "s"} with notes on the full trip →
        </p>
      )}
    </section>
  );
}
