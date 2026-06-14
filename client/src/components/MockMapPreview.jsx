import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { DEMO_MAP_STYLE, JAPAN_DEMO_STOPS } from "./demoMapStyle.js";

const KYOTO = JAPAN_DEMO_STOPS[2];
const LOOP_MS = 4600;

function addTerrainAndSky(map) {
  try {
    map.setTerrain({ source: "dem", exaggeration: 1.6 });
  } catch {
    /* optional */
  }
  try {
    map.setSky({
      "sky-color": "#bfe0ff",
      "sky-horizon-blend": 0.5,
      "horizon-color": "#ffe6cc",
      "horizon-fog-blend": 0.5,
      "fog-color": "#fff3e8",
      "fog-ground-blend": 0.65,
    });
  } catch {
    /* optional */
  }
}

function dropMarker(map, markers, city) {
  const el = document.createElement("div");
  el.className = "map-pin";
  el.textContent = "📍";
  const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
    .setLngLat([city.lng, city.lat])
    .addTo(map);
  markers.push(marker);
  return marker;
}

function clearMarkers(markers) {
  markers.forEach((m) => m.remove());
  markers.length = 0;
}

function addRouteLayer(map) {
  if (map.getSource("route")) return;
  map.addSource("route", {
    type: "geojson",
    data: {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: JAPAN_DEMO_STOPS.map((s) => [s.lng, s.lat]),
      },
    },
  });
  map.addLayer({
    id: "route-line",
    type: "line",
    source: "route",
    paint: {
      "line-color": "#ff6a2c",
      "line-width": 2.5,
      "line-opacity": 0.9,
      "line-dasharray": [2, 1.5],
    },
  });
}

/** Small satellite map for landing-page step mocks. */
export default function MockMapPreview({ variant = "pin", height = 128, className = "" }) {
  const wrapRef = useRef(null);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const timersRef = useRef([]);
  const loopRef = useRef(null);
  const readyRef = useRef(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEMO_MAP_STYLE,
      center: [138, 35.8],
      zoom: 6.2,
      pitch: 48,
      bearing: 0,
      maxPitch: 75,
      interactive: false,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.on("load", () => {
      addTerrainAndSky(map);
      readyRef.current = true;
    });

    return () => {
      clearInterval(loopRef.current);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      clearMarkers(markersRef.current);
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, [active]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !active) return;

    function startPinLoop() {
      const run = () => {
        clearMarkers(markersRef.current);
        map.easeTo({
          center: [138.4, 36.2],
          zoom: 6.4,
          pitch: 42,
          bearing: 0,
          duration: 600,
        });
        timersRef.current.push(
          setTimeout(() => {
            map.flyTo({
              center: [KYOTO.lng, KYOTO.lat],
              zoom: 11,
              pitch: 58,
              bearing: 18,
              duration: 1400,
              essential: true,
            });
            dropMarker(map, markersRef.current, KYOTO);
          }, 700)
        );
      };

      run();
      loopRef.current = setInterval(run, LOOP_MS);
    }

    function startRouteView() {
      clearMarkers(markersRef.current);
      JAPAN_DEMO_STOPS.forEach((city) => dropMarker(map, markersRef.current, city));
      addRouteLayer(map);

      const bounds = new maplibregl.LngLatBounds();
      JAPAN_DEMO_STOPS.forEach((s) => bounds.extend([s.lng, s.lat]));
      map.fitBounds(bounds, { padding: 28, pitch: 52, bearing: -8, duration: 1200, maxZoom: 7.2 });

      loopRef.current = setInterval(() => {
        map.easeTo({
          bearing: map.getBearing() + 12,
          duration: 2200,
        });
      }, 2400);
    }

    function start() {
      clearInterval(loopRef.current);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      if (variant === "route") startRouteView();
      else startPinLoop();
    }

    function stop() {
      clearInterval(loopRef.current);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    }

    if (readyRef.current) start();
    else map.once("load", start);

    return stop;
  }, [active, variant]);

  return (
    <div
      ref={wrapRef}
      className={`mock-map-preview${className ? ` ${className}` : ""}`}
      style={{ height }}
    >
      <div ref={containerRef} className="mock-map-canvas" />
    </div>
  );
}
