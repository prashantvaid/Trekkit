import { Link } from "react-router-dom";

const YEAR = new Date().getFullYear();

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.41-1.27.74-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.42.36.8 1.08.8 2.18v3.23c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.97 6.82H1.66l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.01 4.12H5.05l12.03 15.65Z"
      />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Link to="/" className="brand"><span className="brand-mark">🌍</span> Trekkit</Link>
          <p className="muted">
            Your travel journal, mapped — track your trips day by day, drop pins where you wandered,
            and share your journeys on a living 3D map.
          </p>
          <div className="footer-socials">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">
              <GitHubIcon />
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn">
              <LinkedInIcon />
            </a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" title="X">
              <XIcon />
            </a>
          </div>
        </div>

        <div className="footer-cols">
          <div className="footer-col">
            <h4>Product</h4>
            <Link to="/features">Features</Link>
            <Link to="/how-it-works">How it works</Link>
            <Link to="/login?mode=signup">Sign up free</Link>
            <Link to="/login">Log in</Link>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <a href="#about">About</a>
            <a href="#blog">Blog</a>
            <a href="#careers">Careers</a>
            <a href="mailto:hello@trekkit.app">Contact</a>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <a href="#help">Help center</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#status">Status</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span className="muted">© {YEAR} Trekkit. All rights reserved.</span>
        <span className="muted">Made for people who'd rather be somewhere else. 🧭</span>
      </div>
    </footer>
  );
}
