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
import { useLayoutMode } from '@/hooks/useLayoutMode';

type ServicesMobileGlowContextValue = {
  activeIndex: number | null;
  registerCard: (index: number, el: HTMLElement | null) => void;
  setTappedIndex: (index: number | null) => void;
};

const ServicesMobileGlowContext = createContext<ServicesMobileGlowContextValue | null>(null);

function computeScrollActiveIndex(
  cards: Map<number, HTMLElement>,
  sectionId: string
): number | null {
  const section = document.getElementById(sectionId);
  if (!section) return null;

  const sectionRect = section.getBoundingClientRect();
  if (sectionRect.bottom < 0 || sectionRect.top > window.innerHeight) {
    return null;
  }

  const viewportCenterY = window.innerHeight / 2;
  const sorted = Array.from(cards.entries()).sort((a, b) => a[0] - b[0]);

  let activeIndex: number | null = null;

  for (const [index, el] of sorted) {
    const rect = el.getBoundingClientRect();
    const visible = rect.bottom > 0 && rect.top < window.innerHeight;
    if (!visible) continue;

    const centerY = rect.top + rect.height / 2;
    if (centerY <= viewportCenterY) {
      activeIndex = index;
    }
  }

  if (activeIndex === null) {
    for (const [index, el] of sorted) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        return index;
      }
    }
  }

  return activeIndex;
}

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

  const layoutMode = useLayoutMode();

  const updateScrollActiveIndex = useCallback(() => {
    if (layoutMode !== 'mobile') {
      setScrollActiveIndex(null);
      setTappedIndexState(null);
      return;
    }
    setScrollActiveIndex(computeScrollActiveIndex(cardsRef.current, sectionId));
  }, [layoutMode, sectionId]);

  useEffect(() => {
    if (layoutMode !== 'mobile') return;

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
  }, [layoutMode, updateScrollActiveIndex]);

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
