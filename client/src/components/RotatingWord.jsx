import { useEffect, useState } from "react";

// A "slot machine" word swap: the words stack vertically and slide upward on a
// timer. A clone of the first word at the end lets it loop seamlessly without
// ever jumping backwards.
export default function RotatingWord({ words, interval = 2200, transitionMs = 650 }) {
  const items = [...words, words[0]];
  const [i, setI] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setI((p) => p + 1), interval);
    return () => clearInterval(t);
  }, [interval]);

  useEffect(() => {
    if (i === words.length) {
      // landed on the clone — after the slide finishes, snap back to 0
      const snap = setTimeout(() => {
        setAnimate(false);
        setI(0);
      }, transitionMs);
      return () => clearTimeout(snap);
    }
    if (!animate) {
      // re-enable the transition on the next frame after the snap
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
      return () => cancelAnimationFrame(raf);
    }
  }, [i, animate, words.length, transitionMs]);

  return (
    <span className="word-rotator" aria-label={words[0]}>
      <span
        className={`word-track ${animate ? "" : "no-anim"}`}
        style={{ transform: `translateY(calc(${-i} * 1.12em))` }}
      >
        {items.map((w, idx) => (
          <span className="word-line grad" key={idx}>{w}</span>
        ))}
      </span>
    </span>
  );
}
