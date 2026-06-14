import PlannerPinsMap from "./PlannerPinsMap.jsx";
import PlannerResultCard from "./PlannerResultCard.jsx";

export default function PlannerResultsWithMap({
  searchLocation,
  plan,
  results,
  loading,
  error,
  note,
  selectedId,
  onSelect,
  onHover,
  actionLabel,
  emptyMessage,
}) {
  const loc = searchLocation || plan?.destination;
  const center =
    loc?.lat != null && loc?.lng != null ? { lat: loc.lat, lng: loc.lng } : null;
  const mappable = results.some((r) => r.lat != null && r.lng != null);

  return (
    <div className="planner-results-with-map">
      {center && mappable && (
        <PlannerPinsMap
          center={center}
          results={results}
          selectedId={selectedId}
          onPinClick={onSelect}
          height={300}
        />
      )}

      {error && <div className="error small">{error}</div>}
      {note && !error && <p className="muted small">{note}</p>}
      {loading && !results.length && (
        <p className="muted small">Loading options near {loc?.name || "your search"}…</p>
      )}

      <div className="planner-search-results">
        {results.map((r) => (
          <div
            key={r.id || r.title}
            className={`planner-browse-result-wrap${selectedId === (r.id || r.title) ? " is-selected" : ""}`}
            onMouseEnter={() => onHover?.(r.id || r.title)}
          >
            <PlannerResultCard item={r} onSelect={onSelect} actionLabel={actionLabel} />
          </div>
        ))}
        {!loading && !results.length && !error && (
          <p className="muted small planner-search-empty">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}
