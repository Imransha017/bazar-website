import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useLiveCatalog } from "@/lib/live-catalog";

import { useI18n, pick } from "@/lib/i18n";

export function CategoriesGrid() {
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const [active, setActive] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const live = useLiveCatalog();
  const categories = live.categories;

  const activeCat = categories.find((c) => c.slug === active) ?? null;

  const goToCat = (slug: string) => {
    navigate({ to: "/category/$slug", params: { slug }, search: { sub: undefined } });
  };

  const toggle = (slug: string) => {
    setActive((prev) => (prev === slug ? null : slug));
    setExpandedSub(null); // Reset sub-expansion when changing main category
  };

  const onSubClick = (catSlug: string, sub: any) => {
    if (sub.children && sub.children.length > 0) {
      setExpandedSub((prev) => (prev === sub.slug ? null : sub.slug));
    } else {
      navigate({ to: "/category/$slug", params: { slug: catSlug }, search: { sub: sub.slug } });
    }
  };

  const onChildClick = (catSlug: string, childSlug: string) => {
    navigate({ to: "/category/$slug", params: { slug: catSlug }, search: { sub: childSlug } });
  };


  return (
    <section className="mx-auto max-w-none pt-2 pb-6">
      <div className="rounded bg-white p-3 shadow-sm border border-slate-50">
        <h2 className="mb-4 text-xs font-black uppercase tracking-wider text-[#333] border-b pb-2">{t("top_categories")}</h2>

        {/* Mobile: single-line horizontal scroll showing 6 categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar md:hidden">
          {categories.map((c) => {
            const isActive = active === c.slug;
            return (
              <div key={c.slug} className="flex flex-col items-center gap-1 text-center min-w-[calc(100%/6-9px)] w-[calc(100%/6-9px)] shrink-0">
                <button
                  type="button"
                  onClick={() => toggle(c.slug)}
                  onDoubleClick={() => goToCat(c.slug)}
                  className="group w-full flex justify-center"
                >
                  <div className={`aspect-square w-full overflow-hidden rounded-full bg-slate-50 p-1 transition-transform group-active:scale-95 ${isActive ? "ring-1 ring-[#5200FF]" : "ring-1 ring-slate-300"}`}>
                    <img src={c.image} alt="" loading="lazy" className="size-full object-contain" />
                  </div>
                </button>
                <span className={`line-clamp-2 text-[8px] font-bold leading-tight transition-colors ${isActive ? "text-[#5200FF]" : "text-slate-600"}`}>
                  {pick(c.name, lang)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid md:grid-cols-10 md:gap-4 lg:grid-cols-12">
          {categories.map((c) => {
            const isActive = active === c.slug;
            return (
              <div key={c.slug} className="flex flex-col items-center gap-2 text-center group">
                <button
                  type="button"
                  onClick={() => toggle(c.slug)}
                  onDoubleClick={() => goToCat(c.slug)}
                  className="w-full flex justify-center"
                >
                  <div className={`aspect-square w-[55px] overflow-hidden rounded-full bg-slate-50 p-1.5 transition-all group-hover:shadow-sm group-hover:-translate-y-1 ${isActive ? "ring-1 ring-[#5200FF]" : "ring-1 ring-slate-300"}`}>
                    <img src={c.image} alt="" loading="lazy" className="size-full object-contain transition-transform group-hover:scale-105" />
                  </div>
                </button>
                <span className={`line-clamp-2 text-[10px] font-bold leading-tight transition-colors group-hover:text-[#5200FF] ${isActive ? "text-[#5200FF]" : "text-slate-500"}`}>
                  {pick(c.name, lang)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Subcategory chips for the active category */}
        {activeCat && (
          <div className="mt-2 rounded-md border border-border bg-muted/30 p-1.5 md:mt-3 md:p-2">
            <div className="mb-1.5 flex items-center justify-between px-1 md:mb-2">
              <span className="text-[11px] font-semibold text-foreground md:text-xs">{pick(activeCat.name, lang)}</span>
              <Link
                to="/category/$slug"
                params={{ slug: activeCat.slug }}
                search={{ sub: undefined }}
                className="text-[10px] font-medium text-primary hover:underline md:text-[11px]"
              >
                {t("view_all") ?? "View all"} →
              </Link>
            </div>
            {/* Mobile: horizontal scrollable single-line subcategories */}
            <div className="flex flex-row flex-nowrap gap-2 overflow-x-auto pb-1 no-scrollbar md:hidden">
              {activeCat.subcategories.map((s) => {
                const isExpanded = expandedSub === s.slug;
                return (
                  <div key={s.slug} className="inline-flex flex-row items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSubClick(activeCat.slug, s)}
                      className={`flex items-center justify-between whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all duration-200 shrink-0 ${
                        isExpanded
                          ? "border-[#5200FF] bg-white text-[#5200FF] shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-[#5200FF]/50 hover:text-[#5200FF]"
                      }`}
                    >
                      {pick(s.name, lang)}
                      {s.children && s.children.length > 0 && (
                        <span className={`ml-1.5 text-[10px] ${isExpanded ? "text-[#5200FF]" : "text-slate-400"}`}>
                          {isExpanded ? "✓" : "▼"}
                        </span>
                      )}
                    </button>
                    {isExpanded && s.children && s.children.length > 0 && (
                      <div className="inline-flex flex-row items-center gap-1.5 animate-in fade-in duration-200">
                        <button
                          type="button"
                          onClick={() => navigate({ to: "/category/$slug", params: { slug: activeCat.slug }, search: { sub: s.slug } })}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-full bg-[#5200FF]/5 text-[10px] font-bold text-[#5200FF] transition-all hover:bg-[#5200FF]/10 active:scale-[0.98] shrink-0"
                        >
                          <span className="size-1.5 rounded-full bg-[#5200FF]" />
                          {t("view_all") || "সব দেখুন"}
                        </button>
                        {s.children.map((child) => (
                          <button
                            key={child.slug}
                            type="button"
                            onClick={() => onChildClick(activeCat.slug, child.slug)}
                            className="group inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-full bg-[#FEF8E6] text-[10px] text-slate-600 font-medium border border-[#F0E4BF] transition-all hover:border-[#5200FF]/40 hover:text-[#5200FF] hover:shadow-sm active:scale-[0.98] shrink-0"
                          >
                            <span className="size-1 rounded-full bg-slate-300 group-hover:bg-[#5200FF] transition-colors" />
                            {pick(child.name, lang)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop: vertical subcategory list */}
            <div className="hidden md:flex md:flex-col md:gap-1.5 md:px-1 md:pb-1">
              {activeCat.subcategories.map((s) => {
                return (
                  <div key={s.slug} className="flex flex-col gap-1 items-start">
                    <button
                      type="button"
                      onClick={() => onSubClick(activeCat.slug, s)}
                      className={`flex items-center justify-between whitespace-nowrap rounded-full border px-4 py-1.5 text-[11px] font-medium transition-all duration-200 ${
                        expandedSub === s.slug 
                          ? "border-[#5200FF] bg-white text-[#5200FF] shadow-sm" 
                          : "border-slate-200 bg-white text-slate-600 hover:border-[#5200FF]/50 hover:text-[#5200FF]"
                      }`}
                    >
                      {pick(s.name, lang)}
                      {s.children && s.children.length > 0 && (
                        <span className={`ml-2 text-[10px] ${expandedSub === s.slug ? "text-[#5200FF]" : "text-slate-400"}`}>
                          {expandedSub === s.slug ? "✓" : "▼"}
                        </span>
                      )}
                    </button>
                    {expandedSub === s.slug && s.children && s.children.length > 0 && (
                      <div className="flex flex-col gap-1.5 pl-3 border-l-2 border-[#5200FF]/20 mt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                        <button
                          type="button"
                          onClick={() => navigate({ to: "/category/$slug", params: { slug: activeCat.slug }, search: { sub: s.slug } })}
                          className="inline-flex w-auto self-start items-center gap-2 whitespace-nowrap px-3 py-2 rounded-lg bg-[#5200FF]/5 text-[10px] font-bold text-[#5200FF] transition-all hover:bg-[#5200FF]/10 active:scale-[0.98]"
                        >
                          <span className="size-1.5 rounded-full bg-[#5200FF]" />
                          {t("view_all") || "সব দেখুন"}
                        </button>
                        <div className="flex flex-col gap-1.5 items-start">
                          {s.children.map((child) => (
                            <button
                              key={child.slug}
                              type="button"
                              onClick={() => onChildClick(activeCat.slug, child.slug)}
                              className="group inline-flex w-auto self-start items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-lg bg-[#FEF8E6] text-[10px] text-slate-600 font-medium border border-[#F0E4BF] transition-all hover:border-[#5200FF]/40 hover:text-[#5200FF] hover:shadow-sm active:scale-[0.98]"
                            >
                              <span className="size-1 rounded-full bg-slate-300 group-hover:bg-[#5200FF] transition-colors" />
                              {pick(child.name, lang)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

