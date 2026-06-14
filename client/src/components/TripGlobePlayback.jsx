import { lazy, Suspense, useEffect, useRef, useState } from "react";
import TripGlobe from "./TripGlobe.jsx";
import TripPhotoStrip from "./TripPhotoStrip.jsx";
import { DEFAULT_MAP_PRESETS } from "../mapPresets.js";

const TripMap = lazy(() => import("./TripMap.jsx"));
const EXIT_MS = 900;

/** Globe-only preview → zoom-in transition → 3D map tour → back to globe. */
export default function TripRoutePlayback({
  stops = [],
  origin = null,
  photos = [],
  height = 360,
  mapHeight = 440,
  autoRotate = true,
  showControls = true,
  showPhotoStrip = true,
  focus = null,
  defaultPresets = DEFAULT_MAP_PRESETS,
  onStopClick,
  tripId,
}) {
  const globeRef = useRef(null);
  const mapRef = useRef(null);
  const phaseRef = useRef("globe");
  const userStoppedRef = useRef(false);
  const returnTimerRef = useRef(null);
  const [phase, setPhase] = useState("globe");
  const [transitionDir, setTransitionDir] = useState("in");
  const [autoPlay, setAutoPlay] = useState(false);
  const [touring, setTouring] = useState(false);

  phaseRef.current = phase;

  useEffect(() => () => {
    if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
  }, []);

  if (stops.length === 0) return null;

  async function returnToGlobe({ animated = true } = {}) {
    if (returnTimerRef.current) {
      clearTimeout(returnTimerRef.current);
      returnTimerRef.current = null;
    }
    mapRef.current?.stopRouteTour();
    setTouring(false);
    setAutoPlay(false);

    if (!animated || phaseRef.current === "globe") {
      setPhase("globe");
      globeRef.current?.resetView?.();
      return;
    }

    setTransitionDir("out");
    setPhase("transitioning");
    await new Promise((r) => setTimeout(r, EXIT_MS));
    setPhase("globe");
    globeRef.current?.resetView?.();
  }

  async function startMapTour() {
    if (phase !== "globe") return;
    userStoppedRef.current = false;
    setAutoPlay(true);
    setTransitionDir("in");
    setPhase("transitioning");
    await globeRef.current?.zoomToRoute?.(1400);
    setPhase("map");
  }

  function stopTour() {
    userStoppedRef.current = true;
    if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
    mapRef.current?.stopRouteTour();
    setTouring(false);
  }

  function backToGlobe() {
    userStoppedRef.current = true;
    returnToGlobe({ animated: true });
  }

  function handleTourStateChange(active) {
    setTouring(active);
    if (active || userStoppedRef.current || phaseRef.current !== "map") return;

    returnTimerRef.current = setTimeout(() => {
      returnTimerRef.current = null;
      returnToGlobe({ animated: true });
    }, 1200);
  }

  function replayTour() {
    userStoppedRef.current = false;
    mapRef.current?.playRouteTour();
  }

  function handlePhotoSelect(photo) {
    if (phase === "map") return;
    globeRef.current?.zoomToPhoto?.(photo);
  }

  const showMapLayer = phase === "map" || phase === "transitioning";
  const showGlobeLayer = phase === "globe" || phase === "transitioning";
  const showGlobeExtras = phase === "globe";
  const stageHeight =
    phase === "globe" || (phase === "transitioning" && transitionDir === "out")
      ? height
      : mapHeight;

  const mapLayerClass =
    phase === "map"
      ? "is-visible"
      : transitionDir === "in"
        ? "is-entering"
        : "is-leaving";

  const globeLayerClass =
    phase === "transitioning"
      ? transitionDir === "in"
        ? "is-leaving"
        : "is-entering"
      : "";

  return (
    <div
      className={`route-playback${phase === "map" ? " route-playback-map" : ""}${touring ? " is-touring" : ""}${phase === "transitioning" ? " is-transitioning" : ""}`}
    >
      <div className="route-playback-stage" style={{ height: stageHeight }}>
        {showMapLayer && (
          <div className={`route-playback-map-layer ${mapLayerClass}`}>
            <Suspense fallback={<div className="route-playback-loading">Loading 3D map…</div>}>
              <TripMap
                ref={mapRef}
                stops={stops}
                origin={origin}
                focus={focus}
                height={mapHeight}
                embedded
                autoPlayTour={autoPlay}
                preserveView
                interactive
                onStopClick={onStopClick}
                onTourStateChange={handleTourStateChange}
                defaultPresets={{ ...defaultPresets, routeStyle: "animated" }}
              />
            </Suspense>
          </div>
        )}

        {showGlobeLayer && (
          <div className={`route-playback-globe-layer ${globeLayerClass}`.trim()}>
            <TripGlobe
              ref={globeRef}
              stops={stops}
              origin={origin}
              photos={photos}
              height={stageHeight}
              autoRotate={autoRotate && phase === "globe"}
              showRoute={false}
              showContinentLabels
              showArcs
              showMarkers
              showPhotoPins={false}
              animateArcs
              onStopClick={onStopClick}
              onPhotoClick={handlePhotoSelect}
            />
          </div>
        )}
      </div>

      {showPhotoStrip && showGlobeExtras && photos.length > 0 && (
        <TripPhotoStrip
          photos={photos}
          tripId={tripId}
          onPhotoSelect={handlePhotoSelect}
        />
      )}

      {showControls && (
        <div className="globe-playback-bar route-playback-bar">
          {phase === "map" ? (
            <>
              <button
                type="button"
                className="globe-playback-btn"
                onClick={touring ? stopTour : replayTour}
              >
                {touring ? "Stop tour" : "▶ Replay route"}
              </button>
              <button type="button" className="globe-playback-back" onClick={backToGlobe}>
                Globe view
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="globe-playback-btn"
                onClick={startMapTour}
                disabled={phase === "transitioning"}
              >
                {phase === "transitioning" && transitionDir === "in"
                  ? "Zooming in…"
                  : phase === "transitioning"
                    ? "Returning to globe…"
                    : "▶ Play route"}
              </button>
              <span className="route-playback-hint muted small">
                {phase === "transitioning" && transitionDir === "in"
                  ? "Dropping into the map…"
                  : phase === "transitioning"
                    ? "Back to earth view…"
                    : "Fly through stops on a 3D map"}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
