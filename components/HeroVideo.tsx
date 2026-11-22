import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

const videoUrl = '/videos/facade-animation.mp4';
const startTime = 0.15;
const playbackSpeed = 0.75;

function playVideo(video: HTMLVideoElement) {
  if (video.seeking || video.currentTime < startTime) return;

  // If autoplay is blocked, the still and the play control remain available.
  void video.play().catch(() => {});
}

export function HeroVideo({ playLabel, pauseLabel }: { playLabel: string; pauseLabel: string }) {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pausedByVisitor = useRef(false);
  const [allowMotion, setAllowMotion] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [inView, setInView] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [frameVisible, setFrameVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const enabled = allowMotion && hasEntered && !failed;

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {
      setAllowMotion(!motion.matches);
      if (motion.matches) {
        setPlaying(false);
        setFrameVisible(false);
      }
    };
    updateMotion();
    motion.addEventListener?.('change', updateMotion);

    const background = backgroundRef.current;
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting) setHasEntered(true);
    });
    if (observer && background) observer.observe(background);
    else {
      setInView(true);
      setHasEntered(true);
    }
    return () => {
      motion.removeEventListener?.('change', updateMotion);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video?.readyState) return;
    if (inView && !pausedByVisitor.current) playVideo(video);
    else video.pause();
  }, [inView]);

  function startFromBeginning(video: HTMLVideoElement) {
    video.defaultMuted = true;
    video.muted = true;
    video.defaultPlaybackRate = playbackSpeed;
    video.playbackRate = playbackSpeed;
    video.currentTime = startTime;
  }

  function resumeAfterSeek(video: HTMLVideoElement) {
    if (inView && !pausedByVisitor.current) playVideo(video);
  }

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    pausedByVisitor.current = !video.paused;
    if (pausedByVisitor.current) video.pause();
    else playVideo(video);
  }

  function handlePlaying(video: HTMLVideoElement) {
    setPlaying(true);
    if (frameVisible) return;

    if (typeof video.requestVideoFrameCallback === 'function') {
      video.requestVideoFrameCallback(() => {
        if (videoRef.current === video && !video.seeking) setFrameVisible(true);
      });
    } else {
      setFrameVisible(true);
    }
  }

  return <>
    <div className="hero-background" ref={backgroundRef} aria-hidden="true">
      {enabled && <video ref={videoRef} src={videoUrl} muted playsInline preload="auto"
        data-frame-visible={frameVisible} onLoadedMetadata={event => startFromBeginning(event.currentTarget)}
        onSeeked={event => resumeAfterSeek(event.currentTarget)}
        onEnded={event => startFromBeginning(event.currentTarget)} onPlaying={event => handlePlaying(event.currentTarget)}
        onPause={() => setPlaying(false)} onError={() => setFailed(true)} />}
    </div>
    {enabled && <button type="button" className="hero-video-toggle icon"
      aria-label={playing ? pauseLabel : playLabel} onClick={togglePlayback}>
      {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
    </button>}
  </>;
}
