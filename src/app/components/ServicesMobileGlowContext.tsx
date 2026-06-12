'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { readLayoutEnv, shouldUseTouchGlow } from '@/lib/responsive-layout-mode';
import { computeScrollActiveIndex } from '@/lib/services-scroll-glow';

type ServicesMobileGlowContextValue = {
  activeIndex: number | null;
  registerCard: (index: number, el: HTMLElement | null) => void;
  setTappedIndex: (index: number | null) => void;
};

const ServicesMobileGlowContext = createContext<ServicesMobileGlowContextValue | null>(null);

export function ServicesMobileGlowProvider({
  children,
  sectionId = 'leistungen',
}: {
  children: ReactNode;
  sectionId?: string;
}) {
  const cardsRef = useRef<Map<number, HTMLElement>>(new Map());
  const [scrollActiveIndex, setScrollActiveIndex] = useState<number | null>(null);
  const [tappedIndex, setTappedIndexState] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const activeIndex = tappedIndex ?? scrollActiveIndex;

  const registerCard = useCallback((index: number, el: HTMLElement | null) => {
    if (el) {
      cardsRef.current.set(index, el);
    } else {
      cardsRef.current.delete(index);
    }
  }, []);

  const setTappedIndex = useCallback((index: number | null) => {
    setTappedIndexState(index);
  }, []);

  const [touchGlowActive, setTouchGlowActive] = useState(
    () => typeof window !== 'undefined' && shouldUseTouchGlow(readLayoutEnv())
  );

  useEffect(() => {
    const syncTouchGlow = () => {
      setTouchGlowActive(shouldUseTouchGlow(readLayoutEnv()));
    };

    syncTouchGlow();

    const coarseMq = window.matchMedia('(pointer: coarse)');
    const fineHoverMq = window.matchMedia('(hover: hover) and (pointer: fine)');

    const onChange = () => syncTouchGlow();

    window.addEventListener('resize', onChange);
    window.addEventListener('orientationchange', onChange);
    window.visualViewport?.addEventListener('resize', onChange);
    coarseMq.addEventListener('change', onChange);
    fineHoverMq.addEventListener('change', onChange);

    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('orientationchange', onChange);
      window.visualViewport?.removeEventListener('resize', onChange);
      coarseMq.removeEventListener('change', onChange);
      fineHoverMq.removeEventListener('change', onChange);
    };
  }, []);

  const updateScrollActiveIndex = useCallback(() => {
    if (!touchGlowActive) {
      setScrollActiveIndex(null);
      setTappedIndexState(null);
      return;
    }
    setScrollActiveIndex(computeScrollActiveIndex(cardsRef.current, sectionId));
  }, [touchGlowActive, sectionId]);

  useEffect(() => {
    if (!touchGlowActive) return;

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setTappedIndexState(null);
        updateScrollActiveIndex();
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateScrollActiveIndex();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [touchGlowActive, updateScrollActiveIndex]);

  useEffect(() => {
    updateScrollActiveIndex();
  }, [registerCard, updateScrollActiveIndex]);

  return (
    <ServicesMobileGlowContext.Provider value={{ activeIndex, registerCard, setTappedIndex }}>
      {children}
    </ServicesMobileGlowContext.Provider>
  );
}

export function useServicesMobileGlowCard(
  glowIndex: number,
  cardRef: RefObject<HTMLDivElement | null>
) {
  const ctx = useContext(ServicesMobileGlowContext);

  useEffect(() => {
    if (!ctx) return;
    const el = cardRef.current;
    if (el) ctx.registerCard(glowIndex, el);
    return () => ctx.registerCard(glowIndex, null);
  }, [ctx, glowIndex, cardRef]);

  const handleTap = useCallback(() => {
    ctx?.setTappedIndex(glowIndex);
  }, [ctx, glowIndex]);

  if (!ctx) {
    return { isActive: false, handleTap };
  }

  return {
    isActive: ctx.activeIndex === glowIndex,
    handleTap,
  };
}
