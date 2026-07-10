import '@testing-library/jest-dom/vitest';

// Vitest jsdom lacks a real IntersectionObserver — framer-motion needs it.
if (typeof window !== 'undefined' && !window.IntersectionObserver) {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  }
  window.IntersectionObserver = IO;
  global.IntersectionObserver = IO;
}

// jsdom doesn't implement scrollIntoView
if (typeof window !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// matchMedia stub for components that check reduced-motion etc.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
