import { useEffect, type RefObject } from 'react';

const fineMotion = '(any-hover: hover) and (any-pointer: fine) and (prefers-reduced-motion: no-preference)';

function setLight(element: HTMLElement, prefix: 'surface' | 'card', x: number, y: number) {
  const bounds = element.getBoundingClientRect();
  const unitX = Math.min(1, Math.max(0, (x - bounds.left) / Math.max(1, bounds.width)));
  const unitY = Math.min(1, Math.max(0, (y - bounds.top) / Math.max(1, bounds.height)));
  element.style.setProperty(`--${prefix}-x`, String(2 * unitX - 1));
  element.style.setProperty(`--${prefix}-y`, String(2 * unitY - 1));
}

export function useDepthLighting(
  pageRef: RefObject<HTMLDivElement | null>,
  lightRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const page = pageRef.current;
    const light = lightRef.current;
    if (!page || !light) return;

    const preference = window.matchMedia(fineMotion);
    let point: { x: number; y: number } | null = null;
    let region: HTMLElement | null = null;
    let card: HTMLElement | null = null;
    let frame = 0;

    function select(previous: HTMLElement | null, next: HTMLElement | null) {
      if (previous !== next) {
        previous?.removeAttribute('data-lit');
        next?.setAttribute('data-lit', '');
      }
      return next;
    }

    function paint() {
      frame = 0;
      if (!point || !light || !page) return;
      const { x, y } = point;
      const hit = document.elementFromPoint(x, y);
      const target = hit && page.contains(hit) ? hit : null;
      region = select(region, target?.closest<HTMLElement>('[data-light-region]') ?? null);
      card = select(card, target?.closest<HTMLElement>('[data-depth-card]') ?? null);
      if (region) setLight(region, 'surface', x, y);
      if (card) setLight(card, 'card', x, y);
      light.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      light.toggleAttribute('data-lit', !!target);
    }

    function queuePaint() {
      if (point && !frame) frame = requestAnimationFrame(paint);
    }

    function reset() {
      point = null;
      cancelAnimationFrame(frame);
      frame = 0;
      region = select(region, null);
      card = select(card, null);
      light?.removeAttribute('data-lit');
    }

    function move(event: PointerEvent) {
      if (!preference.matches || event.pointerType !== 'mouse') {
        if (point) reset();
        return;
      }
      point = { x: event.clientX, y: event.clientY };
      queuePaint();
    }

    page.addEventListener('pointermove', move, { passive: true });
    page.addEventListener('pointerleave', reset);
    window.addEventListener('scroll', queuePaint, { passive: true });
    window.addEventListener('blur', reset);
    preference.addEventListener('change', reset);
    return () => {
      reset();
      page.removeEventListener('pointermove', move);
      page.removeEventListener('pointerleave', reset);
      window.removeEventListener('scroll', queuePaint);
      window.removeEventListener('blur', reset);
      preference.removeEventListener('change', reset);
    };
  }, [pageRef, lightRef]);
}
