// A fanned stack of travel "postcards" that gently floats and spreads on hover —
// a lighter, non-globe visual for the showcase section.
const CARDS = [
  { city: "Kyoto", country: "Japan", emoji: "⛩️", meta: "6 stops · 24 photos", grad: "linear-gradient(135deg,#ff8a3c,#ff5a1f)" },
  { city: "Santorini", country: "Greece", emoji: "🏖️", meta: "4 stops · 31 photos", grad: "linear-gradient(135deg,#ffb25e,#ff7a3c)" },
  { city: "Reykjavik", country: "Iceland", emoji: "🏔️", meta: "5 stops · 18 photos", grad: "linear-gradient(135deg,#ffd27a,#ffa14c)" },
];

export default function PostcardStack() {
  return (
    <div className="postcards">
      {CARDS.map((c, i) => (
        <div key={c.city} className={`postcard pc-${i}`}>
          <div className="postcard-photo" style={{ background: c.grad }}>
            <span className="postcard-emoji">{c.emoji}</span>
            <span className="postcard-stamp">✈ TREKKIT</span>
          </div>
          <div className="postcard-body">
            <div className="postcard-city">{c.city}</div>
            <div className="postcard-country muted">{c.country}</div>
            <div className="postcard-meta">📍 {c.meta}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
