'use client';

import { useEffect, useRef, useState } from 'react';
import { Zap, DollarSign, Palette } from 'lucide-react';

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playCount, setPlayCount] = useState(0);
  const [, setIsMobile] = useState(false);
  const [videoSrc, setVideoSrc] = useState("/Aa.mp4");

  useEffect(() => {
    // Prüfe ob es sich um ein mobiles Gerät handelt
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log('Mobile check:', { 
        width: window.innerWidth, 
        userAgent: navigator.userAgent, 
        isMobile: isMobileDevice 
      });
      setIsMobile(isMobileDevice);
      setVideoSrc(isMobileDevice ? "/Aa90.mp4" : "/Aa.mp4");
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      // Video starten (immer stumm)
      video.muted = true;
      video.volume = 0;
      video.play().catch(console.error);
    };

    const handlePlay = () => {
      const newPlayCount = playCount + 1;
      setPlayCount(newPlayCount);
      
      // Video immer stumm halten
      video.muted = true;
      video.volume = 0;
    };

    const handleEnded = () => {
      // Video immer stumm halten
      video.muted = true;
      video.volume = 0;
    };

    const handleError = (e: Event) => {
      console.error('Video error:', e);
      console.error('Video src:', video.src);
      console.error('Video currentSrc:', video.currentSrc);
    };

    const handleLoadedMetadata = () => {
      // Video-Metadaten geladen
    };

    const handleCanPlay = () => {
      if (!video.paused) return; // Video läuft bereits
      
      // Video starten (immer stumm)
      video.muted = true;
      video.volume = 0;
      video.play().catch(console.error);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [playCount]);


  return (
    <section className="relative py-16 md:py-32 overflow-hidden min-h-screen flex items-center">
      {/* Video Hintergrund - Chrome kompatibel */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{
          objectPosition: 'center center',
          minWidth: '100%',
          minHeight: '100%',
          width: '100%',
          height: '100%'
        }}
        preload="metadata"
        controls={false}
        aria-label="WebWelle Hintergrundvideo - Welle Animation"
      >
        <source src={videoSrc} type="video/mp4" />
        <track
          kind="captions"
          srcLang="de"
          label="Deutsche Untertitel"
          src="/captions/welle4-captions.vtt"
          default
        />
        Ihr Browser unterstützt das Video-Element nicht.
      </video>
      
      
      {/* Fallback Hintergrund Bild */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: '',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>
      
      {/* Overlay für bessere Lesbarkeit - nur unter den Texten */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 z-10"></div>
      
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Text mit halbtransparentem Hintergrund - Mobile optimiert */}
          <div className="bg-background/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-8 mb-6 md:mb-8 max-w-5xl mx-auto border border-border">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-extrabold text-foreground mb-4 md:mb-6 leading-tight tracking-tight">
              Ihre Website. Ihr Wachstum. Ihr Vorteil.
            </h1>
            <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-muted-foreground leading-relaxed font-light">
              Webdesign, das Kunden gewinnt – mit garantierter Performance und festen Preisen. 
              Erleben Sie, wie digitale Lösungen Ihre Sichtbarkeit steigern.
            </p>
          </div>
          
          <div className="bg-card rounded-xl md:rounded-2xl shadow-xl p-4 md:p-8 max-w-2xl mx-auto mb-6 md:mb-8 border border-border">
            <h2 className="text-lg md:text-2xl font-semibold text-primary mb-3 md:mb-4 tracking-wide">
              WebWelle – Ihre Erfolgswelle
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground mb-4 md:mb-6 font-medium">
              Festpreis-Webdesign, das messbar wirkt. Individuell. Transparent. Modern.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <a
                href="#cta"
                className="bg-primary text-primary-foreground px-6 md:px-8 py-3 md:py-4 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm md:text-lg text-center"
              >
                Jetzt Festpreis-Angebot sichern!
              </a>
              <a
                href="#produkte"
                className="border-2 border-primary text-primary px-6 md:px-8 py-3 md:py-4 rounded-lg hover:bg-primary/10 transition-colors font-semibold text-sm md:text-lg text-center"
              >
                Produkte entdecken
              </a>
            </div>
          </div>

          {/* Key Benefits - Mobile optimiert */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
            <div className="bg-card/95 backdrop-blur-sm rounded-lg p-4 md:p-6 shadow-xl border border-border">
              <div className="flex justify-center mb-2 md:mb-3">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">Top-Geschwindigkeit</h3>
              <p className="text-muted-foreground text-xs md:text-sm font-light">Beste Google-PageSpeed & sichtbar mehr Reichweite</p>
            </div>
            <div className="bg-card/95 backdrop-blur-sm rounded-lg p-4 md:p-6 shadow-xl border border-border">
              <div className="flex justify-center mb-2 md:mb-3">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">Transparente Preise</h3>
              <p className="text-muted-foreground text-xs md:text-sm font-light">Keine versteckten Kosten, Planungssicherheit vom ersten Tag</p>
            </div>
            <div className="bg-card/95 backdrop-blur-sm rounded-lg p-4 md:p-6 shadow-xl border border-border">
              <div className="flex justify-center mb-2 md:mb-3">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">Modernes Design</h3>
              <p className="text-muted-foreground text-xs md:text-sm font-light">Einzigartiges Design passend zum Unternehmen</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

