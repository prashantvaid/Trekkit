import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { NOTIF_FILTERS, NOTIF_ICONS } from "../notifications/defaults.js";
import { useNotifications } from "../notifications/useNotifications.js";

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function groupLabel(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 24 * 60 * 60 * 1000) return "Today";
  if (diff < 48 * 60 * 60 * 1000) return "Yesterday";
  return "Earlier";
}

export default function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return notifications;
    return notifications.filter((n) => n.category === filter);
  }, [notifications, filter]);

  const grouped = useMemo(() => {
    const order = ["Today", "Yesterday", "Earlier"];
    const map = new Map(order.map((l) => [l, []]));
    for (const n of filtered) {
      const label = groupLabel(n.created_at);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(n);
    }
    return order.filter((l) => map.get(l)?.length).map((l) => ({ label: l, items: map.get(l) }));
  }, [filtered]);

  return (
    <div className="page notifications-page">
      <div className="notifications-head">
        <div>
          <h1>Notifications</h1>
          <p className="muted">
            Kudos, comments, follows, and updates from people you travel with.
          </p>
        </div>
        {unreadCount > 0 && (
          <button type="button" className="btn-secondary notifications-mark-all" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      <div className="notifications-filters">
        {NOTIF_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`notifications-filter${filter === f.id ? " active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card notifications-empty">
          <p className="muted">Nothing in this category yet.</p>
          <p className="muted small">When someone interacts with your trips, it will show up here.</p>
        </div>
      ) : (
        <div className="notifications-groups">
          {grouped.map((g) => (
            <section key={g.label} className="notifications-group">
              <h2 className="notifications-group-label">{g.label}</h2>
              <ul className="notifications-list">
                {g.items.map((n) => (
                  <li key={n.id} className={`notifications-item${n.read ? " is-read" : ""}`}>
                    <Link
                      to={n.link}
                      className="notifications-item-link"
                      onClick={() => markRead(n.id)}
                    >
                      <span className={`notifications-icon type-${n.type}`} aria-hidden>
                        {NOTIF_ICONS[n.type] || "🔔"}
                      </span>
                      <span className="notifications-content">
                        <span className="notifications-title-row">
                          <strong>{n.title}</strong>
                          {!n.read && <span className="notifications-unread-dot" aria-label="Unread" />}
                        </span>
                        <span className="notifications-body muted">{n.body}</span>
                        <span className="notifications-meta muted small">
                          {n.actor.username !== "Trekkit" && `@${n.actor.username} · `}
                          {timeAgo(n.created_at)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
