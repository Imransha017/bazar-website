import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyVendor, type Vendor } from "@/lib/vendor";
import { slugify, type DBProduct } from "@/lib/admin-api";
import { Plus, Pencil, Trash2, Search, Eye, LayoutGrid, List, X, Star, Package, Tag, Truck, Info, Upload, Download, AlertTriangle } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { ProductEditModal, emptyProduct } from "@/components/ProductEditModal";
import { ProductImage } from "@/components/ProductImage";

export const Route = createFileRoute("/vendor/products")({
  component: VendorProducts,
});

function VendorProducts() {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [cats, setCats] = useState<Array<{ slug: string; name: string }>>([]);
  const [editing, setEditing] = useState<Partial<DBProduct> | null>(null);
  const [viewing, setViewing] = useState<DBProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showBulk, setShowBulk] = useState(false);


  const reload = async (vid: string) => {
    const { data } = await supabase.from("products").select("*").eq("vendor_id", vid).order("created_at", { ascending: false });
    setProducts((data ?? []) as unknown as DBProduct[]);
  };

  useEffect(() => {
    (async () => {
      const v = await getMyVendor();
      if (!v) { setLoading(false); return; }
      setVendor(v);
      const { data: cs } = await supabase.from("categories").select("slug,name").order("sort_order");
      setCats((cs ?? []) as Array<{ slug: string; name: string }>);
      await reload(v.id);
      setLoading(false);
    })();
  }, []);

  const save = async (nextItem?: Partial<DBProduct>) => {
    const current = nextItem ?? editing;
    if (!current || !vendor) return;
    const name = current.name?.trim();
    if (!name) return toast.error("Name required");
    if (!current.image) return toast.error("Main image required");
    const payload = {
      name,
      slug: current.slug?.trim() || slugify(name),
      description: current.description ?? "",
      short_description: current.short_description || null,
      price: Number(current.price) || 0,
      original_price: current.original_price ? Number(current.original_price) : null,
      dropshipper_price: (current as any).dropshipper_price ? Number((current as any).dropshipper_price) : null,
      discount_percent: current.discount_percent ? Number(current.discount_percent) : null,
      offer_starts_at: current.offer_starts_at || null,
      offer_ends_at: current.offer_ends_at || null,
      image: current.image,
      gallery: current.gallery ?? [],
      video_url: current.video_url || null,
      category_slug: current.category_slug || null,
      category_name: (current as any).category_name || null,
      subcategory_slug: current.subcategory_slug || null,
      subcategory_name: (current as any).subcategory_name || null,
      option_slug: (current as any).option_slug || null,
      option_name: (current as any).option_name || null,
      brand: current.brand || null,
      sku: current.sku || null,
      badge: current.badge || null,
      stock: Number(current.stock) || 0,
      weight: current.weight ? Number(current.weight) : null,
      warranty: current.warranty || null,
      return_days: current.return_days ? Number(current.return_days) : 7,
      free_shipping: !!current.free_shipping,
      cod_available: current.cod_available ?? true,
      tags: current.tags ?? [],
      colors: current.colors ?? [],
      sizes: current.sizes ?? [],
      variants: current.variants ?? [],
      specifications: current.specifications ?? [],
      meta_title: current.meta_title || null,
      meta_description: current.meta_description || null,
      is_active: current.is_active ?? true,
      vendor_id: vendor.id,
    };
    const { error } = current.id
      ? await supabase.from("products").update(payload).eq("id", current.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null);
    await reload(vendor.id);
  };

  const del = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setProducts(p => p.filter(x => x.id !== id));
  };

  if (loading) return <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!vendor) return <div className="py-12 text-center text-sm text-muted-foreground">No vendor account found.</div>;

  const filtered = products.filter(p => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return p.name.toLowerCase().includes(s) || (p.category_slug || "").toLowerCase().includes(s) || (p.sku || "").toLowerCase().includes(s);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">My Products</h1>
          <p className="text-xs text-muted-foreground">{products.length} products in your store</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border bg-card p-0.5">
            <button
              onClick={() => setView("grid")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
          </div>
          <button onClick={() => setShowBulk(true)} className="flex items-center gap-1 rounded-lg border bg-card px-3 py-2 text-sm font-bold shadow-sm hover:bg-muted">
            <Upload className="h-4 w-4" /> Bulk Upload
          </button>
          <button onClick={() => setEditing({ ...emptyProduct })} className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-sky-500 via-pink-500 to-purple-600 px-4 py-2 text-sm font-bold text-white shadow">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>

      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, category or SKU…" className="w-full rounded border bg-card py-2 pl-9 pr-3 text-sm" />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg bg-card py-12 text-center text-sm text-muted-foreground shadow-sm">No products yet. Add your first product.</div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map(p => {
            const discount = p.original_price && Number(p.original_price) > Number(p.price)
              ? Math.round(((Number(p.original_price) - Number(p.price)) / Number(p.original_price)) * 100)
              : 0;
            return (
              <div key={p.id} className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition hover:border-primary hover:shadow-md">
                <div className="relative aspect-square w-full overflow-hidden bg-muted">
                  <ProductImage src={p.image} alt={p.name} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  {discount > 0 && (
                    <span className="absolute right-1.5 top-1.5 rounded bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white shadow">-{discount}%</span>
                  )}
                  <span className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${p.is_active ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
                    {p.is_active ? "Live" : "Off"}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => setViewing(p)} title="View details" className="grid size-7 place-items-center rounded-full bg-white text-primary shadow hover:scale-110"><Eye className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setEditing(p)} title="Edit" className="grid size-7 place-items-center rounded-full bg-white text-blue-600 shadow hover:scale-110"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => del(p.id)} title="Delete" className="grid size-7 place-items-center rounded-full bg-white text-destructive shadow hover:scale-110"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-2">
                  <p title={p.name} className="line-clamp-2 text-xs font-medium leading-tight text-foreground">{p.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-primary">৳{Number(p.price).toFixed(0)}</span>
                    {p.original_price && Number(p.original_price) > Number(p.price) && (
                      <span className="text-[10px] text-muted-foreground line-through">৳{Number(p.original_price).toFixed(0)}</span>
                    )}
                  </div>
                  {Number((p as any).dropshipper_price) > 0 && (
                    <div className="flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                      <Truck className="h-3 w-3" /> DS ৳{Number((p as any).dropshipper_price).toFixed(0)}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className={Number(p.stock) < 10 ? "font-bold text-rose-600 flex items-center gap-0.5" : ""}>
                      {Number(p.stock) < 10 && <AlertTriangle className="h-2.5 w-2.5" />}
                      Stock: {p.stock}
                    </span>
                    <span className="truncate">{p.category_slug || "—"}</span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="p-3 text-left">Image</th>
                  <th className="text-left">Name</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">DS Price</th>
                  <th className="text-right">Stock</th>
                  <th className="text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <ProductImage src={p.image} alt={p.name} className="h-12 w-12 rounded object-cover" />
                    </td>
                    <td>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.category_slug || "—"} · SKU: {p.sku || "—"}</div>
                    </td>
                    <td className="text-right font-bold">৳{Number(p.price).toFixed(0)}</td>
                    <td className="text-right">
                      {Number((p as any).dropshipper_price) > 0 ? (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">৳{Number((p as any).dropshipper_price).toFixed(0)}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className={`text-right ${Number(p.stock) < 10 ? "font-bold text-rose-600" : ""}`}>
                      <div className="flex items-center justify-end gap-1">
                        {Number(p.stock) < 10 && <AlertTriangle className="h-3 w-3" />}
                        {p.stock}
                      </div>
                    </td>

                    <td className="text-center">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {p.is_active ? "Live" : "Off"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => setViewing(p)} title="View" className="mr-1 rounded p-1 text-primary hover:bg-muted"><Eye className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setEditing(p)} title="Edit" className="mr-1 rounded p-1 hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => del(p.id)} title="Delete" className="rounded p-1 text-destructive hover:bg-muted"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <ProductEditModal
          item={editing}
          setItem={setEditing}
          onSave={save}
          onClose={() => setEditing(null)}
          hideFeatured
          categories={cats}
        />
      )}

      {viewing && <ProductViewModal product={viewing} onClose={() => setViewing(null)} onEdit={() => { setEditing(viewing); setViewing(null); }} />}
      {showBulk && vendor && <BulkUploadModal vendorId={vendor.id} onClose={() => setShowBulk(false)} onComplete={() => { setShowBulk(false); reload(vendor.id); }} />}
    </div>

  );
}

function ProductViewModal({ product, onClose, onEdit }: { product: DBProduct; onClose: () => void; onEdit: () => void }) {
  const p = product as any;
  const gallery: string[] = Array.isArray(p.gallery) ? p.gallery : [];
  const allImages = [p.image, ...gallery.filter((g: string) => g && g !== p.image)];
  const [active, setActive] = useState(0);
  const [tab, setTab] = useState<"desc" | "specs">("desc");
  
  const price = Number(p.price || 0);
  const mrp = Number(p.original_price || 0);
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  
  const dsPrice = Number(p.dropshipper_price) > 0 ? Number(p.dropshipper_price) : null;
  const margin = dsPrice ? price - dsPrice : null;

  const specs: { key: string; value: string }[] = Array.isArray(p.specifications) ? p.specifications : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
      <div className="h-full w-full max-w-6xl overflow-y-auto bg-white shadow-2xl sm:h-auto sm:max-h-[95vh] sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        {/* Header/Top Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/95 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Package className="h-3.5 w-3.5" />
            Product Preview
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-black text-white hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
              <Pencil className="h-3.5 w-3.5" /> Edit Product
            </button>
            <button onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-3 py-6 md:px-6">
          <div className="grid gap-6 md:grid-cols-[minmax(0,440px)_minmax(0,1fr)] md:gap-8">
            {/* Gallery Section */}
            <div>
              <div className="relative aspect-square overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-50 to-slate-100">
                <ProductImage src={allImages[active]} alt={p.name} className="size-full object-cover" />
                {discount > 0 && (
                  <span className="absolute left-4 top-4 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-black text-white shadow-lg">-{discount}%</span>
                )}
                <span className={`absolute right-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-black shadow-lg ${p.is_active ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
                  {p.is_active ? "● LIVE" : "● HIDDEN"}
                </span>
              </div>
              {allImages.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      className={`relative aspect-square w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${i === active ? "border-primary scale-105 shadow-md" : "border-transparent opacity-60 hover:opacity-100"}`}
                    >
                      <ProductImage src={img} alt="" className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details Section */}
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {p.brand && <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{p.brand}</span>}
                {p.badge && <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">{p.badge}</span>}
                {p.sku && <span>SKU: {p.sku}</span>}
              </div>

              <h1 className="text-2xl font-black leading-tight text-slate-900 md:text-3xl">{p.name}</h1>

              {p.short_description && (
                <p className="text-sm font-medium leading-relaxed text-slate-500">{p.short_description}</p>
              )}

              <div className="py-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-primary">৳{price.toLocaleString()}</span>
                  {mrp > price && (
                    <span className="text-lg font-bold text-slate-300 line-through">৳{mrp.toLocaleString()}</span>
                  )}
                </div>
                {discount > 0 && (
                  <p className="mt-1 text-xs font-bold text-rose-500">অফার মূল্য: {discount}% ছাড়</p>
                )}
              </div>

              {/* Vendor Specific: DS Info */}
              {dsPrice !== null && (
                <div className="grid grid-cols-2 gap-3 rounded-2xl border-2 border-amber-100 bg-amber-50/50 p-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-600">Purchase Price (DS)</div>
                    <div className="text-xl font-black text-amber-700">৳{dsPrice.toLocaleString()}</div>
                  </div>
                  {margin !== null && (
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-amber-600">Your Profit</div>
                      <div className="text-xl font-black text-emerald-600">৳{margin.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold sm:grid-cols-3">
                <InfoBox label="Stock" value={String(p.stock ?? 0)} />
                <InfoBox label="Category" value={p.category_slug || "—"} />
                {p.weight && <InfoBox label="Weight" value={`${p.weight} kg`} />}
                {p.warranty && <InfoBox label="Warranty" value={p.warranty} />}
                <InfoBox label="Free Ship" value={p.free_shipping ? "Yes" : "No"} />
                <InfoBox label="Returns" value={`${p.return_days ?? 7} Days`} />
              </div>

              {(p.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {(p.tags as string[]).map((t) => (
                    <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500">#{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description & Specs Tabs */}
          <section className="mt-10 overflow-hidden rounded-2xl border bg-slate-50/30">
            <div className="flex gap-1 border-b bg-white px-2">
              {(["desc", "specs"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`relative px-6 py-4 text-xs font-black uppercase tracking-widest transition-all ${tab === k ? "text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
                >
                  {k === "desc" ? "Description" : "Specifications"}
                  {tab === k && <span className="absolute inset-x-4 bottom-0 h-1 rounded-t-full bg-primary shadow-lg shadow-primary/20" />}
                </button>
              ))}
            </div>
            <div className="p-6 text-sm leading-relaxed text-slate-600">
              {tab === "desc" ? (
                p.description ? (
                  <p className="whitespace-pre-wrap font-medium">{p.description}</p>
                ) : (
                  <p className="italic text-slate-400">No description provided for this product.</p>
                )
              ) : specs.length ? (
                <div className="max-w-2xl overflow-hidden rounded-xl border bg-white shadow-sm">
                  <table className="w-full text-left">
                    <tbody>
                      {specs.map((s, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="w-1/3 bg-slate-50/50 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">{s.key}</td>
                          <td className="px-4 py-3 font-bold text-slate-700">{s.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="italic text-slate-400">No specifications listed for this product.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-2.5 shadow-sm">
      <div className="mb-0.5 text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</div>
      <div className="truncate text-slate-900">{value}</div>
    </div>
  );
}

function BulkUploadModal({ vendorId, onClose, onComplete }: { vendorId: string; onClose: () => void; onComplete: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [results, setResults] = useState<{ success: number; errors: { row: any; message: string }[] } | null>(null);

  const downloadTemplate = () => {
    const csv = Papa.unparse([
      { name: "Sample Product", price: 1000, dropshipper_price: 800, stock: 50, category_slug: "electronics", sku: "SKU123", image: "https://example.com/img.jpg" }
    ]);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_template.csv";
    a.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreviewData(results.data);
      }
    });
  };

  const handleUpload = async () => {
    if (!previewData) return;
    setLoading(true);
    let success = 0;
    const errors: { row: any; message: string }[] = [];

    for (const row of previewData) {
      try {
        if (!row.name || !row.price) {
          throw new Error("Name and price are required.");
        }

        const payload = {
          vendor_id: vendorId,
          name: row.name,
          slug: slugify(row.name) + "-" + Math.random().toString(36).slice(2, 7),
          price: Number(row.price),
          dropshipper_price: Number(row.dropshipper_price || row.price),
          stock: Number(row.stock || 0),
          category_slug: row.category_slug || null,
          sku: row.sku || null,
          image: row.image || "https://placehold.co/600x600?text=No+Image",
          is_active: true,
        };

        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        success++;
      } catch (e: any) {
        errors.push({ row, message: e.message });
      }
    }
    setResults({ success, errors });
    setLoading(false);
  };

  const downloadErrorReport = () => {
    if (!results || results.errors.length === 0) return;
    const data = results.errors.map(err => ({
      ...err.row,
      IMPORT_ERROR: err.message
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import_errors.csv";
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-black">Bulk Upload Products</h2>
          <button onClick={onClose} className="rounded-full bg-slate-100 p-2 hover:bg-slate-200"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {!results ? (
            <>
              <p className="text-sm text-slate-500">Upload a CSV file to add multiple products at once. Use our template for correct formatting.</p>
              <button onClick={downloadTemplate} className="flex items-center gap-2 text-xs font-bold text-primary hover:underline">
                <Download className="h-3 w-3" /> Download CSV Template
              </button>
              
              {!previewData ? (
                <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
                  <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" id="csv-upload" />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-slate-300" />
                    <div className="mt-2 text-sm font-bold text-slate-900">Select CSV file</div>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Preview ({previewData.length} rows)</span>
                    <button onClick={() => { setFile(null); setPreviewData(null); }} className="text-xs font-bold text-rose-500 hover:underline">Change File</button>
                  </div>
                  <div className="rounded-xl border overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-3 py-2 font-black">Name</th>
                          <th className="px-3 py-2 font-black">Price</th>
                          <th className="px-3 py-2 font-black">Stock</th>
                          <th className="px-3 py-2 font-black">SKU</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="px-3 py-2 truncate max-w-[150px]">{row.name || "—"}</td>
                            <td className="px-3 py-2">{row.price || "—"}</td>
                            <td className="px-3 py-2">{row.stock || "0"}</td>
                            <td className="px-3 py-2">{row.sku || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewData.length > 5 && (
                      <div className="p-2 text-center text-slate-400 italic text-[10px]">And {previewData.length - 5} more rows...</div>
                    )}
                  </div>
                </div>
              )}
              
              <button
                disabled={!previewData || loading}
                onClick={handleUpload}
                className="w-full rounded-xl bg-primary py-3 text-sm font-black text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Processing..." : `Import ${previewData?.length || 0} Products`}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-50 p-4 text-center">
                  <div className="text-2xl font-black text-emerald-600">{results.success}</div>
                  <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Successful</div>
                </div>
                <div className={`rounded-xl p-4 text-center ${results.errors.length > 0 ? "bg-rose-50" : "bg-slate-50"}`}>
                  <div className={`text-2xl font-black ${results.errors.length > 0 ? "text-rose-600" : "text-slate-400"}`}>{results.errors.length}</div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${results.errors.length > 0 ? "text-rose-700" : "text-slate-500"}`}>Failed</div>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Error Summary</div>
                    <button onClick={downloadErrorReport} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                      <Download className="h-3.5 w-3.5" /> Download Error Report
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto rounded-xl bg-rose-50/50 border border-rose-100 p-3 space-y-2">
                    {results.errors.slice(0, 20).map((err, i) => (
                      <div key={i} className="text-[11px] leading-tight">
                        <span className="font-black text-rose-700">Row {i + 1}:</span>{" "}
                        <span className="text-slate-600">{err.message}</span>
                        <div className="mt-0.5 text-[10px] text-slate-400 truncate">Data: {JSON.stringify(err.row)}</div>
                      </div>
                    ))}
                    {results.errors.length > 20 && (
                      <div className="text-[10px] text-center text-slate-400 pt-1">...and {results.errors.length - 20} more errors.</div>
                    )}
                  </div>
                </div>
              )}
              
              <button onClick={onComplete} className="w-full rounded-xl bg-slate-900 py-3 text-sm font-black text-white shadow-lg">Back to Products</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
