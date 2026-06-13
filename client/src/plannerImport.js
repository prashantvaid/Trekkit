// Lightweight handoff used to "copy" a trip's itinerary into the (local) planner.
const KEY = "trekkit:plannerImport";

// Turn a hydrated trip's stops into the planner's day/items shape.
export function tripToPlan(trip) {
  const stops = trip.stops || [];
  const byDay = new Map();
  stops.forEach((s, idx) => {
    const day = s.day ?? idx + 1;
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(s);
  });

  let uid = 1;
  const days = [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, dayStops], i) => ({
      id: uid++,
      label: `Day ${i + 1}`,
      place: dayStops[0]?.name || "New stop",
      items: dayStops.map((s) => ({
        id: uid++,
        time: "—",
        title: s.notes ? `${s.name} — ${s.notes}` : s.name,
      })),
    }));

  if (days.length === 0) {
    days.push({ id: uid++, label: "Day 1", place: "New stop", items: [] });
  }

  return {
    name: `${trip.title} (copy)`,
    source: { title: trip.title, author: trip.author?.username || "a traveler" },
    days,
  };
}

export function setPlannerImport(trip) {
  try {
    localStorage.setItem(KEY, JSON.stringify(tripToPlan(trip)));
  } catch {
    /* storage may be unavailable */
  }
}

export function takePlannerImport() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    localStorage.removeItem(KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
