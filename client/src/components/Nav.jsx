import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { useNotifications } from "../notifications/useNotifications.js";

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

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
            <NavLink to="/notifications" className="nav-notif-link">
              Notifications
              {unreadCount > 0 && (
                <span className="nav-notif-badge" aria-label={`${unreadCount} unread`}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </NavLink>
            <NavLink to="/friends">Friends</NavLink>
            <NavLink to="/post" className="btn-track">+ Post</NavLink>
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
