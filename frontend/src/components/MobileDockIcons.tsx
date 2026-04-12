import { cn } from "@/lib/utils";
import type { HTMLMotionProps, Variants } from "motion/react";
import { motion, useAnimation, useReducedMotion } from "motion/react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

export interface HouseHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface HouseProps extends HTMLMotionProps<"div"> {
  size?: number;
  duration?: number;
  isAnimated?: boolean;
}

export const HouseIcon = forwardRef<HouseHandle, HouseProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 24, duration = 1, isAnimated = true, ...props }, ref) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);

    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return {
        startAnimation: () => (reduced ? controls.start("normal") : controls.start("animate")),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleEnter = useCallback(
      (e?: React.MouseEvent<HTMLDivElement>) => {
        if (!isAnimated || reduced) return;
        if (!isControlled.current) controls.start("animate");
        else onMouseEnter?.(e as any);
      },
      [controls, reduced, isAnimated, onMouseEnter]
    );

    const handleLeave = useCallback(
      (e?: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlled.current) controls.start("normal");
        else onMouseLeave?.(e as any);
      },
      [controls, onMouseLeave]
    );

    const baseVariants: Variants = {
      normal: { opacity: 1 },
      animate: { opacity: 0.65, transition: { duration: 0.2 * duration, ease: "easeOut" } },
    };

    const doorVariants: Variants = {
      normal: { opacity: 1 },
      animate: { opacity: [1, 0.4, 1], transition: { duration: 0.35 * duration, ease: "easeInOut" } },
    };

    return (
      <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
        <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" animate={controls} initial="normal">
          <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10" />
          <motion.path d="M21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9" variants={baseVariants} />
          <motion.path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" variants={doorVariants} />
        </motion.svg>
      </motion.div>
    );
  }
);
HouseIcon.displayName = "HouseIcon";

export const FolderOpenIcon = forwardRef<any, HTMLMotionProps<"div"> & { size?: number; duration?: number; isAnimated?: boolean }>(
  ({ onMouseEnter, onMouseLeave, className, size = 24, duration = 1, isAnimated = true, ...props }, ref) => {
    const folderControls = useAnimation();
    const paperControls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);

    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return {
        startAnimation: () => {
          if (reduced) {
            folderControls.start("normal");
            paperControls.start("normal");
          } else {
            folderControls.start("animate");
            paperControls.start("animate");
          }
        },
        stopAnimation: () => {
          folderControls.start("normal");
          paperControls.start("normal");
        },
      };
    });

    const handleEnter = useCallback((e?: React.MouseEvent<HTMLDivElement>) => {
      if (!isAnimated || reduced) return;
      if (!isControlled.current) {
        folderControls.start("animate");
        paperControls.start("animate");
      } else onMouseEnter?.(e as any);
    }, [folderControls, paperControls, reduced, onMouseEnter, isAnimated]);

    const handleLeave = useCallback((e?: React.MouseEvent<HTMLDivElement>) => {
      if (!isControlled.current) {
        folderControls.start("normal");
        paperControls.start("normal");
      } else onMouseLeave?.(e as any);
    }, [folderControls, paperControls, onMouseLeave]);

    const folderVariants: Variants = {
      normal: { scale: 1, rotate: 0, y: 0 },
      animate: { scale: [1, 1.05, 0.97, 1], rotate: [0, -2, 2, 0], y: [0, -1.5, 0.5, 0], transition: { duration: 0.9 * duration, ease: "easeInOut" } },
    };

    const paperVariants: Variants = {
      normal: { y: 0, opacity: 0 },
      animate: { y: [-6, 0], opacity: [0, 1, 0], transition: { duration: 1 * duration, ease: "easeInOut", delay: 0.2 } },
    };

    return (
      <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
        <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <motion.path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" animate={folderControls} initial="normal" variants={folderVariants} />
          <motion.rect x="7" y="11" width="10" height="6" rx="1" animate={paperControls} initial="normal" variants={paperVariants} />
        </motion.svg>
      </motion.div>
    );
  }
);
FolderOpenIcon.displayName = "FolderOpenIcon";

export const BellRingIcon = forwardRef<any, HTMLMotionProps<"div"> & { size?: number; duration?: number; isAnimated?: boolean }>(
  ({ onMouseEnter, onMouseLeave, className, size = 24, duration = 1, isAnimated = true, ...props }, ref) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);
    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return { startAnimation: () => (reduced ? controls.start("normal") : controls.start("animate")), stopAnimation: () => controls.start("normal") };
    });

    const handleEnter = useCallback((e?: React.MouseEvent<HTMLDivElement>) => {
      if (!isAnimated || reduced) return;
      if (!isControlled.current) controls.start("animate");
      else onMouseEnter?.(e as any);
    }, [controls, reduced, isAnimated, onMouseEnter]);

    const handleLeave = useCallback((e?: React.MouseEvent<HTMLDivElement>) => {
      if (!isControlled.current) controls.start("normal");
      else onMouseLeave?.(e as any);
    }, [controls, onMouseLeave]);

    const bellVariants: Variants = { normal: { rotate: 0 }, animate: { rotate: [0, -15, 13, -9, 6, -3, 0], transition: { duration: 1.4 * duration, ease: "easeInOut", repeat: 0 } } };
    const clapperVariants: Variants = { normal: { x: 0 }, animate: { x: [0, -3, 3, -2, 2, 0], transition: { duration: 1.4 * duration, ease: "easeInOut", repeat: 0 } } };
    const waveVariants: Variants = { normal: { opacity: 1 }, animate: { opacity: [1, 0.4, 1], transition: { duration: 1.4 * duration, repeat: 0, ease: "easeInOut" } } };

    return (
      <motion.div className={cn("relative inline-flex", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
        <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" animate={controls} initial="normal" variants={bellVariants}>
          <motion.path d="M10.268 21a2 2 0 0 0 3.464 0" variants={clapperVariants} />
          <motion.path d="M22 8c0-2.3-.8-4.3-2-6" variants={waveVariants} />
          <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
          <motion.path d="M4 2C2.8 3.7 2 5.7 2 8" variants={waveVariants} />
        </motion.svg>
      </motion.div>
    );
  }
);
BellRingIcon.displayName = "BellRingIcon";

export const ListChevronsUpDownIcon = forwardRef<any, HTMLMotionProps<"div"> & { size?: number; duration?: number; isAnimated?: boolean }>(
  ({ onMouseEnter, onMouseLeave, className, size = 24, duration = 0.9, isAnimated = true, ...props }, ref) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);
    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return { startAnimation: () => (reduced ? controls.start("normal") : controls.start("animate")), stopAnimation: () => controls.start("normal") };
    });

    const handleEnter = useCallback((e?: React.MouseEvent<HTMLDivElement>) => {
      if (!isAnimated || reduced) return;
      if (!isControlled.current) controls.start("animate");
      else onMouseEnter?.(e as any);
    }, [controls, reduced, isAnimated, onMouseEnter]);

    const handleLeave = useCallback((e?: React.MouseEvent<HTMLDivElement>) => {
      if (!isControlled.current) controls.start("normal");
      else onMouseLeave?.(e as any);
    }, [controls, onMouseLeave]);

    const lineVariant: Variants = { normal: { x: 0, opacity: 1 }, animate: { x: [0, -2, 2, 0], opacity: [1, 0.9, 0.9, 1], transition: { duration: 0.75 * duration, ease: "easeInOut", repeat: 0 } } };
    const topChevron: Variants = { normal: { y: 0, opacity: 1, rotate: 0 }, animate: { y: [0, -4, -2, 0], rotate: [0, -4, -2, 0], opacity: [1, 0.9, 0.95, 1], transition: { duration: 0.9 * duration, ease: "easeOut", repeat: 0, delay: 0.04 } } };
    const bottomChevron: Variants = { normal: { y: 0, opacity: 1, rotate: 0 }, animate: { y: [0, 4, 2, 0], rotate: [0, 4, 2, 0], opacity: [1, 0.9, 0.95, 1], transition: { duration: 0.9 * duration, ease: "easeOut", repeat: 0, delay: 0.12 } } };

    return (
      <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
        <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" animate={controls} initial="normal">
          <motion.path d="M3 5h8" variants={lineVariant} stroke="currentColor" />
          <motion.path d="M3 12h8" variants={lineVariant} stroke="currentColor" transition={{ delay: 0.06 }} />
          <motion.path d="M3 19h8" variants={lineVariant} stroke="currentColor" transition={{ delay: 0.12 }} />
          <motion.path d="m15 8 3-3 3 3" variants={topChevron} stroke="currentColor" />
          <motion.path d="m15 16 3 3 3-3" variants={bottomChevron} stroke="currentColor" />
        </motion.svg>
      </motion.div>
    );
  }
);
ListChevronsUpDownIcon.displayName = "ListChevronsUpDownIcon";

export const UserRoundIcon = forwardRef<any, HTMLMotionProps<"div"> & { size?: number; duration?: number; isAnimated?: boolean }>(
  ({ onMouseEnter, onMouseLeave, className, size = 24, duration = 1, isAnimated = true, ...props }, ref) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);

    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return { startAnimation: () => controls.start("animate"), stopAnimation: () => controls.start("normal") };
    });

    const handleEnter = useCallback((e?: React.MouseEvent<HTMLDivElement>) => {
      if (!isAnimated || reduced) return;
      if (!isControlled.current) controls.start("animate");
      else onMouseEnter?.(e as any);
    }, [controls, reduced, isAnimated, onMouseEnter]);

    const handleLeave = useCallback((e?: React.MouseEvent<HTMLDivElement>) => {
      if (!isControlled.current) controls.start("normal");
      else onMouseLeave?.(e as any);
    }, [controls, onMouseLeave]);

    const curveVariants: Variants = { normal: { strokeDashoffset: 0, opacity: 1 }, animate: { strokeDashoffset: [40, 0], opacity: [0.3, 1], transition: { duration: 0.6 * duration, delay: 0.3, ease: "easeInOut" } } };
    const headVariants: Variants = { normal: { scale: 1, opacity: 1 }, animate: { scale: [0.5, 1.2, 1], opacity: [0, 1], transition: { duration: 0.6 * duration, ease: "easeOut" } } };

    return (
      <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
        <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <motion.circle cx="12" cy="8" r="5" variants={headVariants} initial="normal" animate={controls} />
          <motion.path d="M20 21a8 8 0 0 0-16 0" strokeDasharray="40" strokeDashoffset="0" variants={curveVariants} initial="normal" animate={controls} />
        </motion.svg>
      </motion.div>
    );
  }
);
UserRoundIcon.displayName = "UserRoundIcon";

export const LogoutIcon = forwardRef<any, HTMLMotionProps<"div"> & { size?: number; duration?: number; isAnimated?: boolean }>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, duration = 1, isAnimated = true, ...props }, ref) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);
    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return { startAnimation: () => (reduced ? controls.start("normal") : controls.start("animate")), stopAnimation: () => controls.start("normal") };
    });

    const handleEnter = useCallback((e?: React.MouseEvent<HTMLDivElement>) => {
      if (!isAnimated || reduced) return;
      if (!isControlled.current) controls.start("animate");
      else onMouseEnter?.(e as any);
    }, [controls, reduced, isAnimated, onMouseEnter]);

    const handleLeave = useCallback((e?: React.MouseEvent<HTMLDivElement>) => {
      if (!isControlled.current) controls.start("normal");
      else onMouseLeave?.(e as any);
    }, [controls, onMouseLeave]);

    const iconVariants: Variants = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.1, 0.95, 1], rotate: [0, 3, -2, 0], transition: { duration: 0.9 * duration, ease: "easeInOut" } } };
    const arrowVariants: Variants = { normal: { x: 0, opacity: 1 }, animate: { x: [8, -2, 0], opacity: [0, 1, 1], transition: { duration: 0.6 * duration, ease: "easeOut" } } };
    const doorVariants: Variants = { normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 0.7 * duration, ease: "easeInOut", delay: 0.1 } } };

    return (
      <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
        <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" animate={controls} initial="normal" variants={iconVariants}>
          <motion.path d="m16 17 5-5-5-5" variants={arrowVariants} />
          <motion.path d="M21 12H9" variants={arrowVariants} />
          <motion.path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" variants={doorVariants} />
        </motion.svg>
      </motion.div>
    );
  }
);
LogoutIcon.displayName = "LogoutIcon";

export const PlusIcon = forwardRef<any, HTMLMotionProps<"div"> & { size?: number; duration?: number; isAnimated?: boolean }>(
  ({ onMouseEnter, onMouseLeave, className, size = 24, duration = 1, isAnimated = true, ...props }, ref) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);

    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return { startAnimation: () => (reduced ? controls.start("normal") : controls.start("animate")), stopAnimation: () => controls.start("normal") };
    });

    const handleEnter = useCallback((e?: React.MouseEvent<HTMLDivElement>) => {
      if (!isAnimated || reduced) return;
      if (!isControlled.current) controls.start("animate");
      else onMouseEnter?.(e as any);
    }, [controls, reduced, isAnimated, onMouseEnter]);

    const handleLeave = useCallback((e?: React.MouseEvent<HTMLDivElement>) => {
      if (!isControlled.current) controls.start("normal");
      else onMouseLeave?.(e as any);
    }, [controls, onMouseLeave]);

    const plusVariants: Variants = { normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.2, 0.85, 1], rotate: [0, 10, -10, 0], transition: { duration: 1 * duration, ease: "easeInOut", repeat: 0 } } };
    const lineVariants: Variants = { normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: 1, transition: { duration: 0.6 * duration, ease: "easeInOut", repeat: 0, repeatDelay: 0.4 } } };

    return (
      <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
        <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" animate={controls} initial="normal" variants={plusVariants}>
          <motion.path d="M5 12h14" variants={lineVariants} />
          <motion.path d="M12 5v14" variants={lineVariants} />
        </motion.svg>
      </motion.div>
    );
  }
);
PlusIcon.displayName = "PlusIcon";

