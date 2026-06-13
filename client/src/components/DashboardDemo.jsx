import { useEffect, useRef, useState } from "react";
import DemoMap from "./DemoMap.jsx";

// A fake Trekkit app window that "plays" itself: an animated cursor tours the
// UI, clicks the search and the add button, and pins drop onto the map. The
// whole sequence is paused until the component scrolls into view.
export default function DashboardDemo() {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPlaying(entry.isIntersecting),
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`demo-window ${playing ? "playing" : ""}`}>
      <div className="demo-chrome">
        <span className="dot r" />
        <span className="dot y" />
        <span className="dot g" />
        <div className="demo-url">trekkit.app/trips/new</div>
      </div>

      <div className="demo-body">
        <div className="demo-panel">
          <div className="demo-panel-title">Pin a stop</div>

          <div className="demo-search">
            <span className="demo-search-icon">🔍</span>
            <span className="demo-typed">Kyoto, Japan</span>
            <span className="demo-caret" />
          </div>

          <div className="demo-result">📍 Kyoto, Kyoto Prefecture, Japan</div>

          <div className="demo-field">
            <span>Day</span>
            <b>3</b>
          </div>
          <div className="demo-add">Add stop to trip</div>

          <div className="demo-stops">
            <div className="demo-stop s1"><span>1</span> Tokyo</div>
            <div className="demo-stop s2"><span>2</span> Hakone</div>
            <div className="demo-stop s3"><span>3</span> Kyoto</div>
          </div>
        </div>

        <div className="demo-map">
          <DemoMap playing={playing} />
          <div className="demo-photo">📷</div>
        </div>

        <div className="demo-cursor">
          <svg viewBox="0 0 24 24" width="26" height="26">
            <path
              d="M4 2l6 16 2.5-6.5L19 9 4 2z"
              fill="#1c140e"
              stroke="#fff"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          <span className="demo-click" />
        </div>
      </div>
    </div>
  );
}
