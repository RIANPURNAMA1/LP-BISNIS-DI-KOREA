"use client";

import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";

type Direction = "up" | "down" | "left" | "right" | "fade" | "zoom";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: Direction;
  threshold?: number;
  once?: boolean;
}

const transforms: Record<Direction, string> = {
  up: "translate3d(0, 36px, 0)",
  down: "translate3d(0, -36px, 0)",
  left: "translate3d(-36px, 0, 0)",
  right: "translate3d(36px, 0, 0)",
  fade: "translate3d(0, 0, 0)",
  zoom: "scale(0.96)",
};

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  duration = 900,
  direction = "up",
  threshold = 0.05,
  once = true,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold]);

  const style: CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "none" : transforms[direction],
    transitionProperty: "opacity, transform",
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
    transitionDelay: `${delay}ms`,
    willChange: isVisible ? "auto" : "opacity, transform",
  };

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}
