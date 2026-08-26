import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { SiteLayout } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import { useLiveCatalog } from "@/lib/live-catalog";
import { useI18n } from "@/lib/i18n";
import { useMemo } from "react";

const schema = z.object({ 
  q: z.string().optional().default(""),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "rating", "sold"]).optional().default("newest"),
  cat: z.string().optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: schema,
  head: () => ({
    meta: [
      { title: "Search Products — Bazar BD" },
      { name: "description", content: "Search mobiles, fashion, electronics and home products on Bazar BD with price and category filters." },
      { property: "og:title", content: "Search Products — Bazar BD" },
      { property: "og:description", content: "Find the right product fast with price, category and sorting filters." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),

  component: SearchPage,
});

function SearchPage() {
  const { q, minPrice, maxPrice, sort, cat } = Route.useSearch();
  const { t } = useI18n();
  const { products, loading } = useLiveCatalog();
  const navigate = useNavigate();
  
  const norm = (v: string) => v.toLowerCase().replace(/[\s\-_/]+/g, "");
  const s = q.trim().toLowerCase();
  const sN = norm(s);
  
  const results = useMemo(() => {
    let list = products.filter((p) => {
      // Keyword search
      if (s) {
        const hay = [
          p.title?.en || "",
          p.title?.bn || "",
          p.brand || "",
          p.sku || "",
          p.category || "",
          p.categoryName || "",
          p.subcategory || "",
          p.subcategoryName || "",
          ...(p.tags || []),
          p.description?.en || "",
          p.description?.bn || "",
        ];
        const match = hay.some((f) => {
          const fl = f.toLowerCase();
          return fl.includes(s) || (sN && norm(fl).includes(sN));
        });
        if (!match) return false;
      }
      
      // Category filter
      if (cat && !(p.categories?.length ? p.categories.includes(cat) : p.category === cat)) return false;
      
      // Price filter
      if (minPrice !== undefined && p.price < minPrice) return false;
      if (maxPrice !== undefined && p.price > maxPrice) return false;
      
      return true;
    });
    
    // Sorting
    switch (sort) {
      case "price_asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "sold":
        // Fallback to rating if sold is not on types, though we added it to DB
        list = [...list].sort((a, b) => ((b as any).sold || 0) - ((a as any).sold || 0));
        break;
      default:
        // Already newest from live-catalog order
        break;
    }
    
    return list;
  }, [products, s, sN, minPrice, maxPrice, sort, cat]);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-none px-3 py-4 md:px-4">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-lg font-bold">
            {s ? (
              <>{t("results_for")}: <span className="text-primary">"{q}"</span> ({results.length})</>
            ) : (
              <>Search results ({results.length})</>
            )}
          </h1>
          
          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={sort} 
              onChange={(e) => {
                const newSort = e.target.value as any;
                navigate({ 
                  to: "/search",
                  search: (prev) => ({ ...prev, sort: newSort }) 
                });
              }}
              className="rounded-md border bg-card px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="sold">Best Selling</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-md bg-card p-12 text-center text-muted-foreground shadow-card">Loading…</div>
        ) : results.length === 0 ? (
          <div className="rounded-md bg-card p-10 text-center shadow-card">
            <p className="text-sm font-extrabold text-slate-800">
              {products.length === 0
                ? "এখনো কোনো প্রোডাক্ট প্রকাশিত হয়নি / No products published yet"
                : t("no_results")}
            </p>
            <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground">
              {products.length === 0
                ? "ক্যাটালগে প্রোডাক্ট যুক্ত হলে সার্চে দেখা যাবে।"
                : "অন্য কিওয়ার্ড লিখুন, ফিল্টার সরান অথবা ক্যাটাগরি থেকে ব্রাউজ করুন।"}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link to="/categories" className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90">
                ক্যাটাগরি দেখুন
              </Link>
              {(q || cat || minPrice || maxPrice) && (
                <button
                  onClick={() => navigate({ to: "/search", search: { q: "", sort: "newest" } })}
                  className="rounded-full border px-5 py-2 text-xs font-bold hover:bg-muted"
                >
                  ফিল্টার রিসেট
                </button>
              )}
            </div>
          </div>

        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {results.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
