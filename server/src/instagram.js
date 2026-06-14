export function normalizeInstagram(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  s = s.replace(/^@/, "");
  s = s.split(/[/?#]/)[0].trim();
  return s || null;
}
