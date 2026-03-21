// Score.tsx
'use client';

import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

type ScoreProps = {
    displayScore: number;
};

export function Score({ displayScore }: ScoreProps) {
    const animatedValue = useAnimatedNumber(displayScore, 700); // 700ms animation
    const str = String(animatedValue);

    return (
        <h1 className="text-[80px] font-bold text-white tracking-tighter leading-none">
            {str.split('').map((digit, idx) => (
                <span key={idx} className="inline-block">
                    {digit}
                </span>
            ))}
        </h1>
    );
}
