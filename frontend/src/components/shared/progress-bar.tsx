'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setProgress(0);
    setVisible(true);
    startTimeRef.current = performance.now();

    function animate() {
      const elapsed = performance.now() - startTimeRef.current;
      const duration = 800;
      const pct = Math.min(elapsed / duration, 1);
      setProgress(easeOutCubic(pct) * 70);
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setProgress(70);
      }
    }

    rafRef.current = requestAnimationFrame(animate);

    const completeTimer = setTimeout(() => {
      setProgress(100);
    }, 400);

    const hideTimer = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 600);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(completeTimer);
      clearTimeout(hideTimer);
    };
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed left-0 top-0 z-[100] h-[3px] w-full" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-primary transition-[width] duration-75 ease-linear will-change-transform" style={{ width: `${progress}%` }}>
        <div className="absolute right-0 top-0 h-full w-[100px] bg-gradient-to-r from-transparent to-primary/40" />
      </div>
    </div>
  );
}

export function ProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
