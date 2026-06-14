// Small looping mock-UI animations shown inside each tour step. Each one mimics
// the real Trekkit interaction the step describes.

import MockMapPreview from "./MockMapPreview.jsx";

function PinMock() {
  return (
    <div className="mock pin-mock">
      <div className="mock-search">
        <span className="mock-search-icon">🔍</span>
        <span className="mock-typed">Kyoto, Japan</span>
        <span className="mock-caret" />
      </div>
      <div className="mock-result">📍 Kyoto, Kyoto Prefecture, Japan</div>
      <MockMapPreview variant="pin" height={136} />
    </div>
  );
}

function PhotoMock() {
  return (
    <div className="mock photo-mock">
      <div className="mock-stop"><span>📍</span> Kyoto · Day 3</div>
      <div className="mock-photos">
        <span className="mock-photo p0">⛩️</span>
        <span className="mock-photo p1">🌸</span>
        <span className="mock-photo p2">🍵</span>
        <span className="mock-photo p3">🏯</span>
        <span className="mock-photo p4">🦊</span>
        <span className="mock-photo p5">🌷</span>
      </div>
      <div className="mock-upload">+ Upload photo</div>
    </div>
  );
}

function FeedMock() {
  return (
    <div className="mock feed-mock">
      <div className="mock-card">
        <div className="mock-card-head">
          <span className="mock-ava" />
          <div className="mock-card-meta">
            <strong>You</strong>
            <span>shared “Two weeks in Japan”</span>
          </div>
        </div>
        <MockMapPreview variant="route" height={108} className="mock-card-map-live" />
        <div className="mock-card-foot">
          <span className="mock-kudos"><em>Like</em></span>
          <span className="mock-plus">+1</span>
        </div>
      </div>
    </div>
  );
}

export default function StepMock({ index }) {
  if (index === 0) return <PinMock />;
  if (index === 1) return <PhotoMock />;
  return <FeedMock />;
}
