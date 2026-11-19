'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useScroll, useSpring, useTransform, type MotionStyle } from 'motion/react';

export function ScrollSection({ children, id }: { children: ReactNode; id?: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const { scrollYProgress, scrollY, scrollYLength } = useScroll({
    target: sectionRef,
    offset: ['start end', 'start 0.38'],
    trackContentSize: true,
  });
  const position = useTransform(
    [scrollYProgress, scrollY, scrollYLength],
    ([entry, scrollTop, scrollLength]: number[]) => scrollLength - scrollTop <= 2 ? 1 : entry
  );
  const progress = useSpring(position, { stiffness: 170, damping: 23, mass: 0.48, restDelta: 0.001 });

  // Keep server-rendered sections readable until the browser can measure scrolling.
  useEffect(() => setReady(true), []);

  return <motion.div id={id} ref={sectionRef} className="scroll-section"
    data-scroll-ready={ready ? 'true' : undefined} style={{ '--section-progress': progress } as MotionStyle}>
    <div className="scroll-section-body">{children}</div>
  </motion.div>;
}
