import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="nav">
      <Link to="/" className="brand">
        <span className="brand-mark">🌍</span> Trekkit
      </Link>
      {user && (
        <>
          <nav className="nav-center">
            <NavLink to="/" end>Feed</NavLink>
            <NavLink to="/recommended">For You</NavLink>
            <NavLink to="/plan">Plan</NavLink>
            <NavLink to="/saved">Saved</NavLink>
            <NavLink to="/friends">Friends</NavLink>
            <NavLink to="/trips/new" className="btn-track">+ Track a Trip</NavLink>
          </nav>
          <div className="nav-right">
            <NavLink to="/settings" className="nav-settings">Settings</NavLink>
            <NavLink to={`/u/${user.id}`} className="nav-avatar" title={user.username}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} />
              ) : (
                <span>{user.username[0]?.toUpperCase()}</span>
              )}
            </NavLink>
            <button className="link-btn" onClick={handleLogout}>Log out</button>
          </div>
        </>
      )}
    </header>
  );
}
