// A static mock of the trip-planning board, used as the landing-page visual.
const COLUMNS = [
  { day: "Day 1", place: "Tokyo", items: [["09:00", "Tsukiji breakfast"], ["13:00", "Senso-ji temple"], ["19:00", "Shinjuku lights"]] },
  { day: "Day 2", place: "Hakone", items: [["10:00", "Mt. Fuji viewpoint"], ["15:00", "Open-air museum"]] },
  { day: "Day 3", place: "Kyoto", items: [["08:30", "Fushimi Inari"], ["12:00", "Arashiyama"], ["18:00", "Gion stroll"]] },
];

export default function PlannerPreview() {
  return (
    <div className="planner-preview">
      <div className="pp-head">
        <span className="pp-title">Two weeks in Japan</span>
        <span className="pp-pill">🗓️ 3-day draft</span>
      </div>
      <div className="pp-board">
        {COLUMNS.map((col) => (
          <div key={col.day} className="pp-col">
            <div className="pp-col-head">
              <span className="pp-day">{col.day}</span>
              <span className="pp-place">📍 {col.place}</span>
            </div>
            {col.items.map(([time, title]) => (
              <div key={title} className="pp-item">
                <span className="pp-time">{time}</span>
                <span className="pp-item-title">{title}</span>
              </div>
            ))}
            <div className="pp-add">+ Add activity</div>
          </div>
        ))}
      </div>
    </div>
  );
}
