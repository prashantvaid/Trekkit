// ISO 3166-1 alpha-2 codes → regional indicator emoji flags.
const NAME_TO_ISO = {
  japan: "JP",
  "united states": "US",
  usa: "US",
  america: "US",
  france: "FR",
  italy: "IT",
  thailand: "TH",
  iceland: "IS",
  australia: "AU",
  canada: "CA",
  "new zealand": "NZ",
  norway: "NO",
  nepal: "NP",
  indonesia: "ID",
  spain: "ES",
  portugal: "PT",
  greece: "GR",
  morocco: "MA",
  "south africa": "ZA",
  india: "IN",
  brazil: "BR",
  mexico: "MX",
  "united kingdom": "GB",
  uk: "GB",
  england: "GB",
  scotland: "GB",
  wales: "GB",
  germany: "DE",
  netherlands: "NL",
  vietnam: "VN",
  peru: "PE",
  chile: "CL",
  argentina: "AR",
  switzerland: "CH",
  china: "CN",
  "south korea": "KR",
  korea: "KR",
  taiwan: "TW",
  singapore: "SG",
  malaysia: "MY",
  philippines: "PH",
  cambodia: "KH",
  laos: "LA",
  myanmar: "MM",
  turkey: "TR",
  egypt: "EG",
  kenya: "KE",
  tanzania: "TZ",
  uganda: "UG",
  ethiopia: "ET",
  nigeria: "NG",
  ghana: "GH",
  israel: "IL",
  jordan: "JO",
  "saudi arabia": "SA",
  uae: "AE",
  "united arab emirates": "AE",
  qatar: "QA",
  iran: "IR",
  iraq: "IQ",
  pakistan: "PK",
  bangladesh: "BD",
  "sri lanka": "LK",
  maldives: "MV",
  bhutan: "BT",
  mongolia: "MN",
  russia: "RU",
  ukraine: "UA",
  poland: "PL",
  czechia: "CZ",
  "czech republic": "CZ",
  austria: "AT",
  hungary: "HU",
  romania: "RO",
  croatia: "HR",
  serbia: "RS",
  slovenia: "SI",
  slovakia: "SK",
  belgium: "BE",
  ireland: "IE",
  denmark: "DK",
  sweden: "SE",
  finland: "FI",
  estonia: "EE",
  latvia: "LV",
  lithuania: "LT",
  colombia: "CO",
  ecuador: "EC",
  bolivia: "BO",
  paraguay: "PY",
  uruguay: "UY",
  venezuela: "VE",
  panama: "PA",
  "costa rica": "CR",
  guatemala: "GT",
  cuba: "CU",
  jamaica: "JM",
  "dominican republic": "DO",
  haiti: "HT",
  "puerto rico": "PR",
  greenland: "GL",
  fiji: "FJ",
  samoa: "WS",
  tonga: "TO",
  papua: "PG",
  "papua new guinea": "PG",
  georgia: "GE",
  armenia: "AM",
  azerbaijan: "AZ",
  kazakhstan: "KZ",
  uzbekistan: "UZ",
};

export function getCountryCode(name, fallbackCode) {
  if (fallbackCode) return String(fallbackCode).toUpperCase();
  if (!name) return null;
  const n = name.toLowerCase().trim();
  if (NAME_TO_ISO[n]) return NAME_TO_ISO[n];
  for (const [key, code] of Object.entries(NAME_TO_ISO)) {
    if (n === key || n.startsWith(`${key} `) || n.includes(key)) return code;
  }
  return null;
}

export function countryCodeToEmoji(code) {
  if (!code || code.length !== 2) return null;
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  return String.fromCodePoint(
    ...[...upper].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

/** Emoji-only country flag. `wave` is kept for API compat but unused for now. */
export function CountryFlag({ name, code, size = "md", className = "" }) {
  const iso = getCountryCode(name, code);
  const emoji = countryCodeToEmoji(iso);

  if (!iso || !emoji) return null;

  return (
    <span
      className={["country-flag", `country-flag-${size}`, className].filter(Boolean).join(" ")}
      role="img"
      aria-label={name ? `${name} flag` : `${iso} flag`}
    >
      {emoji}
    </span>
  );
}
