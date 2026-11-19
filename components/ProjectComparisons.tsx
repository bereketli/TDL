import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeftRight, Pause, Play } from 'lucide-react';
import dimensions from '@/data/image-dimensions.json';
import { projectImage, type Copy, type Language } from '@/lib/content';
import { localizedCopy, type Project } from '@/lib/site-content';
import { Media } from './Media';

const photoPairs = [
  {
    id: 'mesob-right', project: 'mesob', view: 'mesobRight',
    before: 'mesob-during-installation', after: 'mesob-after-installation',
    beforePosition: '50% 28%', afterPosition: '50% 24%',
  },
  {
    id: 'mesob-left', project: 'mesob', view: 'mesobLeft',
    before: 'mesob-left-during-installation', after: 'mesob-left-after-installation',
    beforePosition: '45% 23%', afterPosition: '40% 22%',
  },
  {
    id: 'olkai-entrance', project: 'olkai', view: 'olkaiEntrance',
    before: 'olkai-entrance-during-construction', after: 'olkai-entrance-after-construction',
    beforePosition: '50% 42%', afterPosition: '46% 50%',
  },
  {
    id: 'olkai-storefront', project: 'olkai', view: 'olkaiStorefront',
    before: 'olkai-storefront-during-construction', after: 'olkai-walkway',
    beforePosition: '55% 50%', afterPosition: '70% 56%',
  },
  {
    id: 'fuyat-street', project: 'fuyat', view: 'fuyatStreet',
    before: 'fuyat-street-during-installation', after: 'fuyat-street-after-installation',
    beforePosition: '50% 50%', afterPosition: '50% 32%',
  },
] as const satisfies ReadonlyArray<{
  id: string; project: string; view: keyof Copy['comparison']['views'];
  before: string; after: string; beforePosition: string; afterPosition: string;
}>;

const rotationDelay = 2000;
const imageSizes = '(max-width: 720px) calc(100vw - 24px), (max-width: 1520px) 95vw, 1440px';

export function getProjectComparisons(projects: Project[], language: Language) {
  return photoPairs.flatMap(pair => {
    const project = projects.find(item => item.id === pair.project);
    const beforeSrc = projectImage(pair.before);
    const afterSrc = projectImage(pair.after);
    if (!project || !Object.hasOwn(dimensions, beforeSrc) || !Object.hasOwn(dimensions, afterSrc)) return [];
    return [{ ...pair, name: localizedCopy(project.text, language).name, beforeSrc, afterSrc }];
  });
}

export function ProjectComparisons({ comparisons, copy }: {
  comparisons: ReturnType<typeof getProjectComparisons>;
  copy: Copy['comparison'];
}) {
  const [index, setIndex] = useState(0);
  const [before, setBefore] = useState(50);
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pointerDown, setPointerDown] = useState(false);
  const [keyboardComparing, setKeyboardComparing] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);
  const [loadedPhotos, setLoadedPhotos] = useState(() => new Set<string>());
  const frame = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);
  const count = comparisons.length;
  const active = index % count;
  const previous = (active + count - 1) % count;
  const next = (active + 1) % count;
  const current = comparisons[active];
  const upcoming = comparisons[next];
  const nextPairReady = loadedPhotos.has(upcoming.beforeSrc) && loadedPhotos.has(upcoming.afterSrc);
  const rotating = count > 1 && playing && !hovered && !pointerDown && !keyboardComparing &&
    inView && pageVisible && nextPairReady;

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPlaying(!motion.matches);
    const updateMotion = () => setPlaying(!motion.matches);
    motion.addEventListener?.('change', updateMotion);

    const updateVisibility = () => setPageVisible(!document.hidden);
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);

    const observer = typeof IntersectionObserver === 'undefined' ? null :
      new IntersectionObserver(([entry]) => setInView(entry.intersectionRatio >= 0.25), { threshold: 0.25 });
    if (!observer) setInView(true);
    else if (frame.current) observer.observe(frame.current);

    const clearPointer = () => {
      activePointer.current = null;
      setPointerDown(false);
    };
    const releasePointer = (event: PointerEvent) => {
      if (event.pointerId === activePointer.current) clearPointer();
    };
    const blurWindow = () => {
      clearPointer();
      setHovered(false);
    };
    window.addEventListener('pointerup', releasePointer, true);
    window.addEventListener('pointercancel', releasePointer, true);
    window.addEventListener('blur', blurWindow);
    return () => {
      motion.removeEventListener?.('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
      observer?.disconnect();
      window.removeEventListener('pointerup', releasePointer, true);
      window.removeEventListener('pointercancel', releasePointer, true);
      window.removeEventListener('blur', blurWindow);
    };
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => {
      setBefore(50);
      setIndex(next);
    }, rotationDelay);
    return () => window.clearTimeout(timer);
  }, [rotating, next]);

  function showSlide(slide: number) {
    setBefore(50);
    setIndex(slide);
  }

  function markPhotoLoaded(src: string) {
    setLoadedPhotos(loaded => loaded.has(src) ? loaded : new Set([...loaded, src]));
  }

  return <section id="before-after" className="project-comparisons section-pad" aria-labelledby="comparison-heading">
    <div className="section-heading reveal">
      <div><h2 id="comparison-heading">{copy.title}</h2></div>
      <p id="comparison-instructions">{copy.instructions}</p>
    </div>
    <figure className="comparison-figure reveal"
      onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true); }}
      onPointerLeave={event => { if (event.pointerType === 'mouse') setHovered(false); }}
      onPointerDown={event => {
        if (!event.isPrimary) return;
        activePointer.current = event.pointerId;
        setKeyboardComparing(false);
        setPointerDown(true);
      }}>
      <figcaption className="comparison-toolbar">
        <div id="comparison-project" aria-live={rotating ? 'off' : 'polite'} aria-atomic="true">
          <h3>{current.name}</h3>
          <p>{copy.views[current.view]}</p>
        </div>
        {count > 1 && <div className="comparison-controls">
          <button type="button" className="icon" aria-label={playing ? copy.pause : copy.play}
            aria-controls="project-comparison" onClick={() => setPlaying(value => !value)}>
            {playing ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
          </button>
          <button type="button" className="icon" aria-label={copy.previous} aria-controls="project-comparison"
            onClick={() => showSlide(previous)}><ChevronLeft size={20} aria-hidden="true" /></button>
          <span className="comparison-count" aria-hidden="true">{active + 1} / {count}</span>
          <button type="button" className="icon" aria-label={copy.next} aria-controls="project-comparison"
            onClick={() => showSlide(next)}><ChevronRight size={20} aria-hidden="true" /></button>
        </div>}
      </figcaption>
      <div id="project-comparison" ref={frame} className="comparison-slider"
        style={{ '--split': `${before}%` } as CSSProperties}>
        {comparisons.map((pair, position) => (position === active || position === previous || position === next) &&
          <div key={pair.id} className="comparison-photos" data-active={position === active} aria-hidden={position !== active}>
            <Media src={pair.afterSrc} alt={`${pair.name}, ${copy.views[pair.view]}, ${copy.after}`}
              sizes={imageSizes} style={{ objectPosition: pair.afterPosition }} draggable={false}
              onLoad={() => markPhotoLoaded(pair.afterSrc)} />
            <Media src={pair.beforeSrc} alt={`${pair.name}, ${copy.views[pair.view]}, ${copy.before}`}
              className="comparison-before" sizes={imageSizes} style={{ objectPosition: pair.beforePosition }} draggable={false}
              onLoad={() => markPhotoLoaded(pair.beforeSrc)} />
          </div>)}
        <span className="comparison-label comparison-label-before" data-visible={before >= 24} aria-hidden="true">{copy.before}</span>
        <span className="comparison-label comparison-label-after" data-visible={before <= 76} aria-hidden="true">{copy.after}</span>
        <input className="comparison-range" type="range" min={0} max={100} value={before}
          onFocus={event => { if (activePointer.current === null && event.currentTarget.matches(':focus-visible')) setKeyboardComparing(true); }}
          onBlur={() => setKeyboardComparing(false)}
          onKeyDown={() => setKeyboardComparing(true)}
          onChange={event => setBefore(event.currentTarget.valueAsNumber)}
          aria-label={copy.slider} aria-describedby="comparison-project comparison-instructions"
          aria-valuetext={copy.value.replace('{before}', String(before)).replace('{after}', String(100 - before))} />
        <span className="comparison-handle" aria-hidden="true"><ChevronsLeftRight size={25} strokeWidth={2} /></span>
        <div className="comparison-line" aria-hidden="true" />
      </div>
    </figure>
  </section>;
}
