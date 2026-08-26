import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getMyDropshipper, listMyImports, buildDsShortLink, type Dropshipper, type DropshipperProduct } from "@/lib/dropshipper";
import { useLiveCatalog } from "@/lib/live-catalog";
import { toast } from "sonner";
import { appUrl } from "@/lib/app-url";
import { Copy, Download, MessageCircle, Facebook, QrCode, Sparkles, Link2, Instagram, Share2, MousePointer2, TrendingUp, Users, Calendar, Video, LayoutGrid, Zap } from "lucide-react";
import { getProductMarketingAssets } from "@/lib/marketing.functions";
import { getAffiliateReport, importProductVideoReview, createCustomShortLink, getShortLinkStats, getFeedLogs, trackShortLinkEvent } from "@/lib/marketing-pro.functions";
import { useServerFn } from "@tanstack/react-start";

import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/dropshipping/marketing")({
  head: () => ({ meta: [{ title: "Marketing tools — Dropshipping" }, { name: "robots", content: "noindex" }] }),
  component: MarketingPage,
});

const CAPTIONS_BN = [
  "🔥 নতুন কালেকশন লঞ্চ হলো! সীমিত স্টক, আজই অর্ডার করুন। 🚚 সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।",
  "💥 আমাদের বেস্ট সেলিং প্রোডাক্ট! ১০০% অরিজিনাল, ৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি।",
  "🎁 আজকের বিশেষ অফার! লিংকে ক্লিক করে অর্ডার করুন আর পেয়ে যান ফ্রি হোম ডেলিভারি।",
];
const CAPTIONS_EN = [
  "🔥 New collection is live! Grab yours before stock ends. 🚚 Cash on Delivery nationwide.",
  "💥 Our best seller — 100% original, 7-day easy replacement. Order now!",
  "🎁 Today's exclusive deal — free home delivery on your order. Tap the link.",
];
const HASHTAGS = "#bangladesh #onlineshopping #cashondelivery #shopping #dhaka #bd #newarrival #trending";

function MarketingPage() {
  const [ds, setDs] = useState<Dropshipper | null>(null);
  const [imports, setImports] = useState<DropshipperProduct[]>([]);
  const { products } = useLiveCatalog();
  const [selected, setSelected] = useState<string>("");
  const [utmSrc, setUtmSrc] = useState("facebook");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [assets, setAssets] = useState<any[]>([]);
  const fetchAssets = useServerFn(getProductMarketingAssets);
  const fetchAffiliateReport = useServerFn(getAffiliateReport);
  const importVideoReview = useServerFn(importProductVideoReview);
  const createShortLink = useServerFn(createCustomShortLink);
  const fetchShortLinkStats = useServerFn(getShortLinkStats);
  const fetchFeedLogs = useServerFn(getFeedLogs);

  const [linkStats, setLinkStats] = useState<any[]>([]);
  const [feedLogs, setFeedLogs] = useState<any[]>([]);
  const [report, setReport] = useState<{ clicks: any[], subAffiliates: any[], stats: { views: number; whatsapp: number; conversions: number } }>({ 
    clicks: [], 
    subAffiliates: [],
    stats: { views: 0, whatsapp: 0, conversions: 0 }
  });
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => { 
    getMyDropshipper().then(async d => { 
      setDs(d); 
      if (d) {
        setImports(await listMyImports(d.id));
        fetchAffiliateReport({ data: {} }).then(setReport);
        fetchShortLinkStats().then(setLinkStats);
        fetchFeedLogs().then(setFeedLogs);
      }
    }); 
  }, []);


  useEffect(() => {
    if (ds) fetchAffiliateReport({ data: { startDate: dateRange.start, endDate: dateRange.end } }).then(setReport);
  }, [dateRange]);

  useEffect(() => {
    if (selected) {
      fetchAssets({ data: { productId: selected } }).then(setAssets);
    } else {
      setAssets([]);
    }
  }, [selected]);


  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  if (!ds) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const buildUrl = (path?: string) => {
    const base = buildDsShortLink(ds.store_slug);
    if (!path && !utmSrc && !utmCampaign) return base;
    
    const url = new URL(path ? `${base}${path.startsWith("/") ? "" : "/"}${path}` : base);
    if (utmSrc) url.searchParams.set("s", utmSrc);
    if (utmCampaign) url.searchParams.set("c", utmCampaign);
    url.searchParams.set("m", "ds");
    return url.toString();
  };

  const currentUrl = buildUrl(selected ? `?p=${selected}` : undefined);
  const selectedProduct = selected ? productMap.get(selected) : null;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(currentUrl)}`;

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success("Copied"); } catch { toast.error("Copy failed"); }
  };
  const share = (network: "wa" | "fb" | "tg") => {
    const msg = selectedProduct?.title.en ? `${selectedProduct.title.en} — ৳${imports.find(i => i.product_id === selected)?.retail_price ?? ""}\n${currentUrl}` : `Check out my store: ${currentUrl}`;
    const u = network === "wa" ? `https://wa.me/?text=${encodeURIComponent(msg)}`
      : network === "fb" ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`
      : `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(msg)}`;
    window.open(u, "_blank");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Link2 className="h-4 w-4" />Build your share link</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="text-xs">
              <span className="font-semibold">Product (optional)</span>
              <select value={selected} onChange={e => setSelected(e.target.value)} className="mt-1 block w-full rounded border px-2 py-1.5 text-xs">
                <option value="">Whole store</option>
                {imports.map(i => {
                  const p = productMap.get(i.product_id);
                  return <option key={i.id} value={i.product_id}>{i.custom_title || p?.title.en || i.product_id.slice(0, 8)}</option>;
                })}
              </select>
            </label>
            <label className="text-xs">
              <span className="font-semibold">Source</span>
              <select value={utmSrc} onChange={e => setUtmSrc(e.target.value)} className="mt-1 block w-full rounded border px-2 py-1.5 text-xs">
                <option value="facebook">Facebook</option><option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option><option value="telegram">Telegram</option><option value="tiktok">TikTok</option><option value="direct">Direct</option>
              </select>
            </label>
            <label className="text-xs">
              <span className="font-semibold">Campaign name</span>
              <input value={utmCampaign} onChange={e => setUtmCampaign(e.target.value)} placeholder="eid_sale_25" className="mt-1 block w-full rounded border px-2 py-1.5 text-xs" />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <input readOnly value={currentUrl} className="min-w-[240px] flex-1 rounded border bg-muted/40 px-2 py-1.5 font-mono text-[11px]" />
            <button onClick={() => copy(currentUrl)} className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"><Copy className="h-3.5 w-3.5" />Copy</button>
            <button onClick={() => share("wa")} className="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-xs font-bold text-white"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</button>
            <button onClick={() => share("fb")} className="inline-flex items-center gap-1 rounded bg-blue-700 px-3 py-1.5 text-xs font-bold text-white"><Facebook className="h-3.5 w-3.5" />Facebook</button>
            <button onClick={() => share("tg")} className="rounded bg-sky-500 px-3 py-1.5 text-xs font-bold text-white">Telegram</button>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4" />Ready-to-post captions</h3>
          <p className="mb-2 text-[11px] text-muted-foreground">Tap any caption to copy. The link and hashtags are appended.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Bangla</p>
              <div className="space-y-1.5">
                {CAPTIONS_BN.map((c, i) => (
                  <button key={i} onClick={() => copy(`${c}\n\n${currentUrl}\n\n${HASHTAGS}`)} className="block w-full rounded border bg-muted/30 p-2 text-left text-xs hover:bg-muted">{c}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">English</p>
              <div className="space-y-1.5">
                {CAPTIONS_EN.map((c, i) => (
                  <button key={i} onClick={() => copy(`${c}\n\n${currentUrl}\n\n${HASHTAGS}`)} className="block w-full rounded border bg-muted/30 p-2 text-left text-xs hover:bg-muted">{c}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
            <TrendingUp className="h-4 w-4 text-primary" /> Performance Analytics
          </h3>
          <p className="mb-4 text-[11px] text-muted-foreground">Track your store's traffic and conversions over time.</p>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100 shadow-sm">
              <div className="flex justify-center mb-1"><MousePointer2 className="h-3 w-3 text-primary opacity-50" /></div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Views</div>
              <div className="text-xl font-black text-slate-900">{report.stats.views}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100 shadow-sm">
              <div className="flex justify-center mb-1"><MessageCircle className="h-3 w-3 text-green-500 opacity-50" /></div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">WhatsApp</div>
              <div className="text-xl font-black text-green-600">{report.stats.whatsapp}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100 shadow-sm">
              <div className="flex justify-center mb-1"><Users className="h-3 w-3 text-indigo-500 opacity-50" /></div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Sales</div>
              <div className="text-xl font-black text-indigo-600">{report.stats.conversions}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input 
                  type="date" 
                  className="text-[10px] border border-slate-200 pl-7 pr-2 py-1.5 rounded-lg bg-slate-50 outline-none focus:ring-1 focus:ring-primary/20" 
                  onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} 
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input 
                  type="date" 
                  className="text-[10px] border border-slate-200 pl-7 pr-2 py-1.5 rounded-lg bg-slate-50 outline-none focus:ring-1 focus:ring-primary/20" 
                  onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} 
                />
              </div>
            </div>
            <button 
              onClick={() => {
                const csv = "Date,Type,Source,Medium,Campaign\n" + report.clicks.map(c => 
                  `${format(new Date(c.created_at), "yyyy-MM-dd HH:mm")},Click,${c.utm_source || ''},${c.utm_medium || ''},${c.utm_campaign || ''}`
                ).join("\n");
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `store-report-${ds.store_slug}-${format(new Date(), 'yyyyMMdd')}.csv`;
                a.click();
                toast.success("Report downloaded");
              }}
              className="rounded-lg bg-slate-900 px-4 py-1.5 text-[10px] font-bold text-white flex items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Download className="h-3 w-3" /> Export CSV
            </button>
          </div>
        </div>

        {selectedProduct && (
          <div className="rounded-xl border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Instagram className="h-4 w-4 text-pink-600" /> Social Media Kit (One-Click)
            </h3>
            <p className="mb-4 text-[11px] text-muted-foreground">Ready-made templates for stories and posts. Download and share instantly.</p>
            
            {assets.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed p-8 text-center">
                <Sparkles className="mx-auto mb-2 h-6 w-6 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No custom marketing kits available for this product yet. Using default product images below.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {assets.map((asset) => (
                  <div key={asset.id} className="group relative overflow-hidden rounded-lg border bg-muted/20">
                    <img src={asset.image_url} alt={asset.type} className="aspect-[4/5] w-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-white backdrop-blur-sm transition-transform translate-y-full group-hover:translate-y-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="min-w-0">
                          <span className="block truncate text-[9px] font-bold uppercase tracking-wider">{asset.platform} {asset.type}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => copy(asset.image_url)} className="rounded bg-white/20 p-1 hover:bg-white/40" title="Copy URL">
                              <Copy className="h-3 w-3" />
                          </button>
                          <a href={asset.image_url} download target="_blank" rel="noreferrer" className="rounded bg-white p-1 text-black hover:bg-white/90" title="Download">
                              <Download className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Product Gallery Assets</h4>
              <div className="flex flex-wrap gap-2">
                {(selectedProduct.gallery?.length ? selectedProduct.gallery : [selectedProduct.image]).filter(Boolean).map((g, i) => (
                  <a key={i} href={g!} download target="_blank" rel="noreferrer" className="group relative overflow-hidden rounded-lg border shadow-sm">
                    <img src={g!} alt="" className="h-20 w-20 object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Download className="h-4 w-4 text-white" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
            <Share2 className="h-4 w-4" /> Multi-level Affiliate Network
          </h3>
          <p className="text-xs leading-relaxed text-slate-600">
            Did you know? You can recruit sub-affiliates to sell this product. You'll earn a percentage of every sale they make.
          </p>
          <div className="mt-3 flex gap-2">
            <input readOnly value={buildUrl(`?ref=${ds.code}`)} className="flex-1 rounded border bg-white px-2 py-1.5 font-mono text-[10px]" />
            <button onClick={() => copy(buildUrl(`?ref=${ds.code}`))} className="rounded bg-primary px-3 py-1.5 text-[10px] font-bold text-white hover:brightness-110">
              Invite Sub-Affiliate
            </button>
          </div>

          {report.subAffiliates.length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Your Network</h4>
              <div className="max-h-40 overflow-auto rounded-lg border bg-white shadow-sm">
                <table className="w-full text-left text-[11px]">
                  <thead className="sticky top-0 bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Store</th>
                      <th className="px-3 py-2">Joined</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report.subAffiliates.map(sub => (
                      <tr key={sub.id}>
                        <td className="px-3 py-2 font-bold">{sub.store_name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{format(new Date(sub.created_at), "MMM d, yyyy")}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${sub.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
            <Video className="h-4 w-4 text-rose-500" /> Video Review Import
          </h3>
          <p className="mb-4 text-[11px] text-muted-foreground">Import product reviews from YouTube or Facebook to showcase on your store.</p>
          
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const url = (form.elements.namedItem('url') as HTMLInputElement).value;
              const prodId = (form.elements.namedItem('productId') as HTMLSelectElement).value;
              
              if (!url || !prodId) return toast.error("Please fill all fields");
              
              try {
                const platform = url.includes('youtube.com') || url.includes('youtu.be') ? 'youtube' : 'facebook';
                await importVideoReview({ data: { productId: prodId, videoUrl: url, platform } });
                toast.success("Video review imported!");
                form.reset();
              } catch (err: any) {
                toast.error(err.message);
              }
            }}
            className="grid gap-2"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <select name="productId" className="rounded-lg border px-3 py-2 text-[12px] bg-slate-50 focus:ring-1 focus:ring-primary/20 outline-none">
                <option value="">Select Product</option>
                {imports.map(i => {
                  const p = productMap.get(i.product_id);
                  return <option key={i.id} value={i.product_id}>{i.custom_title || p?.title.en || i.product_id.slice(0, 8)}</option>;
                })}
              </select>
              <input name="url" placeholder="Paste YouTube or Facebook video URL" className="rounded-lg border px-3 py-2 text-[12px] bg-slate-50 focus:ring-1 focus:ring-primary/20 outline-none" />
            </div>
            <button type="submit" className="rounded-lg bg-rose-500 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-600 transition-colors">Import Video Review</button>
          </form>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 flex items-center justify-between text-sm font-bold text-slate-800">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-blue-500" /> Facebook Shop Auto-Feed
            </div>
            {feedLogs[0] && (
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${feedLogs[0].status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                Last Sync: {feedLogs[0].status}
              </span>
            )}
          </h3>
          <p className="mb-4 text-[11px] text-muted-foreground">Automatically sync your products to Facebook Commerce Manager catalog.</p>
          
          <div className="space-y-3">
            <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3">
              <div className="text-[10px] font-bold text-blue-800 uppercase mb-1">Your Feed URL</div>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={appUrl(`/api/public/ds-feed/${ds.store_slug}`)} 
                  className="flex-1 rounded border bg-white px-2 py-1.5 font-mono text-[10px]" 
                />
                <button 
                  onClick={() => copy(appUrl(`/api/public/ds-feed/${ds.store_slug}`))}
                  className="rounded bg-blue-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-blue-700"
                >
                  Copy
                </button>
              </div>
            </div>

            {feedLogs.length > 0 && (
              <div className="rounded-lg border bg-slate-50 p-2">
                <div className="text-[9px] font-bold uppercase text-muted-foreground mb-2">Sync History</div>
                <div className="space-y-1.5 max-h-32 overflow-auto">
                  {feedLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between text-[10px] border-b border-slate-200 pb-1 last:border-0">
                      <span className="text-muted-foreground">{format(new Date(log.created_at), "MMM d, HH:mm")}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.item_count} items</span>
                        <span className={log.status === 'success' ? 'text-green-600' : 'text-red-600 font-bold'}>
                          {log.status === 'success' ? 'Success' : 'Error'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={async () => {
                const toastId = toast.loading("Triggering sync...");
                try {
                  await fetch(appUrl(`/api/public/ds-feed/${ds.store_slug}`));
                  fetchFeedLogs().then(setFeedLogs);
                  toast.success("Sync triggered successfully", { id: toastId });
                } catch (e) {
                  toast.error("Sync failed", { id: toastId });
                }
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <Zap className="h-3.5 w-3.5" /> Force Sync Multiple Products
            </button>
          </div>
        </div>


        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
            <Zap className="h-4 w-4 text-amber-500" /> Custom Short-Link Alias
          </h3>
          <p className="mb-4 text-[11px] text-muted-foreground">Create ultra-short, memorable links like /go/summer-deal.</p>
          
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const alias = (form.elements.namedItem('alias') as HTMLInputElement).value;
              const prodId = (form.elements.namedItem('productId') as HTMLSelectElement).value;
              
              if (!alias) return toast.error("Alias is required");
              
              try {
                await createShortLink({ data: { productId: prodId || undefined, alias: alias.toLowerCase().trim() } });
                toast.success("Short alias created!");
                form.reset();
                fetchShortLinkStats().then(setLinkStats);
              } catch (err: any) {
                toast.error(err.message);
              }
            }}
            className="grid gap-2"
          >
            <div className="grid gap-2 sm:grid-cols-2">
               <select name="productId" className="rounded-lg border px-3 py-2 text-[12px] bg-slate-50 focus:ring-1 focus:ring-primary/20 outline-none">
                <option value="">Whole store (Optional)</option>
                {imports.map(i => {
                  const p = productMap.get(i.product_id);
                  return <option key={i.id} value={i.product_id}>{i.custom_title || p?.title.en || i.product_id.slice(0, 8)}</option>;
                })}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-muted-foreground">/go/</span>
                <input name="alias" placeholder="summer-deal" className="flex-1 rounded-lg border px-3 py-2 text-[12px] bg-slate-50 focus:ring-1 focus:ring-primary/20 outline-none" />
              </div>
            </div>
            <button type="submit" className="rounded-lg bg-amber-500 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition-colors">Create Alias</button>
          </form>

          {linkStats.length > 0 && (
            <div className="mt-6">
              <div className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Link Performance</div>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-[10px] text-left">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-2 py-1.5">Alias</th>
                      <th className="px-2 py-1.5 text-center">Views</th>
                      <th className="px-2 py-1.5 text-center">Cart</th>
                      <th className="px-2 py-1.5 text-center">Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {linkStats.map(link => (
                      <tr key={link.id}>
                        <td className="px-2 py-1.5 font-mono text-primary">/go/{link.alias}</td>
                        <td className="px-2 py-1.5 text-center font-bold">{link.views_count}</td>
                        <td className="px-2 py-1.5 text-center text-amber-600">{link.cart_adds_count}</td>
                        <td className="px-2 py-1.5 text-center text-green-600">{link.conversions_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>


      </div>

      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4 text-center">
          <h3 className="mb-2 flex items-center justify-center gap-2 text-sm font-bold"><QrCode className="h-4 w-4" />Scan-to-visit QR code</h3>
          <img src={qrUrl} alt="QR" className="mx-auto h-56 w-56 rounded border bg-white" />
          <a href={qrUrl} download="store-qr.png" className="mt-2 inline-flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"><Download className="h-3.5 w-3.5" />Download QR</a>
          <p className="mt-2 text-[10px] text-muted-foreground">Print on flyers, business cards, or gift receipts.</p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-1 text-sm font-bold">WhatsApp broadcast template</h3>
          <textarea
            readOnly
            value={`আসসালামু আলাইকুম!\n\nআমাদের নতুন কালেকশন দেখুন — ${currentUrl}\n\n✅ ক্যাশ অন ডেলিভারি\n✅ ৭ দিনের রিপ্লেসমেন্ট\n📞 যোগাযোগ: ${ds.whatsapp || ds.phone}`}
            className="mt-1 h-40 w-full rounded border bg-muted/30 p-2 text-xs"
          />
          <button
            onClick={() => copy(`আসসালামু আলাইকুম!\n\nআমাদের নতুন কালেকশন দেখুন — ${currentUrl}\n\n✅ ক্যাশ অন ডেলিভারি\n✅ ৭ দিনের রিপ্লেসমেন্ট\n📞 যোগাযোগ: ${ds.whatsapp || ds.phone}`)}
            className="mt-2 w-full rounded bg-green-600 py-1.5 text-xs font-bold text-white">Copy broadcast text</button>
        </div>
      </div>
    </div>
  );
}
