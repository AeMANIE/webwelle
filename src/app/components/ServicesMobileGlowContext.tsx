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
import { MOBILE_GLOW_QUERY } from '@/components/ui/spotlight-card-shared';

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

  const updateScrollActiveIndex = useCallback(() => {
    if (!window.matchMedia(MOBILE_GLOW_QUERY).matches) {
      setScrollActiveIndex(null);
      setTappedIndexState(null);
      return;
    }
    setScrollActiveIndex(computeScrollActiveIndex(cardsRef.current, sectionId));
  }, [sectionId]);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_GLOW_QUERY);
    if (!mq.matches) return;

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setTappedIndexState(null);
        updateScrollActiveIndex();
      });
    };

    const onMqChange = () => {
      setTappedIndexState(null);
      updateScrollActiveIndex();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    mq.addEventListener('change', onMqChange);
    updateScrollActiveIndex();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      mq.removeEventListener('change', onMqChange);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [updateScrollActiveIndex]);

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
