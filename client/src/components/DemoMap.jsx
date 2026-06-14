import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { DEMO_MAP_STYLE, JAPAN_DEMO_STOPS as CITIES } from "./demoMapStyle.js";

// A real 3D *terrain* map (satellite imagery draped over elevation data) that
// flies across Japan's mountains — Tokyo → Hakone (Mt. Fuji) → Kyoto — dropping
// a pin at each, looping in sync with the cursor demo. Uses keyless tile
// sources (Esri imagery + free terrain DEM), so no API token is required.

const EXAGGERATION = 1.8;

export default function DemoMap({ playing }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const timersRef = useRef([]);
  const loopRef = useRef(null);
  const readyRef = useRef(false);

  const FLY_STOPS = [
    { ...CITIES[0], zoom: 11.2, pitch: 66, bearing: 22 },
    { ...CITIES[1], zoom: 12.0, pitch: 76, bearing: -22 },
    { ...CITIES[2], zoom: 11.6, pitch: 70, bearing: 16 },
  ];

  // Create the map once.
  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEMO_MAP_STYLE,
      center: [138, 35.7],
      zoom: 6,
      pitch: 55,
      bearing: 0,
      maxPitch: 80,
      interactive: false,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.on("load", () => {
      try {
        map.setTerrain({ source: "dem", exaggeration: EXAGGERATION });
      } catch {
        /* terrain optional — falls back to flat imagery */
      }
      // soft sky + haze so the bird's-eye view has depth
      try {
        map.setSky({
          "sky-color": "#bfe0ff",
          "sky-horizon-blend": 0.6,
          "horizon-color": "#ffe6cc",
          "horizon-fog-blend": 0.6,
          "fog-color": "#fff3e8",
          "fog-ground-blend": 0.7,
        });
      } catch {
        /* sky not supported in this build — fine to skip */
      }
      readyRef.current = true;
      // gentle intro framing of Japan, a touch closer
      map.easeTo({ center: [138.2, 35.9], zoom: 7, pitch: 60, duration: 1700 });
    });

    return () => {
      clearInterval(loopRef.current);
      timersRef.current.forEach(clearTimeout);
      markersRef.current.forEach((m) => m.remove());
      map.remove();
    };
  }, []);

  function clearMarkers() {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  }

  function dropMarker(city) {
    const el = document.createElement("div");
    el.className = "map-pin";
    el.textContent = "📍";
    const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([city.lng, city.lat])
      .addTo(mapRef.current);
    markersRef.current.push(marker);
  }

  // Run / pause the fly-through with the viewport.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function start() {
      clearInterval(loopRef.current);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      const runOnce = () => {
        clearMarkers();
        const flyToCity = (c) =>
          map.flyTo({
            center: [c.lng, c.lat],
            zoom: c.zoom,
            pitch: c.pitch,
            bearing: c.bearing,
            duration: 2200,
            essential: true,
          });
        flyToCity(FLY_STOPS[0]);
        dropMarker(FLY_STOPS[0]);
        timersRef.current.push(
          setTimeout(() => {
            flyToCity(FLY_STOPS[1]);
            dropMarker(FLY_STOPS[1]);
          }, 2700)
        );
        timersRef.current.push(
          setTimeout(() => {
            flyToCity(FLY_STOPS[2]);
            dropMarker(FLY_STOPS[2]);
          }, 5300)
        );
      };

      runOnce();
      loopRef.current = setInterval(runOnce, 8000);
    }

    function stop() {
      clearInterval(loopRef.current);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    }

    if (playing) {
      if (readyRef.current) start();
      else map.once("load", start);
    } else {
      stop();
    }

    return stop;
  }, [playing]);

  return <div ref={containerRef} className="demo-map-canvas" />;
}
