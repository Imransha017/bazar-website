import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { flashSale } from "@/lib/data";
import { ProductCard } from "./ProductCard";
import { useI18n } from "@/lib/i18n";

function useCountdown(endTime?: string) {
  const calculateSecondsLeft = () => {
    if (!endTime) return 3 * 3600 + 42 * 60 + 17;
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((end - now) / 1000);
    return diff > 0 ? diff : 0;
  };

  const [s, setS] = useState(calculateSecondsLeft);
  
  useEffect(() => {
    const t = setInterval(() => {
      setS(calculateSecondsLeft());
    }, 1000);
    return () => clearInterval(t);
  }, [endTime]);

  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return { h, m, s: sec };
}

const pad = (n: number) => String(n).padStart(2, "0");

import { useSiteSettings } from "@/lib/site-settings";

import { useLiveCatalog } from "@/lib/live-catalog";

import { Product } from "@/lib/data";

export function FlashSale({ products: propProducts }: { products?: Product[] }) {

  const { t } = useI18n();
  const settings = useSiteSettings();
  const live = useLiveCatalog();
  const config = settings.homepage.flash_sale;
  const { h, m, s } = useCountdown(config?.end_time);

  const feedSource = live.products;
  const saleProducts = propProducts || (config?.product_ids?.length 
    ? feedSource.filter(p => config.product_ids.includes(p.id))
    : feedSource.filter(p => p.badge === "FLASH" || p.badge === "TOP").slice(0, 8));


  if (settings.homepage.show_flash_sale === false) return null;

  return (
    <section className="mx-auto max-w-none pb-4">
      <div className="overflow-hidden rounded-md bg-card shadow-card">
        <div className="flex items-center justify-between bg-gradient-flash px-3 py-2 text-white md:px-4 md:py-3" style={{ background: config?.badge_color }}>
          <div className="flex items-center gap-2">
            <Zap className="size-5 fill-white" />
            <h2 className="text-base font-extrabold uppercase tracking-wide md:text-lg">{config?.badge_text || t("flash_sale")}</h2>
            {(config?.show_timer !== false) && (
              <>
                <span className="hidden text-xs opacity-90 md:inline">| {t("ends_in")}</span>
                <div className="flex items-center gap-1 text-xs font-bold">
                  <span className="rounded bg-black/40 px-1.5 py-0.5">{pad(h)}</span>:
                  <span className="rounded bg-black/40 px-1.5 py-0.5">{pad(m)}</span>:
                  <span className="rounded bg-black/40 px-1.5 py-0.5">{pad(s)}</span>
                </div>
              </>
            )}
          </div>
          <Link to="/search" search={{ q: "" }} className="text-xs font-medium hover:underline">
            {t("shop_more")} →
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto p-2 no-scrollbar md:hidden">
          {saleProducts.map((p) => (
            <div key={p.id} className="w-[42vw] max-w-[180px] shrink-0">
              <ProductCard p={p} />
            </div>
          ))}
        </div>
        <div className="hidden gap-2 p-2 md:grid md:grid-cols-4 lg:grid-cols-6">
          {saleProducts.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
