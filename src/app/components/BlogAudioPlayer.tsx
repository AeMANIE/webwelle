'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2 } from 'lucide-react';

const PLAYBACK_SPEEDS = [1, 1.5, 2] as const;
type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

interface BlogAudioPlayerProps {
  audioUrl: string;
  title: string;
  durationHintMinutes?: number;
}

function formatSpeedLabel(speed: PlaybackSpeed): string {
  return speed === 1 ? '1×' : `${speed.toString().replace('.', ',')}×`;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function BlogAudioPlayer({
  audioUrl,
  title,
  durationHintMinutes,
}: BlogAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = playbackSpeed;
  }, [playbackSpeed, audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setReady(true);
    };
    const onEnded = () => setIsPlaying(false);
    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
    };
  }, [audioUrl]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
    } else {
      audio.pause();
    }
  }, []);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;
      const value = Number(e.target.value);
      audio.currentTime = (value / 100) * duration;
      setCurrentTime(audio.currentTime);
    },
    [duration],
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const durationLabel =
    ready && duration > 0
      ? formatTime(duration)
      : durationHintMinutes
        ? `ca. ${durationHintMinutes} Min`
        : '';

  return (
    <div
      className="mb-8 rounded-xl border border-border bg-card/80 p-4 shadow-sm"
      role="region"
      aria-label="Artikel anhören"
    >
      <audio ref={audioRef} preload="metadata" src={audioUrl} title={title} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
          aria-label={isPlaying ? 'Pause' : 'Artikel anhören'}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground">
            <Volume2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>Artikel anhören</span>
            {durationLabel && (
              <span className="text-muted-foreground font-normal">· {durationLabel}</span>
            )}
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            onChange={handleSeek}
            disabled={!ready || !duration}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Wiedergabefortschritt"
          />

          {ready && duration > 0 && (
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          )}
        </div>

        <div
          className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-muted/40 p-1"
          role="group"
          aria-label="Wiedergabegeschwindigkeit"
        >
          {PLAYBACK_SPEEDS.map((speed) => {
            const active = playbackSpeed === speed;
            return (
              <button
                key={speed}
                type="button"
                onClick={() => setPlaybackSpeed(speed)}
                className={`min-w-[2.5rem] rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                aria-pressed={active}
                aria-label={`${formatSpeedLabel(speed)} Geschwindigkeit`}
              >
                {formatSpeedLabel(speed)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
