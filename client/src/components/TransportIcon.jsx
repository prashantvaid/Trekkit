const ICONS = {
  walk: (
    <>
      <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M9 22l2-7 1 3 2-10 2 7 2-5" />
    </>
  ),
  car: (
    <>
      <path d="M5 17h14l-1.5-5.5a2 2 0 0 0-1.9-1.5H8.4a2 2 0 0 0-1.9 1.5L5 17z" />
      <path d="M5 17v2a1 1 0 0 0 1 1h1" />
      <path d="M19 17v2a1 1 0 0 1-1 1h-1" />
      <path d="M7 11h10" />
      <circle cx="7.5" cy="17" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="17" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  train: (
    <>
      <rect x="4" y="6" width="16" height="11" rx="2" />
      <path d="M4 13h16" />
      <path d="M8 20v2" />
      <path d="M16 20v2" />
      <circle cx="8" cy="16.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16.5" r="1" fill="currentColor" stroke="none" />
      <path d="M12 3v3" />
    </>
  ),
  bus: (
    <>
      <path d="M6 7h12a2 2 0 0 1 2 2v8a1 1 0 0 1-1 1h-1" />
      <path d="M6 18H5a1 1 0 0 1-1-1V9a2 2 0 0 1 2-2" />
      <path d="M6 11h12" />
      <circle cx="8" cy="16" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1.25" fill="currentColor" stroke="none" />
      <path d="M9 5h6" />
    </>
  ),
  plane: (
    <>
      <path d="M2.5 12h4.5l2.5-6 3 14 2.5-6H19.5" />
      <path d="M12 6v12" opacity="0.35" />
    </>
  ),
  ferry: (
    <>
      <path d="M3 18h18" />
      <path d="M5 18l2-8h10l2 8" />
      <path d="M8 10l2-4h4l2 4" />
      <path d="M12 6V3" />
    </>
  ),
  bike: (
    <>
      <circle cx="6.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M9 17.5h5" />
      <path d="M11.5 17.5l-2-6h3l2 3 2.5-3H17l-3 6" />
      <path d="M14 8.5l1.5-2" />
    </>
  ),
};

export default function TransportIcon({ mode, size = 16, className = "" }) {
  const paths = ICONS[mode];
  if (!paths) return null;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths}
    </svg>
  );
}
