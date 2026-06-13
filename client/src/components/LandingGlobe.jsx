import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";

const CITIES = [
  { name: "New York", lat: 40.71, lng: -74.0 },
  { name: "Reykjavik", lat: 64.15, lng: -21.94 },
  { name: "Marrakech", lat: 31.63, lng: -7.99 },
  { name: "Cape Town", lat: -33.92, lng: 18.42 },
  { name: "Kyoto", lat: 35.01, lng: 135.77 },
  { name: "Sydney", lat: -33.87, lng: 151.21 },
  { name: "Rio", lat: -22.91, lng: -43.17 },
  { name: "Bali", lat: -8.34, lng: 115.09 },
  { name: "Paris", lat: 48.86, lng: 2.35 },
];

// A decorative, always-rotating globe with animated arcs and pulsing rings —
// the centerpiece of the landing hero.
export default function LandingGlobe({ size = 460 }) {
  const globeEl = useRef();
  const wrapRef = useRef();
  const [dim, setDim] = useState(size);

  useEffect(() => {
    function measure() {
      if (!wrapRef.current) return;
      const w = wrapRef.current.clientWidth;
      setDim(Math.min(w, size));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [size]);

  const arcs = useMemo(() => {
    const out = [];
    for (let i = 0; i < CITIES.length; i++) {
      const a = CITIES[i];
      const b = CITIES[(i + 3) % CITIES.length];
      out.push({ startLat: a.lat, startLng: a.lng, endLat: b.lat, endLng: b.lng });
    }
    return out;
  }, []);

  useEffect(() => {
    if (!globeEl.current) return;
    const controls = globeEl.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.enableZoom = false;
    globeEl.current.pointOfView({ lat: 18, lng: 0, altitude: 2.4 });
  }, []);

  return (
    <div ref={wrapRef} className="landing-globe">
      <Globe
        ref={globeEl}
        width={dim}
        height={dim}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        showAtmosphere
        atmosphereColor="#ff8a4c"
        atmosphereAltitude={0.22}
        arcsData={arcs}
        arcColor={() => ["rgba(255,255,255,0.15)", "#ff6a2c"]}
        arcDashLength={0.45}
        arcDashGap={0.25}
        arcDashAnimateTime={2200}
        arcStroke={0.6}
        arcAltitudeAutoScale={0.5}
        ringsData={CITIES}
        ringLat="lat"
        ringLng="lng"
        ringColor={() => (t) => `rgba(255,106,44,${1 - t})`}
        ringMaxRadius={4}
        ringPropagationSpeed={2.5}
        ringRepeatPeriod={1100}
        pointsData={CITIES}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => "#ff5a1f"}
        pointAltitude={0.01}
        pointRadius={0.35}
      />
    </div>
  );
}
