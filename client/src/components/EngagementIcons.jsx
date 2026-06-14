/** Minimal line icons for trip engagement (no emojis). */

export function IconLike({ filled = false, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7.5 4.5C5.5 4.5 4 6.2 4 8.2c0 4.1 4.9 7.4 8 9.8 3.1-2.4 8-5.7 8-9.8 0-2-1.5-3.7-3.5-3.7-1.2 0-2.3.6-3 1.5-.7-.9-1.8-1.5-3-1.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        fill={filled ? "currentColor" : "none"}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconComment({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v5A3.5 3.5 0 0 1 15.5 15H10l-4.5 3.5V15H8.5A3.5 3.5 0 0 1 5 11.5v-5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconShare({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16 8l-5-3.5v3H8.5A3.5 3.5 0 0 0 5 11v1.5M8 16l5 3.5v-3h2.5A3.5 3.5 0 0 0 19 13v-1.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBookmark({ filled = false, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4.5h10A1.5 1.5 0 0 1 18.5 6v13.5L12 17l-6.5 2.5V6A1.5 1.5 0 0 1 7 4.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        fill={filled ? "currentColor" : "none"}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSend({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12l16-7-7 16-2-7-7-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
