import { useEffect, useRef, useState } from "react";

// Wraps content and adds an "in-view" class the first time it scrolls into
// the viewport, driving the entrance animations defined in styles.css.
export default function Reveal({
  children,
  as: Tag = "div",
  className = "",
  variant = "up", // up | left | right | scale
  delay = 0,
  once = true,
  ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      className={`reveal-el reveal-${variant} ${visible ? "in-view" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...(rest.style || {}) }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
