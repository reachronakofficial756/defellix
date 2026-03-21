// useAnimatedNumber.ts
import { useEffect, useRef, useState } from 'react';

export function useAnimatedNumber(target: number, duration = 700) {
  const [value, setValue] = useState(target);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(target);

  useEffect(() => {
    fromRef.current = value; // start from current displayed value
    startRef.current = null;

    let frameId: number;

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const progress = (timestamp - startRef.current) / duration;
      const clamped = Math.min(progress, 1);

      const from = fromRef.current;
      const to = target;
      const delta = to - from;

      // easeOutQuad for speed decrease
      const eased = 1 - (1 - clamped) * (1 - clamped);

      const current = from + delta * eased;
      setValue(Math.round(current));

      if (clamped < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return value;
}
