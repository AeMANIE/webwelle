'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ShinyButton } from '@/components/ui/shiny-button';
import { SHINY_SWEEP_PRESETS } from '@/components/ui/shiny-motion';
import { ShinyPanel } from '@/components/ui/shiny-panel';
import { Sparkles } from '@/components/ui/sparkles';
import { navigateToStarterwelle } from '@/lib/scroll-to-anchor';

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playCount, setPlayCount] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      video.muted = true;
      video.volume = 0;
      video.play().catch(console.error);
    };

    const handlePlay = () => {
      setPlayCount((c) => c + 1);
      video.muted = true;
      video.volume = 0;
    };

    const handleEnded = () => {
      video.muted = true;
      video.volume = 0;
    };

    const handleCanPlay = () => {
      if (!video.paused) return;
      video.muted = true;
      video.volume = 0;
      video.play().catch(console.error);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('ended', handleEnded);
    };
  }, [playCount]);

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          objectPosition: 'center center',
          minWidth: '100%',
          minHeight: '100%',
          width: '100%',
          height: '100%',
        }}
        preload="metadata"
        controls={false}
      >
        <source src="/Aa90.mp4" type="video/mp4" media="(max-width: 767px)" />
        <source src="/Aa.mp4" type="video/mp4" />
      </video>
    </div>
  );
}

export function HeroPanel({ children }: { children: ReactNode }) {
  return (
    <ShinyPanel className="relative z-30 max-w-5xl mx-auto overflow-visible p-6 sm:p-8 md:p-8 w-full">
      {children}
    </ShinyPanel>
  );
}

export function HeroSparkles({ children }: { children: ReactNode }) {
  return <Sparkles>{children}</Sparkles>;
}

export function HeroCta() {
  return (
    <div className="mt-6 flex justify-center">
      <ShinyButton
        type="button"
        onClick={navigateToStarterwelle}
        labelClassName="!text-orange-400 uppercase tracking-wide"
        sweepConfig={SHINY_SWEEP_PRESETS.button}
        className="w-full sm:w-auto sm:min-w-[240px] shrink-0 px-8"
      >
        Unverbindlich anfragen
      </ShinyButton>
    </div>
  );
}
