import { Link } from "@tanstack/react-router";
import { ShoppingCart, Star, StarHalf, Heart, Truck } from "lucide-react";
import { formatBDT, type Product } from "@/lib/data";
import { useI18n, pick } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { ProductImage } from "@/components/ProductImage";

export function ProductCard({ p }: { p: Product }) {
  const { lang, t } = useI18n();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const discount = (p.mrp && p.price && p.mrp > p.price) ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  const wished = has(p.id);

  const linkProps = p.slug
    ? ({ to: "/p/$slug", params: { slug: p.slug } } as const)
    : ({ to: "/product/$id", params: { id: p.id } } as const);

  return (
    <Link
      {...linkProps}
      className="group flex h-full flex-col overflow-hidden rounded-md border border-border bg-card transition hover:border-primary hover:shadow-card-hover"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <ProductImage
          src={p.image}
          alt={pick(p.title, lang)}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {p.badge && (
          <span
            className={cn(
              "absolute left-0 top-2 rounded-r px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white",
              p.badge === "FLASH" && "bg-destructive",
              p.badge === "MALL" && "bg-accent",
              p.badge === "NEW" && "bg-success",
              p.badge === "TOP" && "bg-primary",
            )}
          >
            {p.badge === "MALL" ? "BazarMall" : p.badge}
          </span>
        )}
        {discount > 0 && (
          <span className="absolute right-2 top-2 rounded bg-destructive/95 px-1 py-0.5 text-[9px] font-bold text-white shadow">
            -{discount}%
          </span>
        )}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(p.id); }}
          aria-label="Wishlist"
          className="absolute bottom-1 right-1 grid size-6 place-items-center rounded-full bg-white/90 shadow hover:bg-white"
        >
          <Heart className={cn("size-3", wished ? "fill-primary text-primary" : "text-muted-foreground")} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-1.5">
        <h3
          title={pick(p.title, lang)}
          className="truncate text-[11px] font-medium leading-[1.2] text-foreground group-hover:text-primary"
        >
          {pick(p.title, lang)}
        </h3>
        
        <div className="mt-1 flex flex-col gap-0.5">
          <div className="flex flex-wrap items-baseline gap-1">
            <span className="text-[14px] md:text-[13px] font-bold text-[#A52A2A] dark:text-[#E9967A] leading-none whitespace-nowrap">{formatBDT(p.price)}</span>
            {p.mrp > p.price && (
              <span className="text-[11px] md:text-[10px] text-muted-foreground line-through opacity-70 whitespace-nowrap">{formatBDT(p.mrp)}</span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => {
                const rating = p.rating || 0;
                const fillPercentage = Math.max(0, Math.min(100, (rating - i) * 100));
                
                return (
                  <div key={i} className="relative size-2.5">
                    <Star className="absolute inset-0 size-full fill-muted/20 text-muted/20" />
                    {fillPercentage > 0 && (
                      <div 
                        className="absolute inset-0 overflow-hidden" 
                        style={{ clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` }}
                      >
                        <Star className="size-2.5 fill-yellow-400 text-yellow-400" />
                      </div>
                    )}
                  </div>
                );
              })}
              <span className="ml-0.5 text-[9px] font-semibold text-muted-foreground">{Number(p.rating || 0).toFixed(1)}</span>
              <span className="text-[9px] text-muted-foreground/60">({p.reviewCount || 0})</span>
            </div>
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                add(p, 1);
                toast.success(t("added_to_cart") || "Added to cart");
              }}
              className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white active:scale-90"
              aria-label="Add to cart"
            >
              <ShoppingCart className="size-3" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

