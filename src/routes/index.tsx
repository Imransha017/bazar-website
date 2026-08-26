import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { Hero } from "@/components/site/Hero";
import { PromotionsStrip } from "@/components/site/Promotions";
import { HomeVideos } from "@/components/site/HomeVideos";
import { HomePromoCards } from "@/components/site/HomePromoCards";
import { CategoriesGrid } from "@/components/site/CategoriesGrid";
import { FlashSale } from "@/components/site/FlashSale";
import { RecentlyViewed } from "@/components/site/RecentlyViewed";
import { ProductCard } from "@/components/site/ProductCard";

import { useLiveCatalog } from "@/lib/live-catalog";

import { useI18n, pick } from "@/lib/i18n";
import { Ticket, Truck, ShieldCheck, BadgePercent, Crown, Sparkles, Smartphone, Shirt, ArrowRight, MoreHorizontal, Video, TrendingUp, Zap } from "lucide-react";
import { useSiteSettings } from "@/lib/site-settings";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bazar Online Shopping App in Bangladesh" },
      { name: "description", content: "Online Shopping Bangladesh - Mobiles, Fashion, Electronics, Home Appliances at lowest prices. Free Delivery & Cash on Delivery." },
      { property: "og:title", content: "Bazar Online Shopping App in Bangladesh" },
      { property: "og:description", content: "Mega flash sales daily — mobiles, fashion, home and more." },
    ],
  }),
  component: HomePage,
});


const services = [
  { icon: Truck, label: { en: "Free Shipping", bn: "ফ্রি ডেলিভারি" } },
  { icon: ShieldCheck, label: { en: "100% Authentic", bn: "১০০% অরিজিনাল" } },
  { icon: BadgePercent, label: { en: "Lowest Price", bn: "সর্বনিম্ন দাম" } },
  { icon: Crown, label: { en: "Bazar Mall", bn: "বাজার মল" } },
  { icon: Sparkles, label: { en: "Daily Deals", bn: "ডেইলি ডিল" } },
  { icon: Ticket, label: { en: "Vouchers", bn: "ভাউচার" } },
];

const worldBrands = ["Apple", "Samsung", "Xiaomi", "HP", "Sony", "LG", "Logitech", "Asus", "Realme", "Anker", "JBL", "Philips"];

function HomePage() {
  const { lang, t } = useI18n();
  const settings = useSiteSettings();
  const live = useLiveCatalog();
  const navigate = useNavigate();
  
  const trackAdClick = useCallback(async (_adId: string, link: string) => {
    window.open(link, '_blank');
  }, []);
  const PAGE_SIZE = Math.max(1, settings.homepage.section_config?.all_products?.count || 20);
  const [extraVisible, setExtraVisible] = useState(0);
  const visible = PAGE_SIZE + extraVisible;
  // Only real, active products from the live catalog — no demo/fallback data.
  const feedSource = live.products.filter((p) => p.is_active !== false);

  if (live.loading) {
    return (
      <SiteLayout>
        <div className="flex items-center justify-center p-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </SiteLayout>
    );
  }

  const catalogEmpty = feedSource.length === 0;


  

  
  // Best Sellers
  const bestSellers = settings.homepage.best_seller_ids?.length
    ? feedSource.filter(p => settings.homepage.best_seller_ids?.includes(p.id)).slice(0, settings.homepage.section_config?.best_sellers?.count || 10)
    : feedSource.filter(p => p.sold > 20).slice(0, settings.homepage.section_config?.best_sellers?.count || 10);

  // Viral Products
  const viralProducts = settings.homepage.viral_product_ids?.length
    ? feedSource.filter(p => settings.homepage.viral_product_ids?.includes(p.id)).slice(0, settings.homepage.section_config?.viral?.count || 12)
    : feedSource
        .filter(p => p.badge === 'TOP' || p.sold > 10)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, settings.homepage.section_config?.viral?.count || 12);
        
  // Promo Cards
  const promoCardProducts = settings.homepage.promo_card_ids?.length
    ? feedSource.filter(p => settings.homepage.promo_card_ids?.includes(p.id))
    : []; // Fallback handled inside HomePromoCards if empty

  const feed = feedSource.slice(0, visible);
  const hasMore = visible < feedSource.length;




    const renderAd = (sectionId: string) => {
      const ads = settings.homepage.custom_ads?.filter(a => a.is_active && a.position_before_section === sectionId) || [];
      if (ads.length === 0) return null;

      return ads.map(ad => {
        const isMobile = false;
        const isTablet = false;
        const isDesktop = false;

        if (isMobile && ad.visibility.mobile === false) return null;
        if (isTablet && ad.visibility.tablet === false) return null;
        if (isDesktop && ad.visibility.desktop === false) return null;

        return (
          <div key={ad.id} className="my-2 overflow-hidden rounded-lg shadow-sm">
            {ad.type === 'image' || ad.type === 'animation' ? (
              <div className="relative group">
                <img 
                  src={ad.content_url} 
                  alt="" 
                  className="w-full object-cover" 
                  style={ad.height_px ? { maxHeight: `${ad.height_px}px` } : {}}
                />
                {ad.link_url && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <a 
                      href={ad.link_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black shadow-lg"
                    >
                      {ad.button_text || "Learn More"}
                    </a>
                  </div>
                )}
                {ad.link_url && !ad.button_text && (
                  <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0" />
                )}
              </div>
            ) : ad.type === 'video' ? (
              <video 
                src={ad.content_url} 
                autoPlay 
                muted 
                loop 
                playsInline 
                className="w-full object-cover"
                style={ad.height_px ? { maxHeight: `${ad.height_px}px` } : {}}
              />
            ) : null}
          </div>
        );
      });
    };

    const renderSection = (sectionId: string) => {
    // Check Visibility per device
    const visibility = settings.homepage.visibility?.[sectionId];
    if (visibility) {
      const isMobile = false;
      const isTablet = false;
      const isDesktop = false;
      
      if (isMobile && visibility.mobile === false) return null;
      if (isTablet && visibility.tablet === false) return null;
      if (isDesktop && visibility.desktop === false) return null;
    }




    switch (sectionId) {
      case 'hero':
        return <Hero key="hero" />;
      case 'flash_sale':
        const fs = settings.homepage.flash_sale;
        let showFS = (settings.homepage.show_flash_sale ?? true);
        if (showFS && fs?.auto_toggle && fs.start_time && fs.end_time) {
          const now = new Date();
          const start = new Date(fs.start_time);
          const end = new Date(fs.end_time);
          showFS = now >= start && now <= end;
        }
        const fsProducts = settings.homepage.flash_sale?.product_ids?.length
          ? feedSource.filter(p => settings.homepage.flash_sale?.product_ids?.includes(p.id)).slice(0, settings.homepage.section_config?.flash_sale?.count || 6)
          : feedSource.slice(0, settings.homepage.section_config?.flash_sale?.count || 6);

        // Hide the flash-sale rail entirely when there is nothing real to show.
        return showFS && fsProducts.length > 0 && <FlashSale key="flash_sale" products={fsProducts} />;


      case 'best_sellers':
        return (settings.homepage.show_best_sellers ?? true) && bestSellers.length > 0 && (
          <section key="best_sellers" className="mx-auto max-w-none pt-1">
            <div className="overflow-hidden rounded-md bg-card shadow-card">
              <div className="flex items-center justify-between border-b bg-gradient-to-r from-purple-600 to-indigo-700 px-3 py-2 text-white md:px-4">
                <h2 className="flex items-center gap-2 text-base font-extrabold md:text-lg">
                  <Crown className="size-5" /> {t("best_sellers") || "Best Sellers"}
                </h2>
                <Link to="/search" search={{ q: "" }} className="text-xs font-medium hover:underline">View All →</Link>
              </div>
              <div className="flex gap-2 overflow-x-auto p-2 no-scrollbar">
                {bestSellers.map((p) => (
                  <div key={p.id} className="w-[42vw] max-w-[180px] shrink-0">
                    <ProductCard p={p} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      case 'viral':
        return (settings.homepage.show_viral_products ?? true) && viralProducts.length > 0 && (
          <section key="viral" className="mx-auto max-w-none pt-1">
            <div className="overflow-hidden rounded-md bg-card shadow-card">
              <div className="flex items-center justify-between border-b bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-2 text-white md:px-4">
                <h2 className="flex items-center gap-2 text-base font-extrabold md:text-lg">
                  <TrendingUp className="size-5" /> {t("viral_products") || "Viral Products"}
                </h2>
                <span className="text-xs font-medium opacity-90">Hot Deals</span>
              </div>
              <div className="flex gap-2 overflow-x-auto p-2 no-scrollbar">
                {viralProducts.map((p) => (
                  <div key={p.id} className="w-[42vw] max-w-[180px] shrink-0">
                    <ProductCard p={p} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      case 'promo_cards':
        return (settings.homepage.show_promo_cards ?? true) && <HomePromoCards key="promo_cards" products={promoCardProducts.length > 0 ? promoCardProducts : undefined} />;
      case 'videos':
        return (settings.homepage.show_videos ?? true) && <HomeVideos key="videos" />;
      case 'marketing_top':
        const topAd = settings.homepage.marketing_ads?.find(a => a.position === 'top');
        return topAd && (
          <section key="marketing_top" className="mx-auto max-w-none pt-1">
            <button 
              onClick={() => trackAdClick(topAd.id, topAd.link)}
              className="block w-full text-left overflow-hidden rounded-md shadow-card"
            >
              <img src={topAd.image_url} alt="Top Ad" className="w-full object-cover max-h-[120px]" />
            </button>
          </section>
        );
      case 'marketing_middle':
        const middleAd = settings.homepage.marketing_ads?.find(a => a.position === 'middle');
        return middleAd && (
          <section key="marketing_middle" className="mx-auto max-w-none pt-1">
            <button 
              onClick={() => trackAdClick(middleAd.id, middleAd.link)}
              className="block w-full text-left overflow-hidden rounded-md shadow-card"
            >
              <img src={middleAd.image_url} alt="Middle Ad" className="w-full object-cover max-h-[120px]" />
            </button>
          </section>
        );
      case 'marketing_bottom':
        const bottomAd = settings.homepage.marketing_ads?.find(a => a.position === 'bottom');
        return bottomAd && (
          <section key="marketing_bottom" className="mx-auto max-w-none pt-1">
            <button 
              onClick={() => trackAdClick(bottomAd.id, bottomAd.link)}
              className="block w-full text-left overflow-hidden rounded-md shadow-card"
            >
              <img src={bottomAd.image_url} alt="Bottom Ad" className="w-full object-cover max-h-[120px]" />
            </button>
          </section>
        );
      case 'promotions_strip':
        return (settings.homepage.show_promotions_strip ?? true) && <PromotionsStrip key="promotions_strip" />;
      case 'categories':
        return (
          <div key="categories" className="py-0.5">
            <CategoriesGrid />
          </div>
        );
      case 'vouchers':
        const activeVouchers = settings.homepage.vouchers || [];
        if (activeVouchers.length === 0) return null;
        return (
          <section key="vouchers" className="mx-auto max-w-none pt-1">
            <div className="rounded bg-[#5200FF] p-1 shadow-[0_2px_10px_rgba(82,0,255,0.2)]">
              <div className="flex items-center justify-between px-3 py-1 text-white">
                <div className="flex items-center gap-2">
                  <Ticket className="size-4" />
                  <h2 className="text-[10px] font-black uppercase tracking-wider md:text-[12px]">
                    COLLECT VOUCHERS
                  </h2>
                </div>
                <span className="text-[9px] opacity-60">Daily refresh</span>
              </div>
              <div className="flex gap-1 overflow-x-auto no-scrollbar px-1 pb-1">
                {activeVouchers.map((v) => (
                  <div key={v.code} className="flex shrink-0 items-center gap-2 rounded bg-white px-2 py-1 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-[#333] leading-none">{v.off}</span>
                      <span className="text-[7px] text-slate-400 mt-0.5 whitespace-nowrap">Min. ৳499</span>
                    </div>
                    <button className="rounded bg-[#5200FF] px-1.5 py-0.5 text-[7px] font-bold text-white transition-transform hover:scale-105 active:scale-95">
                      COLLECT
                    </button>
                  </div>
                ))}
              </div>

            </div>
          </section>
        );
      case 'services':
        return (
          <section key="services" className="mx-auto max-w-none py-1">
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="flex items-center overflow-x-auto no-scrollbar divide-x divide-slate-100 py-2 md:justify-around md:overflow-visible">
                {services.map((s) => (
                  <div 
                    key={s.label.en} 
                    className="flex shrink-0 items-center justify-center gap-2 px-3 py-1 transition-colors hover:bg-slate-50 cursor-default md:flex-1 md:shrink md:px-2"
                  >
                    <s.icon className="size-3.5 text-[#5200FF] md:size-4" />
                    <span className="whitespace-nowrap text-[10px] font-bold text-slate-700 uppercase tracking-tight md:text-[11px]">
                      {pick(s.label, lang)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      case 'recently_viewed':
        return <RecentlyViewed key="recently_viewed" />;
      case 'for_you':
        return (
          <section key="for_you" className="mx-auto max-w-none pt-1 pb-4">
            <div className="overflow-hidden rounded-md bg-card shadow-card">
              <div className="border-b bg-gradient-brand px-3 py-2 text-white md:px-4">
                <h2 className="text-base font-extrabold md:text-lg">{t("for_you")}</h2>
              </div>
              {catalogEmpty ? (
                <EmptyCatalogNotice lang={lang} />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {feed.map((p) => (
                      <ProductCard key={p.id} p={p} />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="flex justify-center p-4">
                      <button
                        onClick={() => setExtraVisible((v) => v + PAGE_SIZE)}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-6 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-primary-foreground transition"
                      >
                        <MoreHorizontal className="size-4" />
                        {t("shop_more")} ({feedSource.length - visible})
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        );
      case 'all_products':
        if (catalogEmpty) return null;
        return (settings.homepage.show_all_products ?? true) && (
          <section key="all_products" className="mx-auto max-w-none pt-1 pb-4">
            <div className="overflow-hidden rounded-md bg-card shadow-card">
              <div className="border-b bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-2 text-white md:px-4">
                <h2 className="text-base font-extrabold md:text-lg">
                  {lang === 'bn' 
                    ? (settings.homepage.section_config?.all_products?.label_bn || "সব প্রোডাক্ট")
                    : (settings.homepage.section_config?.all_products?.label_en || "All Products")}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {feedSource.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  const defaultOrder = ["hero", "services", "categories", "promotions_strip", "promo_cards", "videos", "flash_sale", "viral", "best_sellers", "recently_viewed", "vouchers", "for_you", "all_products"];
  // Saved homepage layouts may contain the same section more than once. Render
  // each section once so the hero banners do not appear duplicated on mobile.
  const configuredOrder = settings.homepage.section_order?.length ? settings.homepage.section_order : defaultOrder;
  const order = Array.from(new Set(configuredOrder));

  return (
    <SiteLayout>
      <div className="mx-auto max-w-[1400px] px-2 md:px-4">
        {order.map((sectionId, idx) => {
          const ads = renderAd(sectionId);
          const section = renderSection(sectionId);
          if (!section && !ads) return null;
          return (
            <div key={`${sectionId}-${idx}`}>
              {ads}
              {section}
            </div>
          );
        })}
      </div>
    </SiteLayout>
  );
}

function EmptyCatalogNotice({ lang }: { lang: string }) {
  const bn = lang === "bn";
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <div className="rounded-full bg-primary/10 p-4">
        <Sparkles className="size-7 text-primary" />
      </div>
      <p className="text-sm font-extrabold text-slate-800">
        {bn ? "এখনো কোনো প্রোডাক্ট যোগ করা হয়নি" : "No products published yet"}
      </p>
      <p className="max-w-md text-xs text-slate-500">
        {bn
          ? "নতুন প্রোডাক্ট যুক্ত হলে এখানে সাথে সাথে দেখা যাবে। ততক্ষণে ক্যাটাগরি ঘুরে দেখুন।"
          : "New products appear here as soon as they are published. Browse categories in the meantime."}
      </p>
      <Link
        to="/categories"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
      >
        {bn ? "ক্যাটাগরি দেখুন" : "Browse categories"} <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
