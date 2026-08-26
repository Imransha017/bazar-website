import { useLiveCatalog } from "@/lib/live-catalog";
import { ProductCard } from "./ProductCard";
import { useI18n } from "@/lib/i18n";
import { useMemo } from "react";
import { Flame } from "lucide-react";
import { useSiteSettings } from "@/lib/site-settings";

export function RecentlyViewed() {
  const { products } = useLiveCatalog();
  const { lang } = useI18n();
  const settings = useSiteSettings();
  const count = settings.homepage.section_config?.top_selling?.count || 12;

  const topSellingProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, count);
  }, [products, count]);


  if (topSellingProducts.length === 0) return null;

  return (
    <section className="mx-auto max-w-none pt-3">
      <div className="overflow-hidden rounded-md bg-card shadow-card border">
        <div className="flex flex-col gap-0.5 border-b bg-gradient-to-r from-red-600 to-orange-600 px-3 py-2 text-white md:px-4">
          <div className="flex items-center gap-2">
            <Flame className="size-5 fill-current" />
            <h2 className="text-base font-extrabold md:text-lg">
              Top Selling Products
            </h2>
          </div>
          <p className="text-[10px] md:text-xs opacity-90 font-medium">
            {lang === 'bn' 
              ? "এখানে যে সব প্রোডাক্ট গুলো সবচেয়ে বেশি বিক্রি হয়েছে সে প্রোডাক্টগুলো দেখানো হচ্ছে"
              : "Showing the most popular products that customers love the most"}
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto p-2 no-scrollbar">
          {topSellingProducts.map((p) => (
            <div key={p.id} className="w-[42vw] max-w-[180px] shrink-0">
              <ProductCard p={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
