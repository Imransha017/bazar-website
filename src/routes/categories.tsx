import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { useLiveCatalog } from "@/lib/live-catalog";
import { useI18n, pick } from "@/lib/i18n";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "All Categories — Bazar BD" },
      { name: "description", content: "Browse all categories and subcategories on Bazar BD." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { lang, t } = useI18n();
  const { categories, loading } = useLiveCatalog();
  const [active, setActive] = useState<string | undefined>(undefined);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const filteredCategories = useMemo(() => {
    if (!q.trim()) return categories;
    const search = q.toLowerCase();
    return categories.filter((c: any) => {
      const name = pick(c.name, lang).toLowerCase();
      const subs = c.subcategories.some((s: any) => 
        pick(s.name, lang).toLowerCase().includes(search) ||
        (s.children && s.children.some((g: any) => pick(g.name, lang).toLowerCase().includes(search)))
      );
      return name.includes(search) || subs;
    });
  }, [categories, q, lang]);

  const activeCat = filteredCategories.find((c) => c.slug === active) ?? filteredCategories[0];

  return (
    <div className="mx-auto max-w-none">
      <div className="sticky top-0 z-10 border-b bg-card px-3 py-2 text-sm font-semibold md:hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="shrink-0">{t("categories")}</span>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search categories..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-8 w-full rounded-full border bg-muted/50 px-3 py-1 text-[11px] outline-none focus:border-primary/50"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-[120px_1fr] md:grid-cols-[260px_1fr]" style={{ minHeight: "calc(100vh - 120px)" }}>
        {/* Sidebar */}
        <ul className="overflow-y-auto border-r bg-white text-[12px] md:text-sm no-scrollbar">
          <li className="hidden px-3 py-3 md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search categories..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-9 w-full rounded-lg border bg-slate-50 px-3 py-1 text-xs outline-none focus:border-[#5200FF]/50"
              />
            </div>
          </li>
          {filteredCategories.map((c: any) => (
            <li key={c.slug}>
              <button
                onClick={() => {
                  setActive(c.slug);
                  setExpandedSub(null);
                }}
                className={`group flex w-full flex-col items-center gap-0.5 border-b border-slate-50 px-0.5 py-3 text-center transition md:flex-row md:justify-between md:px-4 md:py-3 md:text-left ${
                  active === c.slug || (!active && filteredCategories[0]?.slug === c.slug)
                    ? "bg-slate-50 font-bold text-[#5200FF]"
                    : "text-[#333] hover:bg-slate-50"
                }`}
              >
                <div className="flex flex-col items-center gap-0.5 md:flex-row md:gap-3">
                  {c.image ? (
                    <img 
                      src={c.image} 
                      alt="" 
                      className="size-9 shrink-0 rounded-full object-contain bg-[#F8F9FA] p-1 ring-1 ring-slate-200 md:size-8 md:rounded md:ring-0" 
                    />
                  ) : (
                    <span className="text-xl leading-none opacity-60 md:text-lg">□</span>
                  )}
                  <span className="line-clamp-2 text-[9px] md:line-clamp-1 md:text-[13px]">{pick(c.name, lang)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="hidden text-[10px] text-slate-400 bg-slate-100 px-1.5 rounded-full md:block">{c.subcategories.length}</span>
                  <ChevronRight className={`hidden size-4 text-slate-300 md:block transition-transform ${active === c.slug ? "translate-x-1 text-[#5200FF]" : ""}`} />
                </div>
              </button>
            </li>
          ))}
        </ul>

        {/* Content Area */}
        <div className="overflow-y-auto bg-white no-scrollbar p-6 md:p-10">
          {activeCat ? (
            <div className="max-w-4xl">
              {/* Header Banner */}
              <div className="mb-10 flex items-start gap-6 border-b pb-8">
                <div className="size-24 shrink-0 overflow-hidden rounded-xl bg-slate-50 p-2 shadow-sm">
                  <img src={activeCat.image} alt="" className="size-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-bold text-[#333] md:text-3xl">{pick(activeCat.name, lang)}</h2>
                  <Link
                    to="/category/$slug"
                    params={{ slug: activeCat.slug }}
                    search={{ sub: undefined }}
                    className="mt-2 inline-flex items-center text-sm text-slate-400 hover:text-[#5200FF] hover:underline"
                  >
                    View All Products <ChevronRight className="ml-1 size-4" />
                  </Link>
                </div>
              </div>

              {/* Subcategories (Pills layout) */}
              <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:gap-4">
                {activeCat.subcategories.map((s: any) => (
                  <div key={s.slug} className="flex flex-col gap-2 items-start">
                    <div className="flex items-center gap-1">
                      <Link
                        to="/category/$slug"
                        params={{ slug: activeCat.slug }}
                        search={{ sub: s.slug }}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-bold transition-all md:px-6 md:py-2.5 md:text-sm ${
                          expandedSub === s.slug 
                            ? "bg-[#5200FF]/5 border-[#5200FF] text-[#5200FF] shadow-sm" 
                            : "bg-white border-slate-200 text-[#333] hover:border-[#5200FF]/50"
                        }`}
                      >
                        {pick(s.name, lang)}
                      </Link>
                      {s.children && s.children.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedSub(prev => prev === s.slug ? null : s.slug)}
                          className={`grid size-7 place-items-center rounded-full border transition-all md:size-9 ${
                            expandedSub === s.slug
                              ? "bg-[#5200FF]/5 border-[#5200FF] text-[#5200FF] shadow-sm"
                              : "bg-white border-slate-200 text-[#333] hover:border-[#5200FF]/50"
                          }`}
                          aria-label={`${expandedSub === s.slug ? "Hide" : "Show"} ${pick(s.name, lang)} options`}
                        >
                          <ChevronRight className={`size-3 transition-transform md:size-4 ${expandedSub === s.slug ? "rotate-90" : ""}`} />
                        </button>
                      )}
                    </div>

                    {/* Children Tree */}
                    {expandedSub === s.slug && s.children && s.children.length > 0 && (
                      <div className="flex flex-col gap-1 pl-2 border-l-2 border-[#5200FF]/20 mt-0.5 animate-in fade-in slide-in-from-top-2 duration-300 w-full">
                        {/* Option to view all products in this subcategory */}
                        <Link
                          to="/category/$slug"
                          params={{ slug: activeCat.slug }}
                          search={{ sub: s.slug }}
                          className="inline-flex w-auto self-start items-center gap-1.5 whitespace-nowrap px-2 py-1 rounded-lg bg-[#5200FF]/5 text-[9px] font-bold text-[#5200FF] transition-all hover:bg-[#5200FF]/10"
                        >
                          <span className="size-1 rounded-full bg-[#5200FF]" />
                          {t("view_all") || "সব দেখুন"}
                        </Link>
                        
                        <div className="flex flex-col gap-1 items-start">
                          {s.children.map((child: any) => (
                            <Link
                              key={child.slug}
                              to="/category/$slug"
                              params={{ slug: activeCat.slug }}
                              search={{ sub: child.slug }}
                              className="group inline-flex w-auto self-start items-center gap-1.5 whitespace-nowrap px-2 py-1 rounded-lg bg-[#FEF8E6] text-[9px] text-slate-600 font-medium border border-[#F0E4BF] transition-all hover:border-[#5200FF]/40 hover:text-[#5200FF] hover:shadow-sm"
                            >
                              <span className="size-1 rounded-full bg-slate-300 group-hover:bg-[#5200FF] transition-colors" />
                              {pick(child.name, lang)}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center opacity-30">
              <LayoutGrid className="mb-4 size-16" />
              <h3 className="text-lg font-bold">{loading ? t("loading") : "No Category Selected"}</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
