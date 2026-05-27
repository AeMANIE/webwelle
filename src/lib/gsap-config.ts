// GSAP Performance-Konfiguration
export const gsapConfig = {
  // Optimierte Einstellungen für bessere Performance
  defaults: {
    duration: 0.3,
    ease: "power2.out",
    force3D: true, // GPU-Beschleunigung aktivieren
  },
  
  // ScrollTrigger optimieren
  scrollTrigger: {
    scroller: "body",
    invalidateOnRefresh: true,
    refreshPriority: -1,
  },
  
  // Animationen mit will-change optimieren
  willChange: (element: HTMLElement) => {
    element.style.willChange = 'transform, opacity';
    return () => {
      element.style.willChange = 'auto';
    };
  },
  
  // Batch-Animationen für bessere Performance
  batch: (elements: HTMLElement[], callback: (element: HTMLElement) => void) => {
    elements.forEach(callback);
  },
  
  // Optimierte Marquee-Animation
  marquee: {
    duration: (width: number) => Math.max(20, width / 80),
    ease: "none",
    repeat: -1,
    force3D: true,
  },
  
  // Fade-Animationen
  fadeIn: {
    from: { opacity: 0, y: 20 },
    to: { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
  },
  
  fadeOut: {
    to: { opacity: 0, y: -20, duration: 0.3, ease: "power2.in" },
  },
  
  // Scale-Animationen
  scaleIn: {
    from: { scale: 0.8, opacity: 0 },
    to: { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" },
  },
  
  // Stagger-Animationen
  stagger: {
    duration: 0.1,
    ease: "power2.out",
  },
};
