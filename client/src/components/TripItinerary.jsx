import StopPhotos from "./StopPhotos.jsx";
import TransportIcon from "./TransportIcon.jsx";
import { transportMode, transportTheme } from "../transportModes.js";
import { groupStopsByDay } from "../itineraryUtils.js";

function fmtCoords(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function StopConnector({ mode }) {
  const theme = mode ? transportTheme(mode) : null;
  const meta = mode ? transportMode(mode) : null;

  return (
    <div
      className={`itinerary-connector${mode ? ` is-${mode}` : ""}`}
      style={theme ? { "--connector-color": theme.color, "--connector-bg": theme.bg } : undefined}
      aria-hidden
    >
      <div className={`itinerary-connector-rail${theme ? ` is-${theme.line}` : ""}`} />
      {mode && meta && (
        <div className="itinerary-transport">
          <span className="itinerary-transport-icon">
            <TransportIcon mode={mode} size={14} />
          </span>
          <span className="itinerary-transport-copy">
            <span className="itinerary-transport-verb">{theme.verb}</span>
            <span className="itinerary-transport-mode">{meta.label}</span>
          </span>
        </div>
      )}
    </div>
  );
}

export default function TripItinerary({
  stops = [],
  tripId,
  isOwner,
  selectedStopId,
  stopRefs,
  onFocusStop,
  onDeleteStop,
  onChange,
  showPhotos = true,
}) {
  const dayGroups = groupStopsByDay(stops);
  let globalIndex = 0;

  if (!stops.length) {
    return <p className="muted">No stops pinned yet.</p>;
  }

  return (
    <div className="itinerary-by-day">
      {dayGroups.map(([day, dayStops]) => (
        <section key={day ?? "unscheduled"} className="itinerary-day-block">
          <header className="itinerary-day-head">
            <h3>{day != null ? `Day ${day}` : "Unscheduled"}</h3>
            <span className="muted small">
              {dayStops.length} stop{dayStops.length === 1 ? "" : "s"}
            </span>
          </header>
          <ol className="stop-list">
            {dayStops.map((stop) => {
              globalIndex += 1;
              const idx = globalIndex;
              return (
                <li key={stop.id}>
                  {idx > 1 && <StopConnector mode={stop.transport_mode} />}
                  <div
                    ref={(el) => {
                      if (stopRefs) stopRefs.current[stop.id] = el;
                    }}
                    className={`stop ${selectedStopId === stop.id ? "selected" : ""}`}
                    onClick={() => onFocusStop?.(stop)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onFocusStop?.(stop);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="stop-index">{idx}</div>
                    <div className="stop-body">
                      <div className="stop-top">
                        <strong>{stop.name}</strong>
                        {stop.place_type && (
                          <span className="tag tag-muted">{stop.place_type.replace(/_/g, " ")}</span>
                        )}
                      </div>
                      <span className="stop-coords">{fmtCoords(stop.lat, stop.lng)}</span>
                      {stop.notes && <p className="stop-notes">{stop.notes}</p>}
                      {showPhotos && (
                        <StopPhotos
                          tripId={tripId}
                          stop={stop}
                          isOwner={isOwner}
                          onChange={onChange}
                        />
                      )}
                      {isOwner && onDeleteStop && (
                        <button
                          type="button"
                          className="link-btn danger small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteStop(stop.id);
                          }}
                        >
                          Remove stop
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
