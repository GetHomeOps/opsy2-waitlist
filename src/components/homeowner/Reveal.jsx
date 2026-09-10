import { useEffect, useRef, useState } from "react";

export function Reveal({ children, className = "", delay = "0ms", as: Tag = "div" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "80px 0px" },
    );

    observer.observe(node);
    const fallback = window.setTimeout(() => setVisible(true), 900);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={`${className} ${visible ? "rise-in" : "opacity-0"}`}
      style={visible ? { animationDelay: delay } : undefined}
    >
      {children}
    </Tag>
  );
}
