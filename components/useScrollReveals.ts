import { useEffect } from 'react';

const revealSelector = '.reveal';
const viewportInset = 28;

export function useScrollReveals() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.revealState = 'shown';
        observer.unobserve(entry.target);
      }
    }, { rootMargin: `0px 0px -${viewportInset}px 0px` });

    function watch(element: HTMLElement) {
      if (element.dataset.revealState === 'shown') return;
      element.dataset.revealState = 'pending';
      observer.observe(element);
    }

    // Read each position before adding animation states. Keep visible server content readable.
    const waiting = Array.from(document.querySelectorAll<HTMLElement>(revealSelector)).filter(element => {
      const bounds = element.getBoundingClientRect();
      return element.dataset.revealState === 'pending' || bounds.bottom <= 0 || bounds.top >= window.innerHeight - viewportInset;
    });
    waiting.forEach(watch);

    // Gallery filters and translated extra content can insert new targets after startup.
    const mutations = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement) || !node.isConnected) continue;
          if (node.matches(revealSelector)) watch(node);
          node.querySelectorAll<HTMLElement>(revealSelector).forEach(element => watch(element));
        }
        for (const node of record.removedNodes) {
          if (!(node instanceof HTMLElement) || node.isConnected) continue;
          if (node.matches(revealSelector)) observer.unobserve(node);
          node.querySelectorAll(revealSelector).forEach(element => observer.unobserve(element));
        }
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);
}
