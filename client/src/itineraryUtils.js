/** Unique day numbers on a trip, sorted ascending. */
export function tripDayNumbers(stops = []) {
  const days = new Set();
  for (const s of stops) {
    if (s.day != null && Number.isFinite(Number(s.day))) days.add(Number(s.day));
  }
  return [...days].sort((a, b) => a - b);
}

export function maxTripDay(stops = []) {
  const days = tripDayNumbers(stops);
  return days.length ? days[days.length - 1] : 0;
}

/** Default day when adding the next stop — same day as last stop so users can add multiple per day. */
export function defaultDayForNewStop(stops = []) {
  const last = stops.at(-1);
  if (last?.day != null && Number.isFinite(Number(last.day))) return Number(last.day);
  return 1;
}

/** Group ordered stops by day for itinerary display. Stops without day go in "Unscheduled". */
export function groupStopsByDay(stops = []) {
  const groups = new Map();
  const unscheduled = [];

  for (const stop of stops) {
    if (stop.day != null && Number.isFinite(Number(stop.day))) {
      const d = Number(stop.day);
      if (!groups.has(d)) groups.set(d, []);
      groups.get(d).push(stop);
    } else {
      unscheduled.push(stop);
    }
  }

  const sorted = [...groups.entries()].sort(([a], [b]) => a - b);
  if (unscheduled.length) sorted.push([null, unscheduled]);
  return sorted;
}
