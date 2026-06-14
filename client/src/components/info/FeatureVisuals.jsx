import MockMapPreview from "../MockMapPreview.jsx";

export function GlobeVisual({ stage = false }) {
  return (
    <div className={`ft-visual ft-globe${stage ? " is-stage" : ""}`}>
      <div className="ft-globe-ring" aria-hidden />
      <div className="ft-globe-ring ft-globe-ring-2" aria-hidden />
      <MockMapPreview variant="route" height={stage ? 200 : 140} className="ft-visual-map" />
    </div>
  );
}

export function PhotosVisual({ stage = false }) {
  return (
    <div className={`ft-visual ft-photos${stage ? " is-stage" : ""}`}>
      <div className="ft-photo-stop">
        <span>📍 Kyoto · Day 3</span>
      </div>
      <div className="ft-photo-grid">
        {["⛩️", "🌸", "🍜", "🏯"].map((e, i) => (
          <span key={e} className={`ft-photo p${i}`}>{e}</span>
        ))}
      </div>
      {stage && (
        <div className="ft-photo-upload">
          <span className="ft-upload-pulse">+</span>
          <span>Add photo to this stop</span>
        </div>
      )}
    </div>
  );
}

export function PlannerVisual({ stage = false }) {
  return (
    <div className={`ft-visual ft-planner${stage ? " is-stage" : ""}`}>
      <div className="ft-planner-search">
        <span>🔍</span>
        <span className="ft-planner-typed">Hotels in Kyoto</span>
      </div>
      <div className="ft-plan-rows">
        {[
          { day: "Day 1", item: "Park Hyatt Tokyo", price: "$312/night" },
          { day: "Day 2", item: "Hakone ryokan", price: "$189/night" },
          { day: "Day 3", item: "Kyoto machiya", price: "$145/night" },
        ].map((row, i) => (
          <div key={row.day} className={`ft-plan-row r${i}`}>
            <div>
              <strong>{row.day}</strong>
              <span>{row.item}</span>
            </div>
            <em>{row.price}</em>
          </div>
        ))}
      </div>
      {stage && <div className="ft-planner-add">+ Add to Day 3 itinerary</div>}
    </div>
  );
}

export function SocialVisual({ stage = false }) {
  return (
    <div className={`ft-visual ft-social${stage ? " is-stage" : ""}`}>
      <div className="ft-feed-cards">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`ft-feed-card c${i}`}>
            <span className="ft-feed-ava" />
            <div className="ft-feed-lines">
              <span className="ft-feed-bar" />
              <span className="ft-feed-map" />
            </div>
            <span className="ft-feed-kudos">♥</span>
          </div>
        ))}
      </div>
      <MockMapPreview variant="route" height={stage ? 120 : 72} className="ft-visual-map" />
    </div>
  );
}
