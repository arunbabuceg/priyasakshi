import { useEffect } from 'react';

/**
 * Lock body scrolling while a modal/drawer is open and restore it on close.
 *
 * iOS Safari ignores `overflow: hidden` on <body> for touch scrolling, so we
 * also pin the body with `position: fixed` and remember the scroll offset so
 * the page doesn't jump. On close we restore the exact scroll position.
 *
 * Safe to call with `locked=false` — it's a no-op.
 */
export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;

    const body = document.body;
    const scrollY = window.scrollY;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
