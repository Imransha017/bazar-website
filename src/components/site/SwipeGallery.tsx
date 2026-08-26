import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  children: ReactNode;
  count: number;
  index: number;
  onChange: (i: number) => void;
  className?: string;
  showArrows?: boolean;
};

/**
 * Wraps the main product media area and enables swipe (touch/mouse drag)
 * plus optional arrow buttons to move between images.
 */
export function SwipeGallery({ children, count, index, onChange, className, showArrows = true }: Props) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);

  const go = (dir: 1 | -1) => {
    if (count < 2) return;
    onChange((index + dir + count) % count);
  };

  const begin = (x: number, y: number) => {
    start.current = { x, y };
    dragging.current = true;
  };

  const end = (x: number, y: number) => {
    if (!dragging.current || !start.current) return;
    const dx = x - start.current.x;
    const dy = y - start.current.y;
    dragging.current = false;
    start.current = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  return (
    <div
      className={className}
      onTouchStart={(e) => begin(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={(e) => end(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
      onPointerDown={(e) => { if (e.pointerType === "mouse") begin(e.clientX, e.clientY); }}
      onPointerUp={(e) => { if (e.pointerType === "mouse") end(e.clientX, e.clientY); }}
      onPointerLeave={() => { dragging.current = false; start.current = null; }}
    >
      {children}
      {showArrows && count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            className="absolute left-1 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-transparent text-foreground/70 transition hover:text-foreground hover:scale-110 active:scale-95"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
          >
            <ChevronLeft className="size-7" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => { e.stopPropagation(); go(1); }}
            className="absolute right-1 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-transparent text-foreground/70 transition hover:text-foreground hover:scale-110 active:scale-95"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
          >
            <ChevronRight className="size-7" strokeWidth={1.5} />
          </button>
          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {Array.from({ length: count }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-primary" : "w-1.5 bg-foreground/25"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
