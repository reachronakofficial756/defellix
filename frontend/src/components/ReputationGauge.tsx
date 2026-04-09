import { useEffect, useMemo, useState } from "react";

export function ReputationGauge({
  score,
  animated,
  maxScale = 1000,
  idPrefix,
}: {
  score: number;
  animated: boolean;
  maxScale?: number;
  idPrefix?: string;
}) {
  const [normalized, setNormalized] = useState(0);

  const min = 0;
  const max = maxScale;

  useEffect(() => {
    if (animated) {
      const val = Math.max(0, Math.min(1, (score - min) / (max - min)));
      setNormalized(val);
    } else {
      setNormalized(0);
    }
  }, [animated, score, min, max]);

  const arcLength = 251.3; // Math.PI * 80
  const offset = arcLength - normalized * arcLength;
  const rotation = -90 + normalized * 180; // from -90 to +90

  const ids = useMemo(() => {
    if (!idPrefix) {
      return {
        progressGradient: "progressGradient",
        radialArcGlow: "radialArcGlow",
        hueGlow: "hueGlow",
        arrowShadow: "arrowShadow",
      };
    }
    return {
      progressGradient: `${idPrefix}-progressGradient`,
      radialArcGlow: `${idPrefix}-radialArcGlow`,
      hueGlow: `${idPrefix}-hueGlow`,
      arrowShadow: `${idPrefix}-arrowShadow`,
    };
  }, [idPrefix]);

  return (
    <div className="relative w-[320px] max-w-full mx-auto mt-4">
      <svg viewBox="0 0 200 120" className="w-full overflow-visible">
        <defs>
          <linearGradient id={ids.progressGradient} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000" />
            <stop offset="70%" stopColor="#3cb44f" />
            <stop offset="100%" stopColor="#2d8a3e" />
          </linearGradient>

          <filter id={ids.hueGlow} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.28 0
              "
              result="softGlow"
            />
            <feMerge>
              <feMergeNode in="softGlow" />
            </feMerge>
          </filter>

          <filter id={ids.arrowShadow} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>

        <path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke={`url(#${ids.radialArcGlow})`}
          strokeWidth="26"
          strokeLinecap="round"
          opacity="0.7"
        />

        <path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke={`url(#${ids.progressGradient})`}
          strokeWidth="22"
          strokeLinecap="round"
          filter={`url(#${ids.hueGlow})`}
          opacity={0.45}
          style={{
            strokeDasharray: arcLength,
            strokeDashoffset: offset,
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        <path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke={`url(#${ids.progressGradient})`}
          strokeWidth="20"
          strokeLinecap="round"
          style={{
            strokeDasharray: arcLength,
            strokeDashoffset: offset,
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        <g
          style={{
            transformOrigin: "100px 100px",
            transform: `rotate(${rotation}deg)`,
            transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <path
            d="M 100 80 L 88 108 L 100 100 L 112 108 Z"
            fill="#ffffff"
            opacity={0.9}
            filter={`url(#${ids.arrowShadow})`}
          />
        </g>
      </svg>
    </div>
  );
}

