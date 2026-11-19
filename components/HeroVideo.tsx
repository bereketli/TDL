import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

const videoUrl = '/videos/facade-animation.mp4';
const startTime = 0.1;
const playbackSpeed = 0.75;

function playVideo(video: HTMLVideoElement) {
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
  const [failed, setFailed] = useState(false);
  const enabled = allowMotion && hasEntered && !failed;

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {
      setAllowMotion(!motion.matches);
      if (motion.matches) setPlaying(false);
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
    if (inView && !pausedByVisitor.current) playVideo(video);
  }

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    pausedByVisitor.current = !video.paused;
    if (pausedByVisitor.current) video.pause();
    else playVideo(video);
  }

  return <>
    <div className="hero-background" ref={backgroundRef} aria-hidden="true">
      {enabled && <video ref={videoRef} src={videoUrl} muted playsInline preload="auto"
        poster="/videos/facade-animation.webp" onLoadedMetadata={event => startFromBeginning(event.currentTarget)}
        onEnded={event => startFromBeginning(event.currentTarget)} onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)} onError={() => setFailed(true)} />}
    </div>
    {enabled && <button type="button" className="hero-video-toggle icon"
      aria-label={playing ? pauseLabel : playLabel} onClick={togglePlayback}>
      {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
    </button>}
  </>;
}
