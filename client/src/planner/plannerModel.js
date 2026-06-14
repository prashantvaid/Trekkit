export const TRIP_TYPES = [
  "Adventure",
  "Culture",
  "Relaxation",
  "Food & Drink",
  "Business",
];

export const PLANNER_SLOTS = ["morning", "afternoon", "evening"];

export const SLOT_LABELS = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export const ACTIVITY_TYPES = {
  hotel: { id: "hotel", label: "Hotel", icon: "hotel" },
  flight: { id: "flight", label: "Flight", icon: "flight" },
  restaurant: { id: "restaurant", label: "Restaurant", icon: "restaurant" },
  activity: { id: "activity", label: "Activity", icon: "activity" },
  note: { id: "note", label: "Custom note", icon: "note" },
};

let _uid = Date.now();

export function plannerUid() {
  _uid += 1;
  return _uid;
}

export function emptySlots() {
  return { morning: [], afternoon: [], evening: [] };
}

export function parseIsoDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function formatIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** LiteAPI requires checkout after checkin — default to +1 night when same day. */
export function normalizeHotelDates(checkIn, checkOut) {
  if (!checkIn) return { checkIn: null, checkOut: null };
  let out = checkOut || checkIn;
  if (out <= checkIn) {
    const d = parseIsoDate(checkIn);
    if (d) {
      d.setDate(d.getDate() + 1);
      out = formatIsoDate(d);
    }
  }
  return { checkIn, checkOut: out };
}

export function eachDayBetween(startIso, endIso) {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  if (!start || !end || end < start) return [];
  const days = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(formatIsoDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function createActivity(type, data = {}) {
  return {
    id: plannerUid(),
    type,
    title: data.title || "",
    subtitle: data.subtitle || "",
    notes: data.notes || "",
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    price: data.price ?? null,
    currency: data.currency || "USD",
    meta: data.meta || {},
    createdAt: Date.now(),
  };
}

export function buildDaySkeletons(startIso, endIso) {
  return eachDayBetween(startIso, endIso).map((date, i) => ({
    id: plannerUid(),
    date,
    label: `Day ${i + 1}`,
    slots: emptySlots(),
  }));
}

export function createPlan(partial = {}) {
  const now = Date.now();
  const id = partial.id || `plan-${now}`;
  const start = partial.dates?.start || "";
  const end = partial.dates?.end || start;
  const days =
    partial.days?.length > 0
      ? partial.days
      : start && end
        ? buildDaySkeletons(start, end)
        : [];

  return {
    id,
    phase: partial.phase || (days.length ? "build" : "setup"),
    destination: partial.destination || null,
    origin: partial.origin || null,
    dates: { start, end },
    travelers: partial.travelers ?? 1,
    tripTypes: partial.tripTypes || [],
    useAI: partial.useAI ?? false,
    days,
    createdAt: partial.createdAt || now,
    updatedAt: now,
  };
}

export function planProgress(plan) {
  if (!plan?.days?.length) return 0;
  let filled = 0;
  for (const day of plan.days) {
    const count = PLANNER_SLOTS.reduce((n, slot) => n + (day.slots?.[slot]?.length || 0), 0);
    if (count > 0) filled += 1;
  }
  return Math.round((filled / plan.days.length) * 100);
}

export function planActivityCount(plan) {
  return (plan?.days || []).reduce(
    (n, day) =>
      n + PLANNER_SLOTS.reduce((m, slot) => m + (day.slots?.[slot]?.length || 0), 0),
    0
  );
}

export function formatActivityPrice(act) {
  if (act?.price == null || !Number.isFinite(Number(act.price))) return null;
  const amount = Number(act.price);
  const cur = act.currency || "USD";
  if (act.type === "hotel" || act.meta?.priceIsNightly) {
    return `${cur} ${amount.toFixed(0)}/night`;
  }
  return `${cur} ${amount.toFixed(0)}`;
}

export function planTotalCost(plan) {
  let total = 0;
  let currency = "USD";
  for (const day of plan?.days || []) {
    for (const slot of PLANNER_SLOTS) {
      for (const act of day.slots?.[slot] || []) {
        if (act.price == null || !Number.isFinite(Number(act.price))) continue;
        const price = Number(act.price);
        if (act.type === "hotel" || act.meta?.priceIsNightly) {
          if (act.meta?.totalStayPrice != null) {
            total += Number(act.meta.totalStayPrice);
          } else {
            const nights = act.meta?.nights || 1;
            total += price * nights;
          }
        } else {
          total += price;
        }
        if (act.currency) currency = act.currency;
      }
    }
  }
  return { total, currency };
}

export function planMapPins(plan) {
  const pins = [];
  for (const day of plan?.days || []) {
    for (const slot of PLANNER_SLOTS) {
      for (const act of day.slots?.[slot] || []) {
        if (Number.isFinite(act.lat) && Number.isFinite(act.lng)) {
          pins.push({
            id: act.id,
            name: act.title,
            lat: act.lat,
            lng: act.lng,
            day: day.label,
            slot,
          });
        }
      }
    }
  }
  return pins;
}

export function resumePhase(plan) {
  if (!plan.destination?.name || !plan.dates?.start) return "setup";
  if (plan.phase === "summary") return "summary";
  return "build";
}
