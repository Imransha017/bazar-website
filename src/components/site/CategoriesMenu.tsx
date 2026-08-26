import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, LayoutGrid, X } from "lucide-react";
import { useLiveCatalog } from "@/lib/live-catalog";
import { useI18n, pick } from "@/lib/i18n";

export function CategoriesMenu({ variant = "bar" }: { variant?: "bar" | "compact" }) {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const { categories, loading } = useLiveCatalog();
  const [active, setActive] = useState<string | undefined>(undefined);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  // Reset active category and expanded sub when menu opens
  useEffect(() => {
    if (open && categories.length > 0 && !active) {
      setActive(categories[0].slug);
      setExpandedSub(null);
    }
  }, [open, categories, active]);

  const activeCat = categories.find((c) => c.slug === active) ?? categories[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          variant === "bar"
            ? "flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            : "flex items-center gap-2 rounded-md bg-white/15 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/25"
        }
      >
        <LayoutGrid className="size-4" />
        <span>{t("categories")}</span>
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/20 md:bg-transparent" 
            onClick={() => setOpen(false)} 
          />
          <div className="fixed left-1/2 top-[70px] z-50 flex w-[96vw] -translate-x-1/2 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl md:absolute md:left-0 md:top-[calc(100%+6px)] md:w-[min(94vw,760px)] md:translate-x-0">
            <div className="grid grid-cols-[100px_1fr] md:grid-cols-[220px_1fr] max-h-[75vh]">
              {/* Sidebar: Categories */}
              <ul className="overflow-y-auto border-r border-border bg-white py-1 text-sm no-scrollbar">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <button
                      onPointerEnter={(e) => { if (e.pointerType === "mouse") setActive(c.slug); }}
                      onClick={() => { setActive(c.slug); setExpandedSub(null); }}
                      className={`group flex w-full flex-col items-center gap-1 border-b border-slate-50 px-1 py-2 text-center transition-colors duration-200 md:flex-row md:justify-between md:px-3 md:py-2 md:text-left ${
                        active === c.slug 
                          ? "bg-slate-50 font-bold text-[#5200FF]" 
                          : "text-[#333] hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1 md:flex-row md:gap-1.5">
                        {c.image ? (
                          <img src={c.image} alt="" className="size-8 shrink-0 rounded-full object-contain bg-[#F8F9FA] p-0.5 ring-1 ring-slate-200 md:size-7 md:rounded md:ring-0" />
                        ) : (
                          <span className="text-[14px] leading-none">{c.icon}</span>
                        )}
                        <span className="line-clamp-2 text-[9px] md:line-clamp-1 md:text-[12px]">{pick(c.name, lang)}</span>
                      </div>
                      <ChevronRight className={`hidden size-3 shrink-0 text-slate-300 transition-transform md:block ${active === c.slug ? "translate-x-0.5 text-[#5200FF]" : ""}`} />
                    </button>
                  </li>
                ))}
              </ul>

              {/* Content Area: Subcategories & Options */}
              <div className="overflow-y-auto bg-white p-2 md:p-6 no-scrollbar relative">
                <button 
                  onClick={() => setOpen(false)}
                  className="absolute right-2 top-2 text-slate-300 hover:text-slate-500 transition-colors md:right-4 md:top-4"
                >
                  <X className="size-4" />
                </button>

                {activeCat ? (
                  <div className="space-y-2 md:space-y-5">
                    {/* Header with Icon and View All */}
                    <div className="flex items-center gap-2 mb-2 md:items-start md:gap-4 md:mb-6">
                      <div className="size-10 md:size-16 shrink-0 overflow-hidden rounded bg-[#F8F9FA] p-1 shadow-sm border border-slate-100">
                        <img src={activeCat.image} alt="" className="size-full object-contain" />
                      </div>
                      <div className="flex min-w-0 flex-col md:pt-1">
                        <div className="truncate text-[12px] font-black text-[#333] tracking-tight md:text-lg">{pick(activeCat.name, lang)}</div>
                        <Link
                          to="/category/$slug"
                          params={{ slug: activeCat.slug }}
                          search={{ sub: undefined }}
                          onClick={() => setOpen(false)}
                          className="text-[9px] text-[#5200FF] font-bold hover:underline md:text-[11px]"
                        >
                          View All →
                        </Link>
                      </div>
                    </div>
                    
                    {/* Subcategories */}
                    <div className="flex flex-col gap-1 md:gap-2">
                      {activeCat.subcategories.map((s) => (
                        <div key={s.slug} className="flex flex-col gap-0.5 items-start md:gap-2">
                          <div className="flex items-center gap-1">
                            <Link
                              to="/category/$slug"
                              params={{ slug: activeCat.slug }}
                              search={{ sub: s.slug }}
                              onClick={() => setOpen(false)}
                              className={`group flex items-center justify-between gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold transition-all duration-300 md:gap-2 md:px-4 md:py-2 md:text-[12px] ${
                                expandedSub === s.slug 
                                  ? "border-[#5200FF] bg-[#5200FF]/5 text-[#5200FF] shadow-sm" 
                                  : "border-slate-200 bg-white text-slate-600 hover:border-[#5200FF]/50 hover:text-[#5200FF]"
                              }`}
                            >
                              <span>{pick(s.name, lang)}</span>
                            </Link>
                            {s.children && s.children.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setExpandedSub(prev => prev === s.slug ? null : s.slug)}
                                className={`grid size-6 shrink-0 place-items-center rounded-full border text-[9px] transition-all md:size-7 ${
                                  expandedSub === s.slug
                                    ? "border-[#5200FF] bg-[#5200FF]/5 text-[#5200FF]"
                                    : "border-slate-200 bg-white text-slate-400 hover:border-[#5200FF]/50 hover:text-[#5200FF]"
                                }`}
                                aria-label={`${expandedSub === s.slug ? "Hide" : "Show"} ${pick(s.name, lang)} options`}
                              >
                                {expandedSub === s.slug ? "✓" : "▼"}
                              </button>
                            )}
                          </div>

                          {/* Options Tree/Dropdown */}
                          {expandedSub === s.slug && s.children && s.children.length > 0 && (
                            <div className="flex flex-col gap-1 pl-2 border-l-2 border-[#5200FF]/20 mt-0.5 animate-in fade-in slide-in-from-left-2 duration-300 w-full">
                              <Link
                                to="/category/$slug"
                                params={{ slug: activeCat.slug }}
                                search={{ sub: s.slug }}
                                onClick={() => setOpen(false)}
                                className="inline-flex w-auto self-start items-center gap-1.5 whitespace-nowrap px-2 py-1 rounded-md bg-[#5200FF]/5 text-[9px] font-bold text-[#5200FF] transition-all hover:bg-[#5200FF]/10"
                              >
                                <span className="size-1 rounded-full bg-[#5200FF]" />
                                {t("view_all") || "সব দেখুন"}
                              </Link>
                              
                              <div className="flex flex-col gap-1 items-start">
                                {s.children.map((child) => (
                                  <Link
                                    key={child.slug}
                                    to="/category/$slug"
                                    params={{ slug: activeCat.slug }}
                                    search={{ sub: child.slug }}
                                    onClick={() => setOpen(false)}
                                    className="group inline-flex w-auto self-start items-center gap-1.5 whitespace-nowrap px-2 py-1 rounded-md bg-[#FEF8E6] text-[9px] text-slate-600 font-medium border border-[#F0E4BF] transition-all hover:border-[#5200FF]/40 hover:text-[#5200FF] hover:shadow-sm"
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
                  <div className="flex h-40 flex-col items-center justify-center text-center opacity-30">
                    <LayoutGrid className="mb-2 size-10" />
                    <p className="text-sm">{loading ? t("loading") : t("no_products")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
