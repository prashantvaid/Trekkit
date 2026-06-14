import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const STYLE = "https://tiles.openfreemap.org/styles/bright";

export default function PlannerPinsMap({
  center,
  results = [],
  selectedId,
  onPinClick,
  height = 260,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const readyRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: center ? [center.lng, center.lat] : [0, 20],
      zoom: center ? 12 : 2,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      readyRef.current = true;
      syncMarkers(map);
    });

    return () => {
      readyRef.current = false;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function syncMarkers(map) {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    const bounds = new maplibregl.LngLatBounds();
    let count = 0;

    for (const r of results) {
      if (!Number.isFinite(r.lat) || !Number.isFinite(r.lng)) continue;
      count += 1;
      bounds.extend([r.lng, r.lat]);

      const el = document.createElement("button");
      el.type = "button";
      el.className = `planner-map-pin${r.id === selectedId ? " is-selected" : ""}`;
      if (r.price != null) {
        el.innerHTML = `<span class="planner-map-pin-price">${r.currency || "USD"} ${Math.round(r.price)}</span>`;
      } else if (r.rating != null) {
        el.innerHTML = `<span class="planner-map-pin-rating">★ ${Number(r.rating).toFixed(1)}</span>`;
      } else {
        el.innerHTML = `<span class="planner-map-pin-dot">●</span>`;
      }
      el.title = r.title || "";
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onPinClick?.(r);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([r.lng, r.lat])
        .addTo(map);
      markersRef.current.set(r.id || r.title, marker);
    }

    if (count > 1) {
      map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 700 });
    } else if (count === 1 && center) {
      map.flyTo({ center: [center.lng, center.lat], zoom: 13, duration: 700 });
    } else if (center) {
      map.flyTo({ center: [center.lng, center.lat], zoom: 12, duration: 700 });
    }
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    syncMarkers(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, selectedId, center?.lat, center?.lng]);

  return (
    <div className="planner-pins-map-wrap">
      <div ref={containerRef} className="planner-pins-map" style={{ height }} />
    </div>
  );
}
