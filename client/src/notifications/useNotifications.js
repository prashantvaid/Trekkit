import { useCallback, useEffect, useState } from "react";
import { DEFAULT_NOTIFICATIONS } from "./defaults.js";

const READ_KEY = "trekkit-notif-read";

function loadReadIds() {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(set) {
  localStorage.setItem(READ_KEY, JSON.stringify([...set]));
}

export function useNotifications() {
  const [readIds, setReadIds] = useState(loadReadIds);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === READ_KEY) setReadIds(loadReadIds());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const notifications = DEFAULT_NOTIFICATIONS.map((n) => ({
    ...n,
    read: readIds.has(n.id),
  }));

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback((id) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    const all = new Set(DEFAULT_NOTIFICATIONS.map((n) => n.id));
    saveReadIds(all);
    setReadIds(all);
  }, []);

  return { notifications, unreadCount, markRead, markAllRead };
}
