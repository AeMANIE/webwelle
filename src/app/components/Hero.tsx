'use client';

import { useEffect, useRef, useState } from 'react';
import HeroIndustrySearch from '@/components/funnel/HeroIndustrySearch';
import { ShinyPanel } from '@/components/ui/shiny-panel';
import { Sparkles } from '@/components/ui/sparkles';

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playCount, setPlayCount] = useState(0);
  const [, setIsMobile] = useState(false);
  const [videoSrc, setVideoSrc] = useState('/Aa.mp4');

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice =
        window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      setIsMobile(isMobileDevice);
      setVideoSrc(isMobileDevice ? '/Aa90.mp4' : '/Aa.mp4');
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    <section className="relative py-16 md:py-32 min-h-screen flex items-center overflow-x-hidden">
      {/* Video nur hier clipped – Inhalt darf Dropdowns zeigen */}
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
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/50 to-background/70 z-10 pointer-events-none" />

      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <ShinyPanel className="relative z-30 max-w-5xl mx-auto overflow-visible p-4 md:p-8">
            <Sparkles>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-extrabold text-foreground leading-tight tracking-tight">
                <span className="block">High-Performance Websites</span>
                <span className="block">für das KI-Zeitalter</span>
              </h1>
            </Sparkles>
            <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-muted-foreground leading-relaxed font-light">
             – gebaut, um Kunden zu gewinnen
            </p>
            <div className="mt-6">
              <HeroIndustrySearch />
            </div>
          </ShinyPanel>
        </div>
      </div>
    </section>
  );
}
