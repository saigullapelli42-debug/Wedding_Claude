import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Coverflow3DProps {
  count: number;
  renderCard: (index: number, isActive: boolean) => React.ReactNode;
  cardWidth?: number;
  autoPlayMs?: number | null;
}

export function Coverflow3D({
  count,
  renderCard,
  cardWidth = 260,
  autoPlayMs = 4500,
}: Coverflow3DProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!autoPlayMs || paused || count <= 1) return;
    timerRef.current = setInterval(() => {
      setActive((a) => (a + 1) % count);
    }, autoPlayMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlayMs, paused, count]);

  if (count === 0) return null;

  function go(delta: number) {
    setActive((a) => (a + delta + count) % count);
  }

  // Render a window of cards around the active one so we don't mount all N
  // at once for large lists, while still supporting infinite wraparound.
  const visibleRange = 2;
  const offsets = Array.from({ length: visibleRange * 2 + 1 }, (_, i) => i - visibleRange);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="relative mx-auto flex items-center justify-center"
        style={{ height: cardWidth * 1.35, perspective: 1400 }}
      >
        {offsets.map((offset) => {
          const index = (active + offset + count) % count;
          const isActive = offset === 0;
          const absOffset = Math.abs(offset);
          return (
            <motion.div
              key={`${index}-${offset}`}
              className="absolute"
              style={{ width: cardWidth, zIndex: 10 - absOffset }}
              animate={{
                x: offset * (cardWidth * 0.62),
                scale: isActive ? 1 : 1 - absOffset * 0.18,
                rotateY: offset * -22,
                opacity: absOffset > visibleRange - 1 ? 0 : 1 - absOffset * 0.28,
                filter: isActive ? "blur(0px)" : "blur(0.5px)",
              }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              onClick={() => !isActive && setActive(index)}
            >
              {renderCard(index, isActive)}
            </motion.div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => go(-1)}
            className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 border border-brand-gold/30 grid place-items-center text-brand-gold hover:bg-brand-gold hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => go(1)}
            className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 border border-brand-gold/30 grid place-items-center text-brand-gold hover:bg-brand-gold hover:text-white transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="flex justify-center gap-1.5 mt-6">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to item ${i + 1}`}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? "w-5 bg-brand-gold" : "w-1.5 bg-brand-gold/30"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
