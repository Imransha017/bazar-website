import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { trackShortLinkEvent } from "@/lib/marketing-pro.functions";

import { SiteLayout } from "@/components/site/Layout";
import { getPublicStore, setDsCode, trackDsClick, type Dropshipper, type DropshipperProduct } from "@/lib/dropshipper";
import { useCart } from "@/lib/cart";
import { ShoppingCart, Store, Star, Heart, Truck, LayoutGrid, ChevronRight, X, Package, Search } from "lucide-react";
import { toast } from "sonner";
import { ProductImage } from "@/components/ProductImage";
import { formatBDT } from "@/lib/data";
import { useLiveCatalog } from "@/lib/live-catalog";
import { useI18n, pick } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

type StoreProduct = { id: string; name: string; slug: string; price: number; mrp?: number; image?: string; description?: string; category_slug?: string; category_name?: string; subcategory_slug?: string; subcategory_name?: string; rating?: number; sold?: number };
type Item = DropshipperProduct & { product?: StoreProduct };

export const Route = createFileRoute("/ds/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Bazar BD Dropshipping Store` },
      { name: "description", content: `Shop from ${params.slug} — a Bazar BD dropshipping partner store.` },
    ],
  }),
  component: PublicStore,
});

function PublicStore() {
  const { slug } = Route.useParams();
  const [data, setData] = useState<{ ds: Dropshipper; items: Item[] } | null | undefined>(undefined);
  const { add } = useCart();
  const trackShortLink = useServerFn(trackShortLinkEvent);
  const { categories, loading: catalogLoading } = useLiveCatalog();
  const { lang, t } = useI18n();
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  // Categories derived from products in the store
  const storeCategories = useMemo(() => {
    if (!data?.items || categories.length === 0) return [];
    
    const catCountMap: Record<string, number> = {};
    const subCountMap: Record<string, number> = {};

    data.items.forEach(item => {
      const cSlug = item.product?.category_slug;
      const sSlug = item.product?.subcategory_slug;
      if (cSlug) catCountMap[cSlug] = (catCountMap[cSlug] || 0) + 1;
      if (sSlug) subCountMap[sSlug] = (subCountMap[sSlug] || 0) + 1;
    });
    
    return categories
      .filter(c => catCountMap[c.slug] > 0)
      .map(c => ({
        ...c,
        productCount: catCountMap[c.slug],
        subcategories: (c.subcategories || [])
          .filter(s => subCountMap[s.slug] > 0)
          .map(s => ({
            ...s,
            productCount: subCountMap[s.slug]
          }))
      }));
  }, [data?.items, categories]);

  

  const fetchStoreData = async () => {
    const d = await getPublicStore(slug);
    setData(d as { ds: Dropshipper; items: Item[] } | null);
  };

  useEffect(() => {
    fetchStoreData();
    
    // Auto-refresh when window gains focus or online status changes
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchStoreData();
      }
    };

    window.addEventListener("focus", fetchStoreData);
    window.addEventListener("online", fetchStoreData);
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Real-time subscription for dropshipper products
    // This ensures categories/counts update immediately when a product is added/removed
    const channel = supabase
      .channel(`ds-store-${slug}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dropshipper_products",
        },
        () => {
          fetchStoreData();
        }
      )
      .subscribe();
    
    return () => {
      window.removeEventListener("focus", fetchStoreData);
      window.removeEventListener("online", fetchStoreData);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [slug]);

  const [recentSales, setRecentSales] = useState<{ name: string; city: string; time: string } | null>(null);

  useEffect(() => {
    if (!data?.ds) return;
    const ds = data.ds as any;
    
    const trackingStatus: Record<string, boolean> = {};

    // Facebook Pixel
    if (ds.facebook_pixel_id) {
      try {
        const f = (window as any).fbq || function() { ((window as any).fbq.q = (window as any).fbq.q || []).push(arguments); };
        if (!(window as any).fbq) (window as any).fbq = f;
        f('init', ds.facebook_pixel_id);
        f('track', 'PageView');
        trackingStatus.facebook = true;
      } catch (e) {
        console.error("FB Pixel Error:", e);
        trackingStatus.facebook = false;
      }
    }

    // Google Analytics
    if (ds.google_analytics_id) {
      try {
        const script = document.createElement("script");
        script.src = `https://www.googletagmanager.com/gtag/js?id=${ds.google_analytics_id}`;
        script.async = true;
        document.head.appendChild(script);
        
        const dataLayer = (window as any).dataLayer = (window as any).dataLayer || [];
        function gtag(...args: any[]) { dataLayer.push(args); }
        (window as any).gtag = gtag;
        
        gtag('js', new Date());
        gtag('config', ds.google_analytics_id);
        trackingStatus.google = true;
      } catch (e) {
        console.error("GA Error:", e);
        trackingStatus.google = false;
      }
    }

    // Record test event if requested via URL (?test_tracking=1)
    const params = new URLSearchParams(window.location.search);
    if (params.get("test_tracking") === "1") {
      import("@/lib/marketing-pro.functions").then(m => {
        if (ds.facebook_pixel_id) m.logPixelTest({ data: { platform: 'facebook', status: trackingStatus.facebook ? 'Success' : 'Failed' } });
        if (ds.google_analytics_id) m.logPixelTest({ data: { platform: 'google', status: trackingStatus.google ? 'Success' : 'Failed' } });
        toast.success("Tracking test event sent to dashboard");
      });
    }

    // Check for both long and short UTM parameters
    const code = ds.code;
    if (code) {
      setDsCode(code, 30);
      void trackDsClick(code);
      
      // Also log enhanced click if product ID is present in URL
      const productId = params.get("p");
      if (productId) {
        (supabase as any).from("dropshipper_clicks").insert({
          dropshipper_id: ds.id,
          product_id: productId,
          utm_source: params.get("s") || params.get("utm_source") || null,
          utm_medium: params.get("m") || params.get("utm_medium") || null,
          utm_campaign: params.get("c") || params.get("utm_campaign") || null,
          referer: document.referrer || null,
          user_agent: navigator.userAgent
        }).then(({ error }: any) => {
          if (error) console.error("Click log error:", error);
        });
      }
    }
  }, [data?.ds]);

  // Real-time sales popups simulation with rate limiting
  useEffect(() => {
    if (!data?.ds?.real_time_popups_enabled) return;
    
    const cities = ["Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna", "Barisal", "Rangpur", "Comilla", "Gazipur", "Narayanganj"];
    const names = ["Abdur", "Karim", "Rahim", "Selina", "Fatima", "Hasan", "Sumon", "Nasrin", "Tania", "Arif"];
    
    // Use session storage to track seen popups and cooldown
    const getCooldownKey = (name: string, city: string) => `ds_popup_cd_${name}_${city}`;
    
    const showPopup = () => {
      // Pick random
      const name = names[Math.floor(Math.random() * names.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const key = getCooldownKey(name, city);
      
      // Check cooldown (5 minutes)
      const lastSeen = sessionStorage.getItem(key);
      if (lastSeen && Date.now() - Number(lastSeen) < 300000) return;
      
      setRecentSales({ name, city, time: "just now" });
      sessionStorage.setItem(key, Date.now().toString());
      
      setTimeout(() => setRecentSales(null), 5000);
    };

    const interval = setInterval(() => {
      // 30% chance to show a popup every 20s if not on cooldown
      if (Math.random() > 0.7) showPopup();
    }, 20000);

    return () => clearInterval(interval);
  }, [data?.ds?.real_time_popups_enabled]);


  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    let items = data.items;
    if (activeCat) {
      items = items.filter(i => i.product?.category_slug === activeCat);
    }
    if (activeSub) {
      items = items.filter(i => i.product?.subcategory_slug === activeSub);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => {
        const title = (i.custom_title || i.product?.name || "").toLowerCase();
        const desc = (i.custom_description || i.product?.description || "").toLowerCase();
        return title.includes(q) || desc.includes(q);
      });
    }
    return items;
  }, [data?.items, activeCat, activeSub, searchQuery]);



  if (data === undefined) return <SiteLayout><div className="p-16 text-center text-sm text-muted-foreground">Loading store…</div></SiteLayout>;
  if (!data) return <SiteLayout><div className="p-16 text-center"><h1 className="text-xl font-bold">Store not found</h1><p className="mt-2 text-sm text-muted-foreground">This store may be pending approval or has been removed.</p></div></SiteLayout>;

  const { ds, items } = data;

  const addProduct = (item: Item) => {
    if (!item.product) return;
    const retail = Number(item.retail_price);
    add({
      id: item.product.id,
      slug: item.product.slug,
      title: { bn: item.custom_title || item.product.name, en: item.custom_title || item.product.name },
      price: retail,
      mrp: retail,
      rating: 0,
      sold: 0,
      category: item.product.category_slug || "",
      categoryName: item.product.category_name || "",
      brand: "",
      sku: "",
      tags: [],
      image: item.product.image || "",
      gallery: item.product.image ? [item.product.image] : [],
      description: { bn: item.custom_description || item.product.description || "", en: item.custom_description || item.product.description || "" },
    }, 1);
  };

  const orderNow = (item: Item) => {
    if (!item.product) return;
    const retail = Number(item.retail_price);
    const p = {
      id: item.product.id,
      slug: item.product.slug,
      title: { bn: item.custom_title || item.product.name, en: item.custom_title || item.product.name },
      price: retail,
      mrp: retail,
      rating: 0,
      sold: 0,
      category: item.product.category_slug || "",
      categoryName: item.product.category_name || "",
      brand: "",
      sku: "",
      tags: [],
      image: item.product.image || "",
      gallery: item.product.image ? [item.product.image] : [],
      description: { bn: item.custom_description || item.product.description || "", en: item.custom_description || item.product.description || "" },
    };
    try {
      sessionStorage.setItem("buy_now", JSON.stringify({ items: [{ product: p, qty: 1 }] }));
      window.location.href = "/checkout";
    } catch (e) {
      toast.error("Could not start checkout");
    }
  };

  const currentCat = categories.find(c => c.slug === activeCat);

  return (

    <SiteLayout>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --ds-primary: ${ds.theme_color_primary || '#3B82F6'};
          --ds-bg: ${ds.theme_color_background || '#FFFFFF'};
        }
        .ds-store-wrapper {
          background-color: var(--ds-bg);
          min-height: 100vh;
        }
        .ds-btn-primary {
          background-color: var(--ds-primary);
          color: white;
        }
        .ds-text-primary {
          color: var(--ds-primary);
        }
        .ds-border-primary {
          border-color: var(--ds-primary);
        }
      `}} />
      <div className="ds-store-wrapper">
      {ds.banner_url && <div className="h-32 w-full bg-cover bg-center sm:h-40" style={{ backgroundImage: `url(${ds.banner_url})` }} />}
      
      {/* Categories Horizontal Bar (Mobile) - Removed as per instructions */}

      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-6 md:flex-row">
          
          {/* Sidebar (Desktop) */}
          <aside className="hidden w-64 shrink-0 space-y-4 md:block">
            {/* Store Search */}
            <div className="rounded-xl border bg-card p-3 shadow-sm">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search in store..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border bg-muted/30 pl-9 pr-3 text-[12px] outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  {ds.logo_url ? <img src={ds.logo_url} alt="" className="h-full w-full rounded-full object-cover" /> : <Store className="h-6 w-6 text-primary" />}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-bold">{ds.store_name}</h1>
                  <p className="text-[10px] text-muted-foreground">{items.length} products</p>
                </div>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveCat(null); setActiveSub(null); }}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium transition ${!activeCat ? "ds-btn-primary" : "text-foreground hover:bg-muted"}`}
                >
                  All Products
                </button>
                {storeCategories.map(c => (
                  <div key={c.slug} className="space-y-1">
                    <button
                      onClick={() => { setActiveCat(c.slug); setActiveSub(null); }}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium transition ${activeCat === c.slug ? "bg-[var(--ds-primary)]/10 ds-text-primary font-bold" : "text-foreground hover:bg-muted"}`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{c.icon}</span>
                        {pick(c.name, lang)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[var(--ds-primary)]/10 px-1.5 py-0.5 text-[9px] font-bold ds-text-primary">
                          {c.productCount}
                        </span>
                        <ChevronRight className={`size-3.5 transition-transform ${activeCat === c.slug ? "rotate-90" : ""}`} />
                      </div>
                    </button>

                    {activeCat === c.slug && c.subcategories.length > 0 && (
                      <div className="ml-7 flex flex-wrap gap-1.5 border-l pl-3 py-2">
                        {c.subcategories.map(s => (
                          <button
                            key={s.slug}
                            onClick={() => setActiveSub(activeSub === s.slug ? null : s.slug)}
                            className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                              activeSub === s.slug 
                                ? "ds-border-primary ds-btn-primary" 
                                : "border-border bg-card text-foreground hover:ds-border-primary hover:bg-[var(--ds-primary)]/5 hover:ds-text-primary"
                            }`}
                          >
                            {pick(s.name, lang)}
                            <span className="ml-1 text-[9px] opacity-70">
                              ({s.productCount})
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </div>


            {ds.bio && (
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <h3 className="mb-2 text-xs font-bold uppercase text-muted-foreground tracking-wider">About Store</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{ds.bio}</p>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Store Header Mobile */}
            <div className="mb-4 flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm md:hidden">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shrink-0">
                {ds.logo_url ? <img src={ds.logo_url} alt="" className="h-full w-full rounded-full object-cover" /> : <Store className="h-8 w-8 text-primary" />}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-extrabold">{ds.store_name}</h1>
                {ds.bio && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{ds.bio}</p>}
                <p className="mt-1 text-[11px] text-muted-foreground">{items.length} products · Bazar BD partner</p>
              </div>
            </div>

            {/* Mobile Search */}
            <div className="mb-4 md:hidden">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search in store..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border bg-card pl-9 pr-3 text-[12px] outline-none focus:border-primary/50 shadow-sm"
                />
              </div>
            </div>

            {/* Subcategories bar removed as per instructions */}


            {filteredItems.length === 0 ? (
              <div className="rounded-xl border bg-card p-16 text-center shadow-sm">
                <div className="flex flex-col items-center">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold">No products found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Try selecting a different category or clearing filters.</p>
                  <button
                    onClick={() => { setActiveCat(null); setActiveSub(null); setSearchQuery(""); }}
                    className="mt-6 rounded-md ds-btn-primary px-6 py-2 text-sm font-bold transition-all hover:brightness-110"
                  >
                    View All Products
                  </button>
                </div>
              </div>
            ) : (
              <div className={ds.theme_layout_style === 'list' ? "space-y-3" : "grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5"}>
                {filteredItems.map(i => {
                  const retail = Number(i.retail_price);
                  const mrp = Number(i.product?.mrp || 0);
                  const discount = (mrp && retail && mrp > retail) ? Math.round(((mrp - retail) / mrp) * 100) : 0;
                  const rating = Number(i.product?.rating || 0) || 4.5; // fallback to 4.5 for demo if not set
                  const sold = Number(i.product?.sold || 0) || 0;

                  return (
                    <div key={i.id} className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary hover:shadow-card-hover">
                      <Link
                        to={i.product?.slug ? "/p/$slug" : "/product/$id"}
                        params={i.product?.slug ? { slug: i.product.slug } : { id: i.product?.id || "" }}
                        className="relative aspect-square w-full overflow-hidden bg-muted"
                      >
                        {i.product?.image && (
                          <ProductImage
                            src={i.product.image}
                            alt={i.custom_title || i.product.name}
                            loading="lazy"
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                        {discount > 0 && (
                          <span className="absolute right-2 top-2 rounded bg-destructive px-1 py-0.5 text-[9px] font-bold text-white shadow-sm">
                            -{discount}%
                          </span>
                        )}
                      </Link>
                      <div className="flex flex-1 flex-col p-1 sm:p-1.5">
                        <h3 className="truncate text-[10px] font-medium leading-tight text-foreground group-hover:text-primary sm:text-[11px] mb-0.5">
                          {i.custom_title || i.product?.name}
                        </h3>
                        
                        <div className="flex flex-col gap-0.5">
                          <div className="flex flex-wrap items-baseline gap-1 leading-none">
                            <span className="text-[12px] font-bold ds-text-primary sm:text-[13px]">{formatBDT(retail)}</span>
                            {mrp > retail && (
                              <span className="text-[9px] text-muted-foreground line-through opacity-70">{formatBDT(mrp)}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-0.5 mt-0.5">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, idx) => {
                                const fillPercentage = Math.max(0, Math.min(100, (rating - idx) * 100));
                                return (
                                  <div key={idx} className="relative size-2 sm:size-2.5">
                                    <Star className="absolute inset-0 size-full fill-muted/20 text-muted/20" />
                                    {fillPercentage > 0 && (
                                      <div 
                                        className="absolute inset-0 overflow-hidden" 
                                        style={{ clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` }}
                                      >
                                        <Star className="size-full fill-yellow-400 text-yellow-400" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <span className="text-[8px] font-semibold text-muted-foreground sm:text-[9px]">{rating.toFixed(1)}</span>
                            {sold > 0 && <span className="text-[8px] text-muted-foreground/60 sm:text-[9px]">({sold})</span>}
                          </div>
                          
                          <div className="mt-1 grid grid-cols-2 gap-1 w-full">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                addProduct(i);
                                toast.success("Added to cart");
                              }}
                              className="flex items-center justify-center gap-1 rounded bg-purple-700 py-0.5 text-[7px] font-bold text-white transition-all hover:bg-purple-800 active:scale-95 shadow-sm sm:py-1 sm:text-[8px]"
                            >
                              <ShoppingCart className="h-2 w-2 sm:h-2.5 sm:w-2.5" /> Add
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                orderNow(i);
                              }}
                              className="flex items-center justify-center gap-1 rounded ds-btn-primary py-0.5 text-[7px] font-bold transition-all hover:brightness-110 active:scale-95 shadow-sm sm:py-1 sm:text-[8px]"
                            >
                              <Truck className="h-2 w-2 sm:h-2.5 sm:w-2.5" /> Order
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Categories Modal */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-lg font-bold">{t("categories")}</span>
            <button onClick={() => setMobileMenuOpen(false)}>
              <X className="size-6" />
            </button>
          </div>
          <div className="grid flex-1 grid-cols-[100px_1fr] overflow-hidden">
            <div className="overflow-y-auto border-r bg-muted/30">
              {storeCategories.map(c => (
                <button
                  key={c.slug}
                  onClick={() => { setActiveCat(c.slug); setActiveSub(null); }}
                  className={`flex w-full flex-col items-center gap-1 px-2 py-4 text-center text-[10px] font-medium transition ${activeCat === c.slug ? "bg-card font-bold text-primary" : "text-foreground"}`}
                >
                  <span className="text-2xl">{c.icon}</span>
                  <span className="line-clamp-2 leading-tight">{pick(c.name, lang)}</span>
                </button>
              ))}
            </div>
            <div className="overflow-y-auto p-4">
              {activeCat && currentCat ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img src={currentCat.image} alt="" className="size-16 rounded-xl object-cover" />
                    <div>
                      <h2 className="text-base font-bold">{pick(currentCat.name, lang)}</h2>
                      <button 
                        onClick={() => { setMobileMenuOpen(false); }}
                        className="text-xs text-primary font-semibold"
                      >
                        View all products in this category
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subcategories</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => { setActiveSub(null); setMobileMenuOpen(false); }}
                        className={`w-full rounded-xl border p-3 text-left text-sm font-semibold transition ${!activeSub ? "border-primary bg-primary/5 text-primary" : "border-border bg-card"}`}
                      >
                        All {pick(currentCat.name, lang)}
                      </button>
                      {currentCat.subcategories.map(s => (
                        <button
                          key={s.slug}
                          onClick={() => { setActiveSub(s.slug); setMobileMenuOpen(false); }}
                          className={`w-full rounded-xl border p-3 text-left text-sm font-semibold transition ${activeSub === s.slug ? "border-primary bg-primary/5 text-primary" : "border-border bg-card"}`}
                        >
                          {pick(s.name, lang)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center p-6">
                  <LayoutGrid className="size-12 text-muted-foreground opacity-20 mb-4" />
                  <p className="text-sm text-muted-foreground">Select a category to view its subcategories and products.</p>
                </div>
              )}
            </div>
          </div>
          <div className="border-t p-4">
            <button
              onClick={() => { setActiveCat(null); setActiveSub(null); setMobileMenuOpen(false); }}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg"
            >
              Show All Products
            </button>
          </div>
        </div>
      )}

      {/* Real-time Sales Popup */}
      {recentSales && (
        <div className="fixed bottom-24 left-4 z-50 flex items-center gap-3 rounded-lg border bg-card p-3 shadow-xl animate-in fade-in slide-in-from-left-4 duration-500 sm:bottom-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold leading-tight">
              {recentSales.name} from {recentSales.city}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Purchased a product {recentSales.time}
            </p>
          </div>
          <button onClick={() => setRecentSales(null)} className="ml-2 text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* WhatsApp Order Button */}
      {ds.whatsapp_order_enabled && ds.whatsapp && (
        <button
          onClick={() => {
            // If we have items in the filtered list, use the first one as default
            // But ideally, the button would be on the product card or detail page.
            // For the floating button, we'll use a generic "Interested in your products" message
            // or the first item if available.
            const item = items[0];
            const retail = item ? Number(item.retail_price) : 0;
            const title = item ? (item.custom_title || item.product?.name || "Product") : "Products";
            
            const message = `হ্যালো! আমি আপনার স্টোর "${ds.store_name}" থেকে এই পণ্যটি অর্ডার করতে চাই:
            
পণ্য: ${title}
পরিমাণ: 1
মোট দাম: ${formatBDT(retail)}
            
দয়া করে জানাবেন কীভাবে অর্ডার কনফার্ম করতে পারি।`;
            const phone = ds.whatsapp!.replace(/[^0-9]/g, '');
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
          }}
          className="fixed bottom-24 right-4 z-50 flex items-center justify-center rounded-full bg-[#25D366] p-3 text-white shadow-xl transition-transform active:scale-95 sm:bottom-6"
          title="Order via WhatsApp"
        >
          <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </button>
      )}
      </div>
    </SiteLayout>
  );
}
