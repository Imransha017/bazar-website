import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThumbnailStrip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const check = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    check();
    const el = scrollRef.current;
    if (!el) return;
    const onResize = () => check();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [children]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.75, 120);
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    setTimeout(check, 320);
  };

  return (
    <div className={cn("relative", className)}>
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border bg-white/95 p-1.5 text-foreground shadow-md backdrop-blur transition hover:bg-white hover:shadow-lg dark:bg-card/95"
          aria-label="Scroll thumbnails left"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}
      <div
        ref={scrollRef}
        onScroll={check}
        className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1"
      >
        {children}
      </div>
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border bg-white/95 p-1.5 text-foreground shadow-md backdrop-blur transition hover:bg-white hover:shadow-lg dark:bg-card/95"
          aria-label="Scroll thumbnails right"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  );
}
