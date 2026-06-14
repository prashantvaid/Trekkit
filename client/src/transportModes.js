export const TRANSPORT_MODES = [
  { id: "walk", label: "Walk" },
  { id: "car", label: "Car" },
  { id: "train", label: "Train" },
  { id: "bus", label: "Bus" },
  { id: "plane", label: "Flight" },
  { id: "ferry", label: "Ferry" },
  { id: "bike", label: "Bike" },
];

const MODE_MAP = Object.fromEntries(TRANSPORT_MODES.map((m) => [m.id, m]));

/** Shared palette — globe arcs, map lines, and transport chips use the same hues. */
const ROUTE_PALETTE = {
  walk: {
    line: "#57534e",
    flow: "#78716c",
    bg: "#f5f5f4",
    arcStart: "rgba(87, 83, 78, 0.14)",
    arcEnd: "rgba(87, 83, 78, 0.95)",
    lineStyle: "dotted",
    verb: "On foot",
  },
  car: {
    line: "#c2410c",
    flow: "#ea580c",
    bg: "#fff7ed",
    arcStart: "rgba(194, 65, 12, 0.14)",
    arcEnd: "rgba(234, 88, 12, 0.95)",
    lineStyle: "solid",
    verb: "Driving",
  },
  train: {
    line: "#6d28d9",
    flow: "#7c3aed",
    bg: "#ede9fe",
    arcStart: "rgba(109, 40, 217, 0.14)",
    arcEnd: "rgba(124, 58, 237, 0.95)",
    lineStyle: "solid",
    verb: "By rail",
  },
  bus: {
    line: "#b45309",
    flow: "#d97706",
    bg: "#fef3c7",
    arcStart: "rgba(180, 83, 9, 0.14)",
    arcEnd: "rgba(217, 119, 6, 0.95)",
    lineStyle: "solid",
    verb: "By bus",
  },
  plane: {
    line: "#0369a1",
    flow: "#0284c7",
    bg: "#e0f2fe",
    arcStart: "rgba(3, 105, 161, 0.14)",
    arcEnd: "rgba(2, 132, 199, 0.95)",
    lineStyle: "dashed",
    verb: "Flight",
  },
  ferry: {
    line: "#0e7490",
    flow: "#0891b2",
    bg: "#cffafe",
    arcStart: "rgba(14, 116, 144, 0.14)",
    arcEnd: "rgba(8, 145, 178, 0.95)",
    lineStyle: "dashed",
    verb: "By ferry",
  },
  bike: {
    line: "#15803d",
    flow: "#16a34a",
    bg: "#dcfce7",
    arcStart: "rgba(21, 128, 61, 0.14)",
    arcEnd: "rgba(22, 163, 74, 0.95)",
    lineStyle: "solid",
    verb: "Cycling",
  },
  default: {
    line: "#c2410c",
    flow: "#ea580c",
    bg: "#fff7ed",
    arcStart: "rgba(194, 65, 12, 0.14)",
    arcEnd: "rgba(234, 88, 12, 0.95)",
    lineStyle: "solid",
    verb: "Travel",
  },
};

function paletteFor(mode) {
  return ROUTE_PALETTE[mode] || ROUTE_PALETTE.default;
}

export function transportMode(id) {
  return MODE_MAP[id] || null;
}

export function transportTheme(id) {
  const p = paletteFor(id);
  return { color: p.line, bg: p.bg, line: p.lineStyle, verb: p.verb };
}

export function transportLabel(id) {
  const m = transportMode(id);
  return m ? m.label : null;
}

/** Solid + highlight colors for map route segments and UI chips. */
export function transportRouteColors(mode) {
  const p = paletteFor(mode);
  return { line: p.line, flow: p.flow, bg: p.bg };
}

/** Globe arc gradient [start, end] by how you traveled to the next stop. */
export function transportArcColors(mode) {
  const p = paletteFor(mode);
  return [p.arcStart, p.arcEnd];
}

export function transportArcAltitude(mode) {
  return mode === "plane" ? 0.38 : mode === "train" ? 0.26 : 0.2;
}
