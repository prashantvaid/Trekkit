const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function parseIsoDate(iso) {
  if (!iso || typeof iso !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(year, month, day);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
  return { year, month, day };
}

export function toIsoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function todayIso() {
  const d = new Date();
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

export function formatDisplayDate(iso, style = "long") {
  const p = parseIsoDate(iso);
  if (!p) return "";
  if (style === "short") {
    return `${MONTHS_SHORT[p.month]} ${p.day}, ${p.year}`;
  }
  return `${MONTHS_LONG[p.month]} ${p.day}, ${p.year}`;
}

export function compareIso(a, b) {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

export function addMonths(year, month, delta) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function isYearDisabled(year, min, max) {
  const minP = min ? parseIsoDate(min) : null;
  const maxP = max ? parseIsoDate(max) : null;
  if (minP && year < minP.year) return true;
  if (maxP && year > maxP.year) return true;
  return false;
}

export function isMonthDisabled(year, month, min, max) {
  const minP = min ? parseIsoDate(min) : null;
  const maxP = max ? parseIsoDate(max) : null;
  if (minP && (year < minP.year || (year === minP.year && month < minP.month))) return true;
  if (maxP && (year > maxP.year || (year === maxP.year && month > maxP.month))) return true;
  return false;
}

export function yearPageStartFor(year) {
  return Math.floor(year / 12) * 12;
}

/** Build a 6-row calendar grid (Sun–Sat). */
export function buildCalendarGrid(year, month) {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prev = addMonths(year, month, -1);
  const daysInPrev = new Date(prev.year, prev.month + 1, 0).getDate();
  const cells = [];

  for (let i = firstDow - 1; i >= 0; i--) {
    const day = daysInPrev - i;
    cells.push({ year: prev.year, month: prev.month, day, outside: true });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ year, month, day, outside: false });
  }
  const next = addMonths(year, month, 1);
  let n = 1;
  while (cells.length < 42) {
    cells.push({ year: next.year, month: next.month, day: n++, outside: true });
  }
  return cells;
}

export { MONTHS_LONG, MONTHS_SHORT };
