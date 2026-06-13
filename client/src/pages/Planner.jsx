import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { takePlannerImport } from "../plannerImport.js";

const IDEAS = [
  { name: "Fushimi Inari Shrine", tag: "Culture", emoji: "⛩️" },
  { name: "Arashiyama Bamboo Grove", tag: "Nature", emoji: "🎋" },
  { name: "Nishiki Market", tag: "Food", emoji: "🍢" },
  { name: "Mt. Fuji viewpoint", tag: "Nature", emoji: "🗻" },
  { name: "TeamLab Planets", tag: "Art", emoji: "🎨" },
  { name: "Dotonbori", tag: "Nightlife", emoji: "🌃" },
];

const INITIAL_DAYS = [
  { id: 1, label: "Day 1", place: "Tokyo", items: [{ id: 1, time: "09:00", title: "Tsukiji Outer Market" }, { id: 2, time: "14:00", title: "Senso-ji Temple" }] },
  { id: 2, label: "Day 2", place: "Hakone", items: [{ id: 3, time: "10:00", title: "Mt. Fuji viewpoint" }] },
];

const INITIAL_PACKING = [
  { id: 1, label: "Passport & visa", done: true },
  { id: 2, label: "JR Rail Pass", done: false },
  { id: 3, label: "Power adapter (Type A)", done: false },
  { id: 4, label: "Comfortable walking shoes", done: false },
];

const AI_SUGGESTIONS = [
  "Plan a 5-day Kyoto itinerary for a foodie",
  "Find hidden gems near Mt. Fuji",
  "Balance my budget across 2 weeks",
  "What should I pack for spring in Japan?",
];

let uid = 100;

export default function Planner() {
  const [days, setDays] = useState(INITIAL_DAYS);
  const [activeDay, setActiveDay] = useState(1);
  const [tripName, setTripName] = useState("Two weeks in Japan");
  const [imported, setImported] = useState(null);
  const [draft, setDraft] = useState({ time: "", title: "" });
  const [packing, setPacking] = useState(INITIAL_PACKING);
  const [packDraft, setPackDraft] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiNote, setAiNote] = useState(false);

  useEffect(() => {
    const plan = takePlannerImport();
    if (plan?.days?.length) {
      setDays(plan.days);
      setActiveDay(plan.days[0].id);
      setTripName(plan.name);
      setImported(plan.source);
    }
  }, []);

  function askSherpa(e) {
    e?.preventDefault();
    setAiNote(true);
  }

  const current = days.find((d) => d.id === activeDay) || days[0];
  const activityCount = days.reduce((n, d) => n + d.items.length, 0);

  function addDay() {
    const id = ++uid;
    const next = { id, label: `Day ${days.length + 1}`, place: "New stop", items: [] };
    setDays((d) => [...d, next]);
    setActiveDay(id);
  }

  function addItem(title, time = "") {
    if (!title.trim()) return;
    setDays((ds) =>
      ds.map((d) =>
        d.id === current.id
          ? { ...d, items: [...d.items, { id: ++uid, time: time || "—", title }] }
          : d
      )
    );
    setDraft({ time: "", title: "" });
  }

  function removeItem(itemId) {
    setDays((ds) => ds.map((d) => (d.id === current.id ? { ...d, items: d.items.filter((i) => i.id !== itemId) } : d)));
  }

  function togglePack(id) {
    setPacking((p) => p.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  }

  function addPack() {
    if (!packDraft.trim()) return;
    setPacking((p) => [...p, { id: ++uid, label: packDraft, done: false }]);
    setPackDraft("");
  }

  const packedCount = packing.filter((p) => p.done).length;

  return (
    <div className="page planner-page">
      <div className="planner-container">
        <header className="planner-head">
          <div className="planner-head-copy">
            <span className="planner-badge">Trip planner</span>
            <h1>Plan your next adventure</h1>
            <p className="muted small">Sketch day-by-day, then turn it into a tracked trip on the map.</p>
          </div>
          <div className="planner-head-stats">
            <div className="planner-stat">
              <strong>{days.length}</strong>
              <span>days</span>
            </div>
            <div className="planner-stat">
              <strong>{activityCount}</strong>
              <span>activities</span>
            </div>
            <div className="planner-stat">
              <strong>{packedCount}/{packing.length}</strong>
              <span>packed</span>
            </div>
            <Link to="/trips/new" className="btn-primary planner-track-link">Track a trip →</Link>
          </div>
        </header>

        <div className="planner-alerts">
          <div className="preview-banner planner-alert">
            🚧 <strong>Preview mode</strong> — changes aren&apos;t saved yet.
          </div>
          {imported && (
            <div className="import-banner planner-alert">
              🧳 From <strong>{imported.title}</strong> by {imported.author}
            </div>
          )}
        </div>

        <div className="planner-grid">
          <div className="planner-main card">
            <div className="planner-toolbar">
              <input
                className="planner-trip-name"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                aria-label="Trip name"
              />
              <button type="button" className="btn-secondary" onClick={addDay}>+ Add day</button>
            </div>

            <div className="day-tabs">
              {days.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`day-tab ${d.id === current.id ? "active" : ""}`}
                  onClick={() => setActiveDay(d.id)}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="day-place" key={`place-${current.id}`}>📍 {current.place}</div>

            <ul className="plan-items" key={current.id}>
              {current.items.map((i, idx) => (
                <li key={i.id} className="plan-item" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <span className="plan-time">{i.time}</span>
                  <span className="plan-item-title">{i.title}</span>
                  <button type="button" className="link-btn danger small" onClick={() => removeItem(i.id)}>Remove</button>
                </li>
              ))}
              {current.items.length === 0 && (
                <li className="plan-empty muted small">No activities yet — add one below or pick from Ideas.</li>
              )}
            </ul>

            <form
              className="plan-add"
              onSubmit={(e) => { e.preventDefault(); addItem(draft.title, draft.time); }}
            >
              <input
                className="plan-time-input"
                type="time"
                value={draft.time}
                onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
              />
              <input
                placeholder="Add an activity…"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              />
              <button type="submit" className="btn-primary plan-add-btn">Add</button>
            </form>
          </div>

          <aside className="planner-aside">
            <div className="card ai-card planner-panel">
              <div className="ai-head">
                <span className="ai-avatar">🧭</span>
                <div>
                  <h3>Sherpa <span className="ai-badge">Coming soon</span></h3>
                  <p className="muted small">Your AI travel guide</p>
                </div>
              </div>
              <p className="muted small ai-intro">
                Draft itineraries, balance budgets, and find hidden gems from one prompt.
              </p>
              <div className="ai-suggest">
                {AI_SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="ai-chip" onClick={() => { setAiPrompt(s); setAiNote(false); }}>
                    {s}
                  </button>
                ))}
              </div>
              <form className="ai-input-row" onSubmit={askSherpa}>
                <input
                  placeholder="Ask Sherpa to plan your trip…"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
                <button className="btn-primary ai-send" type="submit" disabled={!aiPrompt.trim()}>↑</button>
              </form>
              {aiNote && (
                <p className="ai-note">✨ Sherpa is still gearing up — AI planning lands soon!</p>
              )}
            </div>

            <div className="card planner-panel">
              <h3>💡 Ideas</h3>
              <p className="muted small">Tap to add to <b>{current.label}</b>.</p>
              <div className="idea-list">
                {IDEAS.map((idea, idx) => (
                  <button
                    key={idea.name}
                    type="button"
                    className="idea"
                    style={{ animationDelay: `${idx * 0.04}s` }}
                    onClick={() => addItem(idea.name)}
                  >
                    <span className="idea-emoji">{idea.emoji}</span>
                    <span className="idea-main">
                      <span className="idea-name">{idea.name}</span>
                      <span className="tag">{idea.tag}</span>
                    </span>
                    <span className="idea-plus">+</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="planner-aside-row">
              <div className="card planner-panel planner-panel-half">
                <h3>💰 Budget</h3>
                <div className="budget-row"><span>Flights</span><b>$980</b></div>
                <div className="budget-row"><span>Stays</span><b>$1,430</b></div>
                <div className="budget-row"><span>Transit</span><b>$320</b></div>
                <div className="budget-row total"><span>Total</span><b>$2,730</b></div>
              </div>

              <div className="card planner-panel planner-panel-half">
                <h3>🎒 Packing</h3>
                <ul className="pack-list">
                  {packing.map((p) => (
                    <li key={p.id}>
                      <label className="pack-item">
                        <input type="checkbox" checked={p.done} onChange={() => togglePack(p.id)} />
                        <span className={p.done ? "done" : ""}>{p.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                <form className="pack-add" onSubmit={(e) => { e.preventDefault(); addPack(); }}>
                  <input placeholder="Add item…" value={packDraft} onChange={(e) => setPackDraft(e.target.value)} />
                  <button type="submit" className="link-btn small">Add</button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
