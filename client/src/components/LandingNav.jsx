import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const MENUS = {
  features: {
    label: "Features",
    items: [
      { icon: "🌍", title: "3D trip map", text: "Your route on a living globe", to: "/features#map" },
      { icon: "📸", title: "Photo pins", text: "Memories where they happened", to: "/features#photos" },
      { icon: "🧭", title: "Itinerary builder", text: "Plan before you go", to: "/features#plan" },
      { icon: "👋", title: "Friends & feed", text: "Follow fellow travelers", to: "/features#social" },
    ],
  },
  how: {
    label: "How it works",
    items: [
      { icon: "🗺️", title: "Track a trip", text: "Log it day by day", to: "/features#track" },
      { icon: "📍", title: "Drop your pins", text: "Search any place on earth", to: "/features#pins" },
      { icon: "✨", title: "Share the journey", text: "Post it to your feed", to: "/features#share" },
    ],
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
    // small delay so the cursor can travel into the panel
    closeTimer.current = setTimeout(() => setOpen(false), 120);
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
        {menu.items.map((it) => (
          <Link key={it.title} to={it.to} className="nav-dd-item" role="menuitem">
            <span className="nav-dd-icon">{it.icon}</span>
            <span>
              <strong>{it.title}</strong>
              <span className="muted small">{it.text}</span>
            </span>
          </Link>
        ))}
        <Link to="/features" className="nav-dd-all">See all features →</Link>
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
        <Dropdown menu={MENUS.how} />
        <Dropdown menu={MENUS.features} />
        <Link to="/login" className="ghost-btn nav-underline-btn">Log in</Link>
        <button className="solid-btn" onClick={() => navigate("/login?mode=signup")}>Sign up free</button>
      </nav>
    </header>
  );
}
