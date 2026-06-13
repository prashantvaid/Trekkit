import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { api } from "../api.js";
import { DEFAULT_MAP_PRESETS, migrateBasemap } from "../mapPresets.js";
import { createLandmark3DLayer } from "../landmarks/Landmark3DLayer.js";
import { landmarksFromStops, resolveLandmark } from "../landmarks/match.js";

/** Vector tile styles — `apple` reuses bright tiles with a pastel paint preset. */
const STYLE_URLS = {
  bright: "https://tiles.openfreemap.org/styles/bright",
  liberty: "https://tiles.openfreemap.org/styles/liberty",
  apple: "https://tiles.openfreemap.org/styles/bright",
};

const COLORFUL_STYLE = STYLE_URLS.bright;

/** Pitched urban camera — 3D buildings, no terrain DEM warp. */
const CITY_3D = {
  pitch: 58,
  bearing: -24,
  zoomBoost: 0,
};

const GLOBE_ZOOM_THRESHOLD = 5.5;
const CITY_PITCH_ZOOM = 9.5;
/** Globe projection kicks in below city zoom; don't zoom out past regional view. */
const MIN_ZOOM = 5;

function pitchForZoom(zoom) {
  if (zoom <= GLOBE_ZOOM_THRESHOLD) return 0;
  if (zoom >= CITY_PITCH_ZOOM) return CITY_3D.pitch;
  const t = (zoom - GLOBE_ZOOM_THRESHOLD) / (CITY_PITCH_ZOOM - GLOBE_ZOOM_THRESHOLD);
  return CITY_3D.pitch * t;
}

function bearingForZoom(zoom) {
  return zoom < GLOBE_ZOOM_THRESHOLD ? 0 : CITY_3D.bearing;
}

const ROUTE_STYLES = {
  animated: { label: "Animated route", showRoute: true, animate: true },
  solid: { label: "Solid route", showRoute: true, animate: false },
  hidden: { label: "Hide route", showRoute: false, animate: false },
};

const ROUTE_FLOW_LEN = 0.16;

const DEFAULT_SKY = {
  "sky-color": "#8ec5f8",
  "sky-horizon-blend": 0.42,
  "horizon-color": "#e8eef5",
  "horizon-fog-blend": 0.32,
  "fog-color": "#e4edf8",
  "fog-ground-blend": 0.4,
};

const DEFAULT_BUILDINGS = ["#ddd6cc", "#d0c8bc", "#c4bab0", "#b8ada2", "#aca094"];

/** Optional Apple Maps paint preset (basemap === "apple" only). */
const APPLE = {
  canvas: "#F2F0EA",
  water: "#A8D8F8",
  waterDeep: "#8EC5EA",
  park: "#B8E0A4",
  parkWood: "#9FCD8C",
  grass: "#C8E8B0",
  residential: "#EDE9E2",
  commercial: "#E8E4DC",
  industrial: "#E0E0E6",
  cemetery: "#D4E8CC",
  school: "#F0EBE2",
  hospital: "#F5E6E6",
  building: ["#EDEAE4", "#E5E1DA", "#DCD7CF", "#D0CAC2", "#C4BDB4"],
  sky: {
    "sky-color": "#B8D9F5",
    "sky-horizon-blend": 0.55,
    "horizon-color": "#F4F1EB",
    "horizon-fog-blend": 0.42,
    "fog-color": "#EEF4FA",
    "fog-ground-blend": 0.48,
  },
};

const ROUTE_ORANGE = "#fc4c02";
const ROUTE_CASING = "#ffffff";

const emptyLine = () => ({ type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} });
const emptyPoints = () => ({ type: "FeatureCollection", features: [] });

function hasCoords(c) {
  return c && Number.isFinite(c.lat) && Number.isFinite(c.lng);
}

function shortName(name) {
  return (name || "").split(",")[0].trim();
}

const POI_TYPES = new Set([
  "tower", "monument", "museum", "attraction", "viewpoint", "artwork", "memorial", "peak", "ruins", "archaeological_site",
]);
const BUILDING_TYPES = new Set([
  "building", "house", "hotel", "restaurant", "cafe", "shop", "supermarket", "station", "stop", "bus_stop",
]);
const CITY_TYPES = new Set(["city", "town", "village", "hamlet", "suburb", "neighbourhood"]);

function zoomForPlace(placeType) {
  if (!placeType) return 15;
  if (POI_TYPES.has(placeType)) return 16;
  if (BUILDING_TYPES.has(placeType)) return 17;
  if (CITY_TYPES.has(placeType)) return 13;
  if (placeType === "country") return 5;
  return 15;
}

function flattenMapPhotos(stops) {
  const out = [];
  for (const stop of stops) {
    const photos = stop.photos || [];
    if (!Number.isFinite(stop.lat) || !Number.isFinite(stop.lng)) continue;
    photos.forEach((photo) => {
      const hasGps = Number.isFinite(photo.lat) && Number.isFinite(photo.lng);
      out.push({
        ...photo,
        lat: hasGps ? Number(photo.lat) : Number(stop.lat),
        lng: hasGps ? Number(photo.lng) : Number(stop.lng),
        stopName: stop.name,
        hasGps,
      });
    });
  }
  return out;
}

/** MapLibre positions markers via transform on the root — never style transform on this node. */
function wrapMapMarker(inner, { className = "", onClick } = {}) {
  const root = document.createElement("div");
  root.className = `map-marker-root${className ? ` ${className}` : ""}`;
  root.appendChild(inner);
  if (onClick) {
    root.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
  }
  return root;
}

function firstSymbolLayerId(map) {
  const layers = map.getStyle()?.layers || [];
  for (const layer of layers) {
    if (layer.type === "symbol") return layer.id;
  }
  return undefined;
}

function safePaint(map, layerId, prop, value) {
  try {
    if (map.getLayer(layerId)) map.setPaintProperty(layerId, prop, value);
  } catch {
    /* layer may not exist in this style variant */
  }
}

function applyAppleMapPalette(map) {
  safePaint(map, "background", "background-color", APPLE.canvas);
  safePaint(map, "water", "fill-color", APPLE.water);
  safePaint(map, "water-intermittent", "fill-color", APPLE.water);
  safePaint(map, "park", "fill-color", APPLE.park);
  safePaint(map, "landcover-grass", "fill-color", APPLE.grass);
  safePaint(map, "landcover-grass-park", "fill-color", APPLE.park);
  safePaint(map, "landcover-wood", "fill-color", APPLE.parkWood);
  safePaint(map, "landuse-residential", "fill-color", APPLE.residential);
  safePaint(map, "landuse-suburb", "fill-color", APPLE.residential);
  safePaint(map, "landuse-commercial", "fill-color", APPLE.commercial);
  safePaint(map, "landuse-industrial", "fill-color", APPLE.industrial);
  safePaint(map, "landuse-cemetery", "fill-color", APPLE.cemetery);
  safePaint(map, "landuse-school", "fill-color", APPLE.school);
  safePaint(map, "landuse-hospital", "fill-color", APPLE.hospital);

  for (const id of [
    "waterway-river", "waterway-river-intermittent",
    "waterway-stream-canal", "waterway-stream-canal-intermittent",
    "waterway-other", "waterway-other-intermittent",
  ]) {
    safePaint(map, id, "line-color", APPLE.waterDeep);
  }

  for (const id of ["highway-motorway", "highway-trunk", "highway-primary"]) {
    safePaint(map, id, "line-color", "#FFFFFF");
    safePaint(map, `${id}-casing`, "line-color", "#D8D4CC");
  }
  for (const id of ["highway-secondary-tertiary", "highway-minor", "highway-link", "highway-motorway-link"]) {
    safePaint(map, id, "line-color", "#FFFFFF");
    safePaint(map, `${id}-casing`, "line-color", "#E0DCD4");
  }
}

function buildingColorExpr(colors) {
  return [
    "interpolate",
    ["linear"],
    ["coalesce", ["get", "render_height"], ["get", "height"], 12],
    0,
    colors[0],
    30,
    colors[1],
    80,
    colors[2],
    150,
    colors[3],
    250,
    colors[4],
  ];
}

function configureCity3D(map, basemapKey = "bright") {
  const isApple = migrateBasemap(basemapKey) === "apple";
  const buildingColors = isApple ? APPLE.building : DEFAULT_BUILDINGS;

  try {
    map.setProjection({ type: "globe" });
    map.setTerrain(null);
    if (isApple) {
      applyAppleMapPalette(map);
      map.setSky(APPLE.sky);
      map.setLight({
        anchor: "viewport",
        color: "#fffaf5",
        intensity: 0.48,
        position: [1.3, 205, 58],
      });
    } else {
      map.setSky(DEFAULT_SKY);
      map.setLight({
        anchor: "viewport",
        color: "#fff",
        intensity: 0.5,
        position: [1.4, 200, 60],
      });
    }
  } catch {
    /* optional */
  }

  try {
    if (map.getLayer("building")) map.setLayoutProperty("building", "visibility", "none");
    if (map.getLayer("building-top")) map.setLayoutProperty("building-top", "visibility", "none");
  } catch {
    /* style may differ */
  }

  if (!map.getSource("openmaptiles")) return;

  const extrusionPaint = {
    "fill-extrusion-color": buildingColorExpr(buildingColors),
    "fill-extrusion-height": [
      "interpolate",
      ["linear"],
      ["zoom"],
      12,
      0,
      13,
      ["*", ["coalesce", ["get", "render_height"], ["get", "height"], 10], 1.15],
      15,
      ["*", ["coalesce", ["get", "render_height"], ["get", "height"], 14], 1.25],
      17,
      ["*", ["coalesce", ["get", "render_height"], ["get", "height"], 18], 1.35],
    ],
    "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
    "fill-extrusion-opacity": 0.94,
    "fill-extrusion-vertical-gradient": true,
  };

  if (map.getLayer("building-3d")) {
    map.setPaintProperty("building-3d", "fill-extrusion-color", extrusionPaint["fill-extrusion-color"]);
  } else {
    const before = firstSymbolLayerId(map);
    map.addLayer(
      {
        id: "building-3d",
        type: "fill-extrusion",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 12,
        paint: extrusionPaint,
      },
      before
    );
  }

  const z = map.getZoom();
  map.easeTo({ pitch: pitchForZoom(z), bearing: bearingForZoom(z), duration: 0 });
}

function attachZoomPitchHandler(map, isBlocked = () => false) {
  const update = () => {
    if (isBlocked()) return;
    const z = map.getZoom();
    const targetPitch = pitchForZoom(z);
    const targetBearing = bearingForZoom(z);
    if (Math.abs(map.getPitch() - targetPitch) > 0.5 || Math.abs(map.getBearing() - targetBearing) > 0.5) {
      map.easeTo({ pitch: targetPitch, bearing: targetBearing, duration: 450 });
    }
  };
  map.on("zoomend", update);
  update();
  return () => map.off("zoomend", update);
}

function mountTripLayers(map) {
  if (!map.getSource("stop-hits")) {
    map.addSource("stop-hits", { type: "geojson", data: emptyPoints() });
    map.addLayer({
      id: "stop-hits",
      type: "circle",
      source: "stop-hits",
      paint: { "circle-radius": 24, "circle-opacity": 0 },
    });
  }

  if (!map.getSource("route")) {
    map.addSource("route", { type: "geojson", data: emptyLine() });
    const before = firstSymbolLayerId(map);
    map.addLayer(
      {
        id: "route-casing",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": ROUTE_CASING, "line-width": 9, "line-opacity": 0.95 },
      },
      before
    );
    map.addLayer(
      {
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": ROUTE_ORANGE, "line-width": 5, "line-opacity": 1 },
      },
      before
    );
    map.addLayer(
      {
        id: "route-flow",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#ff9a5c",
          "line-width": 6,
          "line-opacity": 1,
          "line-trim-offset": [0, 0.01],
        },
      },
      before
    );
  }
}

function flyToStop(map, stop) {
  if (!map || !stop) return;
  const lng = Number(stop.lng);
  const lat = Number(stop.lat);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
  const zoom = Math.max(zoomForPlace(stop.place_type), 16);
  map.stop();
  map.easeTo({
    center: [lng, lat],
    zoom,
    pitch: pitchForZoom(zoom),
    bearing: map.getBearing(),
    duration: 900,
    essential: true,
  });
}

function addMapMarker(map, element, lng, lat, anchor = "bottom") {
  const lngN = Number(lng);
  const latN = Number(lat);
  if (!Number.isFinite(lngN) || !Number.isFinite(latN)) return null;
  return new maplibregl.Marker({
    element,
    anchor,
    pitchAlignment: "map",
    rotationAlignment: "map",
    occludedOpacity: 0.55,
  })
    .setLngLat([lngN, latN])
    .addTo(map);
}

function createStopPinEl(stop, index, onPinClick) {
  const inner = document.createElement("div");
  inner.className = "route-stop-pin";
  inner.innerHTML = `
    <span class="route-stop-label">${shortName(stop.name)}</span>
    <span class="route-stop-teardrop"><span class="route-stop-num">${index + 1}</span></span>
    <span class="route-stop-shadow" aria-hidden></span>
  `;
  inner.title = stop.name;
  return wrapMapMarker(inner, {
    className: "map-marker-stop",
    onClick: () => onPinClick?.(stop),
  });
}

/** Landmarks use 3D light beams — dot + label at exact coordinate. */
function createLandmarkLabelEl(stop, onPinClick) {
  const inner = document.createElement("div");
  inner.className = "landmark-label-marker";
  inner.innerHTML = `
    <span class="landmark-label-text">${shortName(stop.name)}</span>
    <span class="landmark-ground-dot" aria-hidden></span>
  `;
  inner.title = stop.name;
  return wrapMapMarker(inner, {
    className: "map-marker-landmark",
    onClick: () => onPinClick?.(stop),
  });
}

function createDraftPinEl(name) {
  const inner = document.createElement("div");
  inner.className = "route-stop-pin draft";
  inner.innerHTML = `
    <span class="route-stop-label">${shortName(name)}</span>
    <span class="route-stop-teardrop"><span class="route-stop-num">+</span></span>
    <span class="route-stop-shadow" aria-hidden></span>
  `;
  return wrapMapMarker(inner);
}

function createPhotoMarkerEl(photo, onPinClick) {
  const inner = document.createElement("div");
  inner.className = `map-photo-pin${photo.hasGps ? " has-gps" : " at-stop"}`;
  inner.innerHTML = `
    <span class="map-photo-thumb">
      <img src="${photo.url}" alt="" loading="lazy" />
    </span>
    <span class="map-photo-shadow" aria-hidden></span>
  `;
  inner.title = photo.hasGps ? `${photo.stopName} (photo location)` : `${photo.stopName} (at stop)`;
  return wrapMapMarker(inner, {
    className: "map-marker-photo",
    onClick: onPinClick,
  });
}

export default function TripMap({
  stops = [],
  draft = null,
  focus = null,
  height = 480,
  interactive = true,
  onStopClick,
  highlightStopId = null,
  preserveView = false,
  defaultPresets = DEFAULT_MAP_PRESETS,
  children = null,
}) {
  const initial = {
    ...DEFAULT_MAP_PRESETS,
    ...defaultPresets,
    routeStyle: defaultPresets?.routeStyle ?? DEFAULT_MAP_PRESETS.routeStyle,
  };
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const zoomPitchHandlerRef = useRef(null);
  const markersRef = useRef([]);
  const photoMarkersRef = useRef([]);
  const routeGenRef = useRef(0);
  const readyRef = useRef(false);
  const introDoneRef = useRef(false);
  const rotateRef = useRef(null);
  const routeAnimRef = useRef(null);
  const tourRef = useRef(null);
  const landmarkLayerRef = useRef(null);
  const pinClickRef = useRef(null);
  const stopHitsBoundRef = useRef(false);
  const focusedStopIdRef = useRef(null);
  const dataRef = useRef({ stops, draft, focus, onStopClick, preserveView, highlightStopId });
  dataRef.current = { stops, draft, focus, onStopClick, preserveView, highlightStopId };

  pinClickRef.current = (stop) => {
    focusedStopIdRef.current = stop.id;
    dataRef.current.onStopClick?.(stop);
  };

  const [routeStyle, setRouteStyle] = useState(initial.routeStyle);
  const [autoRotate, setAutoRotate] = useState(false);
  const [touring, setTouring] = useState(false);
  const touringRef = useRef(false);

  function stopAnimations({ endTour = true } = {}) {
    if (rotateRef.current) cancelAnimationFrame(rotateRef.current);
    rotateRef.current = null;
    if (tourRef.current) clearTimeout(tourRef.current);
    tourRef.current = null;
    if (endTour) {
      touringRef.current = false;
      setTouring(false);
    }
  }

  function startRouteFlow(map) {
    if (routeAnimRef.current) cancelAnimationFrame(routeAnimRef.current);
    const t0 = performance.now();
    const tick = () => {
      if (!map.getLayer("route-flow")) return;
      const phase = ((performance.now() - t0) / 3200) % 1;
      const tail = phase;
      const head = Math.min(1, phase + ROUTE_FLOW_LEN);
      try {
        map.setPaintProperty("route-flow", "line-trim-offset", [tail, head]);
        map.triggerRepaint();
      } catch {
        /* ignore */
      }
      routeAnimRef.current = requestAnimationFrame(tick);
    };
    routeAnimRef.current = requestAnimationFrame(tick);
  }

  function stopRouteFlow() {
    if (routeAnimRef.current) cancelAnimationFrame(routeAnimRef.current);
    routeAnimRef.current = null;
  }

  function applyRouteStyle(map, key) {
    const style = ROUTE_STYLES[key] || ROUTE_STYLES.solid;
    const vis = style.showRoute ? "visible" : "none";
    try {
      map.setLayoutProperty("route-casing", "visibility", vis);
      map.setLayoutProperty("route-line", "visibility", vis);
      map.setLayoutProperty("route-flow", "visibility", style.animate ? "visible" : "none");
      map.setPaintProperty("route-line", "line-dasharray", [1, 0]);
      if (style.showRoute) {
        map.setPaintProperty("route-casing", "line-opacity", 0.95);
        map.setPaintProperty("route-line", "line-opacity", style.animate ? 0.38 : 1);
      }
    } catch {
      /* layers may not exist yet */
    }
    if (style.animate && style.showRoute) startRouteFlow(map);
    else stopRouteFlow();
  }

  function startAutoRotate(map) {
    if (rotateRef.current) cancelAnimationFrame(rotateRef.current);
    let bearing = map.getBearing();
    function step() {
      bearing = (bearing + 0.1) % 360;
      map.setBearing(bearing);
      rotateRef.current = requestAnimationFrame(step);
    }
    rotateRef.current = requestAnimationFrame(step);
  }

  function flyTarget(map, center, zoom, duration = 1400) {
    const lng = Number(center[0]);
    const lat = Number(center[1]);
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        map.off("moveend", onMoveEnd);
        clearTimeout(fallback);
        resolve();
      };
      const onMoveEnd = () => finish();
      const fallback = setTimeout(finish, duration + 500);
      map.stop();
      map.flyTo({
        center: [lng, lat],
        zoom,
        pitch: pitchForZoom(zoom),
        bearing: bearingForZoom(zoom),
        duration,
        essential: true,
        curve: 1.35,
      });
      map.once("moveend", onMoveEnd);
    });
  }

  function fitTarget(map, bounds, options) {
    return new Promise((resolve) => {
      let settled = false;
      const duration = options.duration ?? 1800;
      const finish = () => {
        if (settled) return;
        settled = true;
        map.off("moveend", onMoveEnd);
        clearTimeout(fallback);
        resolve();
      };
      const onMoveEnd = () => finish();
      const fallback = setTimeout(finish, duration + 500);
      map.stop();
      map.fitBounds(bounds, options);
      map.once("moveend", onMoveEnd);
    });
  }

  async function playRouteTour() {
    const map = mapRef.current;
    const { stops: s } = dataRef.current;
    if (!map || s.length < 1 || touringRef.current) return;

    stopAnimations({ endTour: false });
    stopRouteFlow();
    setAutoRotate(false);
    touringRef.current = true;
    setTouring(true);

    try {
      for (let i = 0; i < s.length; i++) {
        if (!touringRef.current) break;
        const stop = s[i];
        await flyTarget(
          map,
          [stop.lng, stop.lat],
          Math.max(zoomForPlace(stop.place_type), 15),
          1600
        );
        if (!touringRef.current) break;
        await new Promise((r) => {
          tourRef.current = setTimeout(r, 700);
        });
      }
      if (touringRef.current && s.length > 1) {
        const coords = s.map((x) => [Number(x.lng), Number(x.lat)]);
        const bounds = coords.reduce(
          (b, c) => b.extend(c),
          new maplibregl.LngLatBounds(coords[0], coords[0])
        );
        await fitTarget(map, bounds, {
          padding: 80,
          maxZoom: 15,
          pitch: pitchForZoom(13),
          bearing: bearingForZoom(13),
          duration: 1800,
        });
      }
    } finally {
      touringRef.current = false;
      setTouring(false);
      if (mapRef.current) applyRouteStyle(mapRef.current, routeStyle);
    }
  }

  function updateLandmarkLayers(map, s) {
    if (landmarkLayerRef.current) {
      landmarkLayerRef.current.setLandmarks(landmarksFromStops(s));
    }
  }

  function bindStopHitLayer(map) {
    if (stopHitsBoundRef.current) return;
    stopHitsBoundRef.current = true;
    map.on("click", "stop-hits", (e) => {
      const id = e.features?.[0]?.properties?.id;
      if (id == null) return;
      const stop = dataRef.current.stops.find((s) => String(s.id) === String(id));
      if (stop) pinClickRef.current?.(stop);
    });
    map.on("mouseenter", "stop-hits", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "stop-hits", () => {
      map.getCanvas().style.cursor = "";
    });
  }

  function updateStopHitLayer(map, s) {
    const src = map.getSource("stop-hits");
    if (!src) return;
    src.setData({
      type: "FeatureCollection",
      features: s.map((stop) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [Number(stop.lng), Number(stop.lat)] },
        properties: { id: stop.id },
      })),
    });
  }

  function ensureLandmark3DLayer(map) {
    if (map.getLayer("landmark-3d-models")) return;
    landmarkLayerRef.current?.onRemove?.();
    const layer = createLandmark3DLayer();
    landmarkLayerRef.current = layer;
    map.addLayer(layer);
  }

  async function updateRouteGeometry(map, s) {
    const routeSrc = map.getSource("route");
    if (!routeSrc) return;
    if (s.length < 2) {
      routeSrc.setData(emptyLine());
      return;
    }
    const gen = ++routeGenRef.current;
    const coordStr = s.map((x) => `${x.lng},${x.lat}`).join(";");
    let geometry = null;
    try {
      const data = await api.getRoute(coordStr);
      if (gen !== routeGenRef.current) return;
      geometry = data.geometry;
    } catch {
      /* fall back */
    }
    if (!geometry) {
      geometry = { type: "LineString", coordinates: s.map((x) => [x.lng, x.lat]) };
    }
    routeSrc.setData({ type: "Feature", geometry, properties: {} });
  }

  function syncPhotoMarkers(map, s) {
    photoMarkersRef.current.forEach((m) => m.remove());
    photoMarkersRef.current = [];
    for (const photo of flattenMapPhotos(s)) {
      const locLabel = photo.hasGps ? "Taken here" : "At this stop";
      const popup = new maplibregl.Popup({ offset: 14, closeButton: false, maxWidth: "240px" })
        .setHTML(`<div class="map-photo-popup"><img src="${photo.url}" alt="" /><span>${photo.stopName || ""}</span><em>${locLabel}</em></div>`);
      let marker = null;
      const el = createPhotoMarkerEl(photo, () => marker?.togglePopup());
      marker = addMapMarker(map, el, photo.lng, photo.lat, "bottom");
      if (!marker) continue;
      marker.setPopup(popup);
      photoMarkersRef.current.push(marker);
    }
  }

  function onStyleReady(map) {
    stopHitsBoundRef.current = false;
    mountTripLayers(map);
    bindStopHitLayer(map);
    ensureLandmark3DLayer(map);
    configureCity3D(map, "bright");
    if (zoomPitchHandlerRef.current) zoomPitchHandlerRef.current();
    zoomPitchHandlerRef.current = attachZoomPitchHandler(map, () => touringRef.current);
    readyRef.current = true;
    applyRouteStyle(map, routeStyle);
    sync(true);
  }

  useEffect(() => {
    const start = hasCoords(focus) ? { center: [focus.lng, focus.lat], zoom: 12 } : { center: [0, 20], zoom: MIN_ZOOM };
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: COLORFUL_STYLE,
      ...start,
      minZoom: MIN_ZOOM,
      pitch: CITY_3D.pitch,
      bearing: CITY_3D.bearing,
      maxPitch: 70,
      interactive,
      attributionControl: { compact: true },
      antialias: true,
    });
    mapRef.current = map;

    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    }

    map.on("load", () => onStyleReady(map));
    map.on("mousedown", () => {
      if (autoRotate) setAutoRotate(false);
    });

    return () => {
      touringRef.current = false;
      stopAnimations();
      if (zoomPitchHandlerRef.current) zoomPitchHandlerRef.current();
      zoomPitchHandlerRef.current = null;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      photoMarkersRef.current.forEach((m) => m.remove());
      photoMarkersRef.current = [];
      if (landmarkLayerRef.current) {
        try {
          if (map.getLayer("landmark-3d-models")) map.removeLayer("landmark-3d-models");
        } catch {
          /* ignore */
        }
        landmarkLayerRef.current.onRemove?.();
        landmarkLayerRef.current = null;
      }
      map.remove();
      readyRef.current = false;
      introDoneRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    applyRouteStyle(map, routeStyle);
  }, [routeStyle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    if (autoRotate && !touring) startAutoRotate(map);
    else if (rotateRef.current) {
      cancelAnimationFrame(rotateRef.current);
      rotateRef.current = null;
    }
  }, [autoRotate, touring]);

  useEffect(() => {
    if (readyRef.current) sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, draft, focus]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || highlightStopId == null) return;
    focusedStopIdRef.current = highlightStopId;
    const stop = stops.find((s) => String(s.id) === String(highlightStopId));
    if (stop) flyToStop(map, stop);
  }, [highlightStopId, stops]);

  async function sync(isIntro = false) {
    const map = mapRef.current;
    if (!map) return;
    const { stops: s, draft: d, focus: f, preserveView: keepView } = dataRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    s.forEach((stop, i) => {
      const landmark = resolveLandmark(stop);
      const onPin = (s) => pinClickRef.current?.(s);
      const el = landmark
        ? createLandmarkLabelEl(stop, onPin)
        : createStopPinEl(stop, i, onPin);
      const marker = addMapMarker(
        map,
        el,
        stop.lng,
        stop.lat,
        landmark ? "center" : "bottom"
      );
      if (marker) markersRef.current.push(marker);
    });

    if (d && Number.isFinite(d.lat)) {
      const draftIsSaved = s.some(
        (stop) => stop.lat === d.lat && stop.lng === d.lng && shortName(stop.name) === shortName(d.name)
      );
      if (!draftIsSaved) {
        const draftMarker = addMapMarker(map, createDraftPinEl(d.name), d.lng, d.lat);
        if (draftMarker) markersRef.current.push(draftMarker);
      }
    }

    updateStopHitLayer(map, s);
    updateLandmarkLayers(map, s);
    syncPhotoMarkers(map, s);
    await updateRouteGeometry(map, s);
    map.triggerRepaint();

    if (touringRef.current || keepView) return;

    if (d && Number.isFinite(d.lat)) {
      focusedStopIdRef.current = null;
      const z = Math.max(map.getZoom(), zoomForPlace(d.place_type));
      map.easeTo({
        center: [d.lng, d.lat],
        zoom: z,
        pitch: pitchForZoom(z),
        bearing: bearingForZoom(z),
        duration: 900,
      });
      return;
    }

    const lockedStopId = focusedStopIdRef.current ?? dataRef.current.highlightStopId;
    if (lockedStopId != null && s.some((stop) => String(stop.id) === String(lockedStopId))) {
      return;
    }

    if (!introDoneRef.current && (hasCoords(f) || s.length > 0)) {
      introDoneRef.current = true;
      const target = s.length ? [s[0].lng, s[0].lat] : [f.lng, f.lat];
      const introZoom = s.length === 1 ? zoomForPlace(s[0].place_type) : s.length > 1 ? 13 : 11;
      const introPitch = pitchForZoom(introZoom);
      map.easeTo({
        center: target,
        zoom: introZoom,
        pitch: introPitch,
        bearing: bearingForZoom(introZoom),
        duration: 1000,
      });
      return;
    }

    if (s.length === 1) {
      const z = zoomForPlace(s[0].place_type);
      map.easeTo({
        center: [s[0].lng, s[0].lat],
        zoom: z,
        pitch: pitchForZoom(z),
        bearing: bearingForZoom(z),
        duration: 900,
      });
    } else if (s.length > 1) {
      const coords = s.map((x) => [x.lng, x.lat]);
      const bounds = coords.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
      const z = 13;
      map.fitBounds(bounds, {
        padding: { top: 120, bottom: 100, left: 80, right: 80 },
        maxZoom: 15,
        pitch: pitchForZoom(z),
        bearing: bearingForZoom(z),
        duration: 900,
      });
    } else if (hasCoords(f)) {
      const z = 11;
      map.easeTo({
        center: [f.lng, f.lat],
        zoom: z,
        pitch: pitchForZoom(z),
        bearing: bearingForZoom(z),
        duration: 900,
      });
    }
  }

  return (
    <div className="trip-map-stack">
      <div className="trip-map-shell trip-map-city3d" style={{ height }}>
        <div ref={containerRef} className="trip-map" />
        {children}
      </div>
      <div className="map-config-bar map-config-animated">
        <label className="map-config-field">
          <span>Route</span>
          <select value={routeStyle} onChange={(e) => setRouteStyle(e.target.value)}>
            {Object.entries(ROUTE_STYLES).map(([k, r]) => (
              <option key={k} value={k}>{r.label}</option>
            ))}
          </select>
        </label>
        <label className="map-config-toggle">
          <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} />
          <span>Orbit view</span>
        </label>
        <button
          type="button"
          className="map-tour-btn"
          onClick={playRouteTour}
          disabled={stops.length < 1 || touring}
        >
          {touring ? "Touring…" : "Play route"}
        </button>
      </div>
    </div>
  );
}
