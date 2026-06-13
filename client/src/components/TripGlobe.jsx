import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";

export default function TripGlobe({ stops = [], height = 460, onStopClick, autoRotate = true }) {
  const globeEl = useRef();
  const wrapRef = useRef();
  const [width, setWidth] = useState(800);

  useEffect(() => {
    function measure() {
      if (wrapRef.current) setWidth(wrapRef.current.clientWidth);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const points = useMemo(
    () =>
      stops.map((s, i) => ({
        ...s,
        order: i + 1,
        size: 0.65,
        color: "#ff5a1f",
        label: s.name.split(",")[0],
      })),
    [stops]
  );

  const arcs = useMemo(() => {
    const out = [];
    for (let i = 0; i < stops.length - 1; i++) {
      out.push({
        startLat: stops[i].lat,
        startLng: stops[i].lng,
        endLat: stops[i + 1].lat,
        endLng: stops[i + 1].lng,
      });
    }
    return out;
  }, [stops]);

  const rings = useMemo(
    () =>
      stops.map((s, i) => ({
        lat: s.lat,
        lng: s.lng,
        maxR: 3 + i * 0.15,
        propagationSpeed: 1.5 + (i % 3) * 0.3,
        repeatPeriod: 1200 + i * 80,
      })),
    [stops]
  );

  useEffect(() => {
    if (!globeEl.current) return;
    const controls = globeEl.current.controls();
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.85;
    controls.enableZoom = false;

    if (stops.length) {
      const lat = stops.reduce((a, s) => a + s.lat, 0) / stops.length;
      const lng = stops.reduce((a, s) => a + s.lng, 0) / stops.length;
      globeEl.current.pointOfView({ lat, lng, altitude: stops.length > 1 ? 1.9 : 1.4 }, 1400);
    }
  }, [stops, autoRotate]);

  return (
    <div ref={wrapRef} className="globe-wrap globe-animated" style={{ height }}>
      <Globe
        ref={globeEl}
        width={width}
        height={height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        atmosphereColor="#ff8a3c"
        atmosphereAltitude={0.22}
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.04}
        pointRadius="size"
        pointLabel={(d) => `<div class="globe-tip"><b>${d.order}. ${d.label}</b></div>`}
        onPointClick={(d) => onStopClick && onStopClick(d)}
        arcsData={arcs}
        arcColor={() => ["rgba(255,120,60,0.15)", "rgba(255,210,100,1)"]}
        arcDashLength={0.45}
        arcDashGap={0.15}
        arcDashAnimateTime={1800}
        arcStroke={0.7}
        ringsData={rings}
        ringColor={(t) => `rgba(255, 90, 31, ${1 - t})`}
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        labelsData={points}
        labelLat="lat"
        labelLng="lng"
        labelText="label"
        labelSize={1.1}
        labelColor={() => "rgba(255,255,255,0.95)"}
        labelDotRadius={0.4}
        labelAltitude={0.05}
        labelResolution={2}
      />
    </div>
  );
}
