import { useEffect, useRef, useState } from "react";

// Animates a number from 0 up to `to` the first time it scrolls into view.
// If `staticValue` is provided (e.g. "∞", "3D"), it's shown as-is.
export default function CountUp({ to = 0, prefix = "", suffix = "", staticValue, duration = 1500 }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(staticValue ?? `${prefix}0${suffix}`);
  const startedRef = useRef(false);

  useEffect(() => {
    if (staticValue != null) return; // nothing to animate
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(`${prefix}${to}${suffix}`);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || startedRef.current) return;
        startedRef.current = true;
        const start = performance.now();
        function tick(now) {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
          setDisplay(`${prefix}${Math.round(eased * to)}${suffix}`);
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        observer.unobserve(el);
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [to, prefix, suffix, staticValue, duration]);

  return <span ref={ref}>{staticValue ?? display}</span>;
}
