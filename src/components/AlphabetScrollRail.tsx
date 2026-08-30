import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AlphabetScrollRailProps {
  availableLetters: Set<string>;
  activeLetter: string;
  onSelectLetter: (letter: string, isInstant?: boolean) => void;
  letterCounts: Record<string, number>;
}

const ALPHABET = [
  '#',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

export const AlphabetScrollRail: React.FC<AlphabetScrollRailProps> = ({
  availableLetters,
  activeLetter,
  onSelectLetter,
  letterCounts,
}) => {
  const [scrubLetter, setScrubLetter] = useState<string | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const railRef = useRef<HTMLDivElement>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrubbedRef = useRef<string | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const showIndicator = useCallback((letter: string) => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    setScrubLetter(letter);
    dismissTimerRef.current = setTimeout(() => {
      setScrubLetter(null);
    }, 450);
  }, []);

  const handleSelect = useCallback(
    (targetLetter: string, isInstant: boolean = false) => {
      if (!availableLetters.has(targetLetter)) return;
      if (lastScrubbedRef.current === targetLetter) return;
      lastScrubbedRef.current = targetLetter;
      showIndicator(targetLetter);
      onSelectLetter(targetLetter, isInstant);
    },
    [availableLetters, onSelectLetter, showIndicator]
  );

  // Exact letter determination based on cursor/touch Y position on the rail
  const processPosition = useCallback(
    (clientY: number, isInstant: boolean) => {
      if (!railRef.current) return;
      const rect = railRef.current.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      const percent = Math.max(0, Math.min(0.999, relativeY / rect.height));
      const index = Math.floor(percent * ALPHABET.length);
      const letter = ALPHABET[index];

      if (letter && availableLetters.has(letter)) {
        handleSelect(letter, isInstant);
      }
    },
    [availableLetters, handleSelect]
  );

  // Pointer down (single click or start of drag)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = true;
    lastScrubbedRef.current = null;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    processPosition(e.clientY, false);
  };

  // Throttled 120 FPS pointer move on drag
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    const clientY = e.clientY;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      processPosition(clientY, true);
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = false;
    lastScrubbedRef.current = null;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // safe fallback
    }
  };

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <aside
      aria-label="Alphabetical Project Jump Navigation"
      className="fixed right-1.5 sm:right-3 md:right-5 top-1/2 -translate-y-1/2 z-40 select-none flex items-center touch-none"
    >
      {/* Single Floating Animated Bubble Indicator */}
      <AnimatePresence mode="wait">
        {scrubLetter && (
          <motion.div
            key="alphabet-popup-bubble"
            initial={{ opacity: 0, scale: 0.7, x: 8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 4, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 700, damping: 32 }}
            className="absolute right-9 sm:right-11 pointer-events-none flex items-center will-change-transform"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#f95700] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(249,87,0,0.5)] border border-white/20">
              <span className="text-2xl font-black font-mono leading-none select-none">
                {scrubLetter}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alphabet Index Rail Liquid Glass Ultra-Slim Container */}
      <div
        ref={railRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative overflow-hidden w-6 sm:w-7 bg-white/[0.08] dark:bg-white/[0.04] backdrop-blur-xl border border-white/30 dark:border-white/10 py-2.5 px-0.5 rounded-full shadow-[0_4px_20px_0_rgba(0,0,0,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.4)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col items-center justify-between cursor-pointer touch-none select-none"
        style={{ maxHeight: 'calc(100vh - 120px)' }}
      >
        {/* Liquid Glass Top Gloss Subtle Reflection */}
        <div className="absolute top-0 inset-x-0 h-1/4 bg-gradient-to-b from-white/25 to-transparent dark:from-white/[0.08] pointer-events-none rounded-t-full" />
        {ALPHABET.map((letter) => {
          const isAvailable = availableLetters.has(letter);
          const isActive = activeLetter === letter;
          const count = letterCounts[letter] || 0;

          return (
            <button
              key={letter}
              type="button"
              id={`alphabet-jump-${letter}`}
              disabled={!isAvailable}
              aria-label={`Jump to letter ${letter}, ${count} projects available`}
              className={`relative w-4.5 h-3.5 sm:w-5 sm:h-4 flex items-center justify-center text-[9px] sm:text-[10px] font-bold font-mono rounded-full transition-colors duration-150 cursor-pointer group ${
                !isAvailable
                  ? 'text-[var(--text-muted)] opacity-20 cursor-default pointer-events-none'
                  : isActive
                  ? 'bg-[#f95700] text-white font-black shadow-[0_2px_8px_rgba(249,87,0,0.45)] scale-110'
                  : 'text-[var(--text-secondary)] hover:text-[#f95700] hover:scale-115'
              }`}
            >
              {/* Letter character */}
              <span className="relative z-10">{letter}</span>

              {/* Dot indicator for available letter when not active */}
              {isAvailable && !isActive && (
                <span className="absolute -right-0.5 w-1 h-1 rounded-full bg-[#f95700]/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

