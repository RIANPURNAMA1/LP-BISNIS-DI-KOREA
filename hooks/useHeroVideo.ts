"use client";

import { useEffect, useRef } from "react";

const PARALLAX_SPEED = 0.25; // 0 = tanpa parallax, 0.4 = kuat
const GESTURE_GAP = 250; // ms tanpa scroll = gerakan scroll dianggap selesai

/**
 * Parallax video hero + toggle play/pause per gerakan scroll.
 * Scroll sekali -> play dan terus jalan; scroll lagi -> pause.
 */
export function useHeroVideo() {
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const video = videoRef.current;
    if (!hero || !video) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    video.pause();
    let ticking = false;
    let inGesture = false;
    let gestureTimer: ReturnType<typeof setTimeout> | undefined;
    let wantPlay = false;
    let heroVisible = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        heroVisible = entry.isIntersecting;
        if (!heroVisible) video.pause();
        else if (wantPlay && !reduce) video.play().catch(() => {});
      },
      { threshold: 0 }
    );
    observer.observe(hero);

    const parallax = () => {
      ticking = false;
      const y = window.scrollY;
      if (!reduce && y <= hero.offsetHeight) {
        video.style.transform = `translate3d(0, ${y * PARALLAX_SPEED}px, 0)`;
      }
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(parallax);
      }

      if (!inGesture && heroVisible && !reduce) {
        inGesture = true;
        wantPlay = !wantPlay;
        if (wantPlay) video.play().catch(() => {});
        else video.pause();
      }

      clearTimeout(gestureTimer);
      gestureTimer = setTimeout(() => {
        inGesture = false;
      }, GESTURE_GAP);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    video.addEventListener("loadedmetadata", parallax);
    parallax();

    return () => {
      window.removeEventListener("scroll", onScroll);
      video.removeEventListener("loadedmetadata", parallax);
      observer.disconnect();
      clearTimeout(gestureTimer);
    };
  }, []);

  return { heroRef, videoRef };
}
