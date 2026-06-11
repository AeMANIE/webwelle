'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import {
  consumePendingScrollTarget,
  HOME_TOP_TARGET,
  scrollToAnchorWithRetry,
  scrollToTop,
} from '@/lib/scroll-to-anchor';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleHashScroll = () => {
      const pending = consumePendingScrollTarget();
      if (pending === HOME_TOP_TARGET) {
        scrollToTop('smooth');
        return;
      }

      const hash = window.location.hash.replace(/^#/, '');
      const target = pending || hash;
      if (target) scrollToAnchorWithRetry(target);
    };

    handleHashScroll();
    window.addEventListener('hashchange', handleHashScroll);
    return () => window.removeEventListener('hashchange', handleHashScroll);
  }, []);

  useEffect(() => {
    const toggleVisibility = () => {
      // Button wird sichtbar wenn der User 300px nach unten scrollt
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const handleScrollToTop = () => {
    scrollToTop('smooth');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={handleScrollToTop}
      className="fixed bottom-8 right-8 z-50 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-all duration-300 hover:scale-110 group focus:outline-none focus:ring-0"
      aria-label="Nach oben scrollen"
    >
      <ChevronUp 
        className="w-6 h-6 transition-transform group-hover:-translate-y-1" 
      />
    </button>
  );
}
