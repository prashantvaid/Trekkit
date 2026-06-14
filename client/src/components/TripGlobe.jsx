import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { GLOBE_CONTINENTS } from "../globeContinents.js";
import { transportArcColors, transportLabel } from "../transportModes.js";
import { hasOriginCoords } from "../tripOrigin.js";
import {
  arcAltitudeForSegment,
  arcStrokeForSegment,
  globeViewAltitude,
  globeViewCenter,
  haversineKm,
} from "../globeRouteUtils.js";

function shortName(name) {
  return (name || "").split(",")[0].trim();
}

function escapeHtml(s) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Photo pins as HTML overlay — state lives here so the WebGL globe is not re-rendered every frame. */
function GlobePhotoOverlay({ globeRef, globeReady, photoPins, width, height, onPhotoClick }) {
  const onPhotoClickRef = useRef(onPhotoClick);
  const [positions, setPositions] = useState([]);

  onPhotoClickRef.current = onPhotoClick;

  const updatePositions = useCallback(() => {
    const globe = globeRef.current;
    if (!globe || !photoPins.length) {
      setPositions([]);
      return;
    }
    const next = [];
    for (const p of photoPins) {
      try {
        const coords = globe.getScreenCoords(p.lat, p.lng, 0.03);
        if (!coords || !Number.isFinite(coords.x) || !Number.isFinite(coords.y)) continue;
        if (coords.x < -40 || coords.y < -40 || coords.x > width + 40 || coords.y > height + 40) {
          continue;
        }
        next.push({ ...p, x: coords.x, y: coords.y });
      } catch {
        /* ignore projection errors */
      }
    }
    setPositions(next);
  }, [globeRef, photoPins, width, height]);

  useEffect(() => {
    if (!globeReady || !photoPins.length) {
      setPositions([]);
      return undefined;
    }

    updatePositions();
    const globe = globeRef.current;
    if (!globe) return undefined;

    const controls = globe.controls();
    controls.addEventListener("change", updatePositions);
    const tick = setInterval(updatePositions, 50);

    return () => {
      controls.removeEventListener("change", updatePositions);
      clearInterval(tick);
    };
  }, [globeReady, globeRef, photoPins, updatePositions]);

  if (!positions.length) return null;

  return (
    <div className="globe-photo-overlay" aria-hidden={false}>
      {positions.map((p) => (
        <div
          key={p.key || p.id || `${p.lat}-${p.lng}`}
          role="button"
          tabIndex={0}
          className={`globe-photo-pin${p.hasGps ? " has-gps" : " at-stop"}`}
          style={{ left: `${p.x}px`, top: `${p.y}px` }}
          title={p.stopName || "Photo"}
          onClick={() => onPhotoClickRef.current?.(p)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onPhotoClickRef.current?.(p);
            }
          }}
        >
          <img src={p.url} alt="" loading="lazy" draggable={false} />
        </div>
      ))}
    </div>
  );
}

const TripGlobe = forwardRef(function TripGlobe(
  {
    stops = [],
    origin = null,
    photos = [],
    height = 460,
    onStopClick,
    onPhotoClick,
    autoRotate = true,
    animateArcs = true,
    showRoute = true,
    showArcs,
    showMarkers,
    showPhotoPins = true,
    showContinentLabels,
  },
  ref
) {
  const arcsVisible = showArcs ?? showRoute;
  const markersVisible = showMarkers ?? showRoute;
  const labelsVisible = showRoute;
  const continentLabelsVisible = showContinentLabels ?? !showRoute;
  const ringsVisible = showRoute || showArcs === true;
  const globeEl = useRef();
  const wrapRef = useRef();
  const [width, setWidth] = useState(800);
  const [globeReady, setGlobeReady] = useState(false);

  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  const cameraTarget = useMemo(
    () => globeViewCenter(stops, origin),
    [stops, origin]
  );

  useImperativeHandle(
    ref,
    () => ({
      resetView(duration = 1200) {
        if (!globeEl.current || (!stops.length && !hasOriginCoords(origin))) return;
        const controls = globeEl.current.controls();
        controls.autoRotate = autoRotateRef.current;
        globeEl.current.pointOfView(
          { ...cameraTarget, altitude: globeViewAltitude(stops, { origin }) },
          duration
        );
      },
      zoomToRoute(duration = 1400) {
        return new Promise((resolve) => {
          if (!globeEl.current || (!stops.length && !hasOriginCoords(origin))) {
            resolve();
            return;
          }
          globeEl.current.controls().autoRotate = false;
          globeEl.current.pointOfView(
            {
              ...cameraTarget,
              altitude: globeViewAltitude(stops, { origin, zoomed: true }),
            },
            duration
          );
          setTimeout(resolve, duration + 80);
        });
      },
      zoomToPhoto(photo, duration = 1100) {
        return new Promise((resolve) => {
          if (!globeEl.current || !Number.isFinite(photo?.lat) || !Number.isFinite(photo?.lng)) {
            resolve();
            return;
          }
          globeEl.current.controls().autoRotate = false;
          globeEl.current.pointOfView(
            { lat: photo.lat, lng: photo.lng, altitude: 0.28 },
            duration
          );
          setTimeout(() => {
            if (globeEl.current && autoRotateRef.current) {
              globeEl.current.controls().autoRotate = true;
            }
          }, duration + 120);
          setTimeout(resolve, duration + 80);
        });
      },
    }),
    [stops, origin, cameraTarget]
  );

  const photoPins = useMemo(
    () =>
      (photos || []).filter(
        (p) => showPhotoPins && Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.url
      ),
    [photos, showPhotoPins]
  );

  const handleGlobeReady = useCallback(() => {
    setGlobeReady(true);
    if (wrapRef.current) {
      const w = wrapRef.current.clientWidth || wrapRef.current.offsetWidth;
      if (w > 0) setWidth(w);
    }
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;

    function measure() {
      const w = el.clientWidth || el.offsetWidth;
      if (w > 0) setWidth(w);
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [height]);

  useEffect(() => {
    if (!globeEl.current || !globeReady) return;
    const controls = globeEl.current.controls();
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.85;
    controls.enableZoom = false;
  }, [autoRotate, globeReady]);

  useEffect(() => {
    if (!globeEl.current || !globeReady) return;
    if (!stops.length && !hasOriginCoords(origin)) return;
    globeEl.current.pointOfView(
      { ...cameraTarget, altitude: globeViewAltitude(stops, { origin }) },
      1400
    );
  }, [stops, origin, globeReady, cameraTarget]);

  const points = useMemo(() => {
    const stopPoints = stops.map((s, i) => ({
      ...s,
      order: i + 1,
      size: 0.65,
      color: "#ff5a1f",
      label: shortName(s.name),
      isOrigin: false,
    }));
    if (!hasOriginCoords(origin)) return stopPoints;
    return [
      {
        lat: origin.lat,
        lng: origin.lng,
        name: origin.name,
        order: 0,
        size: 0.55,
        color: "#0369a1",
        label: `From · ${shortName(origin.name)}`,
        isOrigin: true,
      },
      ...stopPoints,
    ];
  }, [stops, origin]);

  const arcs = useMemo(() => {
    const out = [];
    if (stops.length > 0 && hasOriginCoords(origin)) {
      const distanceKm = haversineKm(origin.lat, origin.lng, stops[0].lat, stops[0].lng);
      if (distanceKm >= 0.05) {
        out.push({
          startLat: origin.lat,
          startLng: origin.lng,
          endLat: stops[0].lat,
          endLng: stops[0].lng,
          transport: "plane",
          distanceKm,
          isOrigin: true,
        });
      }
    }
    for (let i = 0; i < stops.length - 1; i++) {
      const distanceKm = haversineKm(
        stops[i].lat,
        stops[i].lng,
        stops[i + 1].lat,
        stops[i + 1].lng
      );
      if (distanceKm < 0.05) continue;
      out.push({
        startLat: stops[i].lat,
        startLng: stops[i].lng,
        endLat: stops[i + 1].lat,
        endLng: stops[i + 1].lng,
        transport: stops[i + 1].transport_mode || null,
        distanceKm,
      });
    }
    return out;
  }, [stops, origin]);

  const rings = useMemo(() => {
    const originRing = hasOriginCoords(origin)
      ? [{
          lat: origin.lat,
          lng: origin.lng,
          maxR: 2.8,
          propagationSpeed: 1.2,
          repeatPeriod: 1400,
        }]
      : [];
    return [
      ...originRing,
      ...stops.map((s, i) => ({
        lat: s.lat,
        lng: s.lng,
        maxR: 3 + i * 0.15,
        propagationSpeed: 1.5 + (i % 3) * 0.3,
        repeatPeriod: 1200 + i * 80,
      })),
    ];
  }, [stops, origin]);

  const continentLabels = useMemo(
    () => GLOBE_CONTINENTS.map((c) => ({ ...c, label: c.name })),
    []
  );

  const globeLabels = useMemo(() => {
    if (labelsVisible) return points;
    if (continentLabelsVisible) return continentLabels;
    return [];
  }, [labelsVisible, continentLabelsVisible, points, continentLabels]);

  function pointLabel(d) {
    if (d.isOrigin) {
      return `<div class="globe-tip globe-tip-origin"><b>${escapeHtml(d.label)}</b><span class="globe-tip-transport">Home</span></div>`;
    }
    const note = d.notes?.trim();
    const day = d.day != null ? `Day ${d.day}` : "";
    const transport = d.transport_mode ? transportLabel(d.transport_mode) : "";
    const noteHtml = note
      ? `<p class="globe-tip-note">${escapeHtml(note.length > 120 ? `${note.slice(0, 117)}…` : note)}</p>`
      : "";
    const dayHtml = day ? `<span class="globe-tip-day">${day}</span>` : "";
    const transportHtml = transport
      ? `<span class="globe-tip-transport">${escapeHtml(transport)}</span>`
      : "";
    return `<div class="globe-tip"><b>${d.order}. ${escapeHtml(d.label)}</b>${dayHtml}${transportHtml}${noteHtml}</div>`;
  }

  return (
    <div
      ref={wrapRef}
      className="globe-wrap globe-animated globe-wrap-photos"
      style={{ height, minHeight: height }}
    >
      <Globe
        ref={globeEl}
        width={Math.max(width, 1)}
        height={height}
        onGlobeReady={handleGlobeReady}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        atmosphereColor="#ff8a3c"
        atmosphereAltitude={0.22}
        pointsData={markersVisible ? points : []}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.04}
        pointRadius="size"
        pointLabel={labelsVisible ? pointLabel : undefined}
        onPointClick={markersVisible ? (d) => onStopClick && onStopClick(d) : undefined}
        arcsData={arcsVisible && arcs.length ? arcs : []}
        arcColor={(arc) => transportArcColors(arc.transport)}
        arcAltitude={(arc) => arcAltitudeForSegment(arc.distanceKm, arc.transport)}
        arcAltitudeAutoScale={0.42}
        arcDashLength={(arc) =>
          animateArcs ? (arc.transport === "plane" ? 0.28 : 0.45) : 1
        }
        arcDashGap={0.15}
        arcDashAnimateTime={animateArcs ? 1800 : 0}
        arcStroke={(arc) => arcStrokeForSegment(arc.distanceKm)}
        ringsData={ringsVisible ? rings : []}
        ringColor={(t) => `rgba(255, 90, 31, ${1 - t})`}
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        labelsData={globeLabels}
        labelLat="lat"
        labelLng="lng"
        labelText="label"
        labelSize={(d) => (d.isContinent ? 1.2 : 1.1)}
        labelColor={(d) =>
          d.isContinent ? "rgba(255, 238, 215, 0.82)" : "rgba(255,255,255,0.95)"
        }
        labelDotRadius={(d) => (d.isContinent ? 0 : 0.4)}
        labelAltitude={(d) => (d.isContinent ? 0.008 : 0.05)}
        labelResolution={2}
      />
      <GlobePhotoOverlay
        globeRef={globeEl}
        globeReady={globeReady}
        photoPins={photoPins}
        width={width}
        height={height}
        onPhotoClick={onPhotoClick}
      />
    </div>
  );
});

export default TripGlobe;
