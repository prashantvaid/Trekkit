import { useState } from "react";

// Shares a trip via the native share sheet when available, otherwise copies the
// link to the clipboard and shows a brief confirmation.
export default function ShareButton({ tripId, title, className = "share-btn" }) {
  const [copied, setCopied] = useState(false);

  async function share(e) {
    e?.preventDefault();
    e?.stopPropagation();
    const url = `${window.location.origin}/trips/${tripId}`;
    const data = { title: title ? `${title} · Trekkit` : "A trip on Trekkit", url };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        /* user cancelled or share failed — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button type="button" className={className} onClick={share}>
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
