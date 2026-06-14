import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const MENUS = {
  features: {
    label: "Features",
    blurb: "Map-first tools for logging, planning, and sharing trips.",
    items: [
      {
        icon: "🌍",
        title: "3D trip map",
        text: "Pins and arcs on a spinning globe with satellite terrain.",
        tag: "WebGL map",
        to: "/features/3d-map",
      },
      {
        icon: "📸",
        title: "Photo pins",
        text: "Attach galleries to the exact stop where you took them.",
        tag: "Per-stop photos",
        to: "/features/photos",
      },
      {
        icon: "🧭",
        title: "Itinerary builder",
        text: "Search hotels and places worldwide before you depart.",
        tag: "Hotels & planner",
        to: "/features/planner",
      },
      {
        icon: "👋",
        title: "Friends & feed",
        text: "Follow travelers, scroll mapped posts, leave kudos.",
        tag: "Social discovery",
        to: "/features/feed",
      },
    ],
    footer: { label: "Explore all features", to: "/features" },
  },
};

function Dropdown({ menu }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);

  function show() {
    clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function hide() {
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }

  return (
    <div
      className={`nav-dd ${open ? "open" : ""}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <button className="nav-dd-trigger" aria-expanded={open}>
        <span className="nav-underline">{menu.label}</span>
        <span className="nav-caret" aria-hidden>▾</span>
      </button>
      <div className="nav-dd-panel" role="menu">
        <p className="nav-dd-blurb">{menu.blurb}</p>
        {menu.items.map((it, i) => (
          <Link
            key={it.title}
            to={it.to}
            className="nav-dd-item"
            role="menuitem"
            style={{ "--dd-i": i }}
          >
            {it.step ? (
              <span className="nav-dd-step">{it.step}</span>
            ) : (
              <span className="nav-dd-icon">{it.icon}</span>
            )}
            <span className="nav-dd-copy">
              <strong>{it.title}</strong>
              <span className="muted small">{it.text}</span>
              {it.tag && <span className="nav-dd-tag">{it.tag}</span>}
            </span>
            <span className="nav-dd-arrow" aria-hidden>→</span>
          </Link>
        ))}
        <Link to={menu.footer.to} className="nav-dd-all">{menu.footer.label} →</Link>
      </div>
    </div>
  );
}

export default function LandingNav() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`landing-nav ${scrolled ? "scrolled" : ""}`}>
      <Link to="/" className="brand"><span className="brand-mark">🌍</span> Trekkit</Link>
      <nav className="landing-nav-links">
        <Link to="/how-it-works" className="nav-text-link">
          <span className="nav-underline">How it works</span>
        </Link>
        <Dropdown menu={MENUS.features} />
        <Link to="/login" className="ghost-btn nav-underline-btn">Log in</Link>
        <button className="solid-btn" onClick={() => navigate("/login?mode=signup")}>Sign up free</button>
      </nav>
    </header>
  );
}
