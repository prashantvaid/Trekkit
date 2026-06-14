import DashboardDemo from "../DashboardDemo.jsx";
import MockMapPreview from "../MockMapPreview.jsx";

export function CreateTripVisual({ stage = false }) {
  return (
    <div className={`hi-mock hi-mock-create${stage ? " is-stage" : ""}`}>
      <div className="hi-mock-field f1"><span>Trip name</span><b>Two weeks in Japan</b></div>
      <div className="hi-mock-field f2"><span>Dates</span><b>Mar 12 – Mar 26 · 14 days</b></div>
      <div className="hi-mock-field f3"><span>Visibility</span><b>Friends can view</b></div>
      <div className="hi-mock-days f4">
        <span className="hi-day d0">Day 1</span>
        <span className="hi-day d1">Day 2</span>
        <span className="hi-day d2">Day 3</span>
      </div>
      <div className="hi-mock-btn f5">Create trip</div>
    </div>
  );
}

export function PinStopVisual({ stage = false }) {
  return (
    <div className={`hi-mock hi-mock-demo${stage ? " is-stage" : ""}`}>
      <DashboardDemo />
    </div>
  );
}

export function ShareTripVisual({ stage = false }) {
  return (
    <div className={`hi-mock hi-mock-share feed-mock${stage ? " is-stage" : ""}`}>
      <div className="mock-card-head">
        <span className="mock-ava" />
        <div className="mock-card-meta">
          <strong>You</strong>
          <span>shared · Two weeks in Japan</span>
        </div>
      </div>
      <p className="hi-share-caption">Best ramen crawl yet 🍜</p>
      <MockMapPreview variant="route" height={stage ? 140 : 100} className="hi-visual-map" />
      <div className="mock-card-foot">
        <span className="mock-kudos">♥ <em>12 kudos</em></span>
        <span className="hi-share-comments muted small">4 comments</span>
      </div>
      {stage && <div className="hi-share-toast">+1 kudo from Alex</div>}
    </div>
  );
}
