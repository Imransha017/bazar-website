import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, Trash2, X, ShoppingBag, Clock, Download, FileText, Truck, Send, Info } from "lucide-react";
import { submitToCourier } from "@/lib/courier.functions";
import type { DBOrder } from "@/lib/admin-api";
import { PageHeader, Surface, GhostButton, DangerButton, SelectInput, Modal, Badge } from "@/lib/admin-ui";
import { OrderTimeline } from "@/components/OrderTimeline";
import { recordAuditLog } from "@/lib/audit.functions";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { exportToCSV, formatOrdersForExport } from "@/lib/export-utils";
import { ProductImage } from "@/components/ProductImage";
import { openPrintableInvoice } from "@/lib/print-invoice";


type OrderSource = "all" | "customer" | "dropshipper" | "affiliate" | "vendor" | "ai";

const searchSchema = z.object({
  source: fallback(z.string(), "all").default("all"),
  page: fallback(z.number(), 1).default(1),
  sortCol: fallback(z.string(), "created_at").default("created_at"),
  sortDir: fallback(z.enum(["asc", "desc"]), "desc").default("desc"),
  status: fallback(z.string(), "all").default("all"),
  date: fallback(z.string(), "").default(""),
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/sys-x7k9-control/orders")({
  validateSearch: zodValidator(searchSchema),
  component: OrdersAdmin,
});

const SOURCE_LABEL: Record<OrderSource, string> = {
  all: "All Orders",
  customer: "Customer Orders",
  dropshipper: "Dropshipper Orders",
  affiliate: "Affiliate Orders",
  vendor: "Vendor Orders",
  ai: "AI Orders",
};

const AI_SOURCE = "ai_assistant";
const AI_SOURCE_LABELS: Record<string, string> = {
  ai_assistant: "AI Assistant",
  web: "Website",
};

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const STATUS_TONE: Record<string, "pink" | "sky" | "indigo" | "rose"> = {
  pending: "pink",
  processing: "sky",
  shipped: "indigo",
  delivered: "sky",
  cancelled: "rose",
};

type OrderExt = DBOrder & {
  source?: string | null;
  ai_thread_id?: string | null;
  vendor_id?: string | null;
  dropshipper_id?: string | null;
  dropshipper_code?: string | null;
  affiliate_id?: string | null;
  vendor?: { store_name: string } | null;
  dropshipper?: { store_name: string; code: string } | null;
  items_json?: string | null;
  discount?: number | null;
  courier_name?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
};

function OrdersAdmin() {
  const { source, page, sortCol, sortDir, status, date, q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const src = source as OrderSource;
  const [items, setItems] = useState<OrderExt[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<OrderExt | null>(null);
  const [courierOrder, setCourierOrder] = useState<OrderExt | null>(null);
  const [searchInput, setSearchInput] = useState(q);
  const debouncedSearch = useDebounce(searchInput, 300);
  const pageSize = 50;

  async function load() {
    setIsLoading(true);
    let q = supabase.from("orders").select("*, vendor:vendors(store_name), dropshipper:dropshippers(store_name, code), discount, items_json", { count: "exact" });
    
    if (src === "ai") q = q.eq("source", AI_SOURCE);
    else if (src === "customer") q = q.is("dropshipper_id", null).is("dropshipper_code", null).is("affiliate_id", null).is("vendor_id", null);
    else if (src === "dropshipper") q = q.or("dropshipper_id.not.is.null,dropshipper_code.not.is.null");
    else if (src === "affiliate") q = q.not("affiliate_id", "is", null);
    else if (src === "vendor") q = q.not("vendor_id", "is", null);

    if (status !== "all") q = q.in("status", status.split(","));
    if (date) q = q.gte("created_at", `${date}T00:00:00`).lte("created_at", `${date}T23:59:59`);

    const search = debouncedSearch.trim();
    if (search) {
      // Allow searching by order number, customer name, phone, or AI thread UUID.
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search);
      if (isUuid) {
        q = q.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,ai_thread_id.eq.${search}`);
      } else {
        q = q.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
      }
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, count } = await q.order(sortCol, { ascending: sortDir === "asc" }).range(from, to);
    
    setItems((data ?? []) as any);
    setTotalCount(count ?? 0);
    setIsLoading(false);
  }

  useEffect(() => { load(); }, [source, page, sortCol, sortDir, status, date, debouncedSearch]);

  useEffect(() => {
    if (debouncedSearch !== q) {
      navigate({ search: (prev: any) => ({ ...prev, q: debouncedSearch, page: 1 }) });
    }
  }, [debouncedSearch]);

  async function updateStatus(id: string, status: string) {
    const oldStatus = items.find(o => o.id === id)?.status;
    if (oldStatus === status) return;

    // Optimistic UI update
    setItems(prev => prev.map(o => o.id === id ? { ...o, status: status as any } : o));
    if (view && view.id === id) {
      setView(prev => prev ? { ...prev, status: status as any } : null);
    }

    const { error } = await supabase.from("orders").update({ 
      status,
      updated_at: new Date().toISOString()
    }).eq("id", id);
    
    if (error) {
      console.error("Order update error:", error);
      // Revert on error
      setItems(prev => prev.map(o => o.id === id ? { ...o, status: oldStatus as any } : o));
      if (view && view.id === id) {
        setView(prev => prev ? { ...prev, status: oldStatus as any } : null);
      }
      return toast.error(error.message);
    }

    toast.success(`Order status updated to ${status}`);
    // Refresh data in background to ensure sync with database triggers
    load();
  }


  async function remove(id: string) {
    if (!confirm("Delete this order?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order deleted");
    load();
  }

  const toggleSort = (col: string) => {
    const dir = sortCol === col && sortDir === "desc" ? "asc" : "desc";
    navigate({ search: (prev: any) => ({ ...prev, sortCol: col, sortDir: dir, page: 1 }) });
  };
  const SortIcon = ({ col }: { col: string }) => (
    <span className="ml-1 opacity-20">{sortCol === col ? (sortDir === "desc" ? "↓" : "↑") : "↕"}</span>
  );

  return (
    <div className="space-y-4">
      <PageHeader icon={ShoppingBag} title={SOURCE_LABEL[src]} subtitle={`${totalCount} orders`} />
      
      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "customer", "dropshipper", "affiliate", "vendor", "ai"] as OrderSource[]).map(s => (
              <button key={s} onClick={() => navigate({ search: (prev: any) => ({ ...prev, source: s, page: 1 }) })} className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition-all ${src === s ? "bg-purple-800 text-white shadow-md scale-105" : "bg-slate-50 border hover:bg-slate-100"}`}>
                {SOURCE_LABEL[s]}
              </button>
            ))}
          </div>
          <GhostButton 
            onClick={() => exportToCSV(formatOrdersForExport(items), `admin-orders-${new Date().toISOString().split('T')[0]}.csv`)}
            className="flex items-center gap-2 text-xs"
          >
            <Download className="h-4 w-4" /> Export CSV
          </GhostButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search order #, customer, phone, or AI thread ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-purple-700 focus:bg-white"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={e => navigate({ search: (prev: any) => ({ ...prev, date: e.target.value, page: 1 }) })}
              className="flex-1 rounded-lg border bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            {date && (
              <button 
                onClick={() => navigate({ search: (prev: any) => ({ ...prev, date: "", page: 1 }) })}
                className="px-2 text-xs text-rose-500 font-bold hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <select 
            value={status} 
            onChange={e => navigate({ search: (prev: any) => ({ ...prev, status: e.target.value, page: 1 }) })}
            className="rounded-lg border bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>
      </div>

      <Surface className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs">
            <tr>
              <th className="p-3 text-left cursor-pointer hover:text-purple-700" onClick={() => toggleSort("order_number")}>
                Order <SortIcon col="order_number" />
              </th>
              <th className="p-3 text-left">Source</th>
              <th className="p-3 text-left">Vendor/DS</th>
              <th className="p-3 text-left cursor-pointer hover:text-purple-700" onClick={() => toggleSort("customer_name")}>
                Customer <SortIcon col="customer_name" />
              </th>
              <th className="p-3 text-right cursor-pointer hover:text-purple-700" onClick={() => toggleSort("total")}>
                Total <SortIcon col="total" />
              </th>
              <th className="p-3 text-center cursor-pointer hover:text-purple-700" onClick={() => toggleSort("status")}>
                Status <SortIcon col="status" />
              </th>
              <th className="p-3 text-left cursor-pointer hover:text-purple-700" onClick={() => toggleSort("created_at")}>
                Date <SortIcon col="created_at" />
              </th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t animate-pulse">
                  <td className="p-3"><div className="h-4 w-20 bg-slate-100 rounded"></div></td>
                  <td className="p-3"><div className="h-4 w-12 bg-slate-100 rounded"></div></td>
                  <td className="p-3"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
                  <td className="p-3"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
                  <td className="p-3"><div className="h-4 w-16 bg-slate-100 rounded ml-auto"></div></td>
                  <td className="p-3 text-center"><div className="h-6 w-16 bg-slate-100 rounded-full mx-auto"></div></td>
                  <td className="p-3"></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center text-slate-400">No orders found</td></tr>
            ) : (
              items.map(o => (
                <tr key={o.id} className="border-t hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono text-[10px] text-slate-500">{o.order_number}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {o.source === "ai_assistant" && (
                        <span
                          title="এই অর্ডারটি Bazar AI Assistant কাস্টমারের হয়ে চ্যাট থেকে সাবমিট করেছে"
                          className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700"
                        >
                          🤖 AI
                        </span>
                      )}
                      {o.dropshipper_id || o.dropshipper_code ? <Badge tone="sky">DS</Badge> : o.affiliate_id ? <Badge tone="indigo">AF</Badge> : o.vendor_id ? <Badge tone="pink">VD</Badge> : <Badge tone="pink">CU</Badge>}
                    </div>
                  </td>
                  <td className="p-3 text-xs">
                    <div className="font-medium text-purple-900">{o.vendor?.store_name || "Direct"}</div>
                    {o.dropshipper && (
                      <div className="mt-0.5 text-[10px] text-fuchsia-600 font-bold">
                        DS: {o.dropshipper.store_name} ({o.dropshipper.code})
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-xs">
                    <div className="font-bold">{o.customer_name}</div>
                    <div className="text-[10px] text-slate-400">{o.customer_phone}</div>
                    {o.tracking_number && (
                      <a 
                        href={o.tracking_url || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-1 flex items-center gap-1 text-[9px] font-bold text-orange-600 hover:underline"
                      >
                        <Truck className="h-3 w-3" /> {o.tracking_number}
                      </a>
                    )}
                  </td>
                  <td className="p-3 text-right font-bold text-purple-700">৳{Number(o.total).toFixed(0)}</td>
                  <td className="p-3 text-center">
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className={`rounded-full px-2 py-0.5 text-[10px] font-bold border-none ${o.status === 'pending' ? 'bg-pink-50 text-pink-700' : o.status === 'processing' ? 'bg-sky-50 text-sky-700' : o.status === 'shipped' ? 'bg-indigo-50 text-indigo-700' : 'bg-green-50 text-green-700'}`}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-xs text-slate-400">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right space-x-1 whitespace-nowrap">
                    <GhostButton onClick={() => setView(o)} title="View Details" className="p-1.5"><Eye className="h-4 w-4" /></GhostButton>
                    <GhostButton 
                      onClick={() => {
                        const items = JSON.parse(o.items_json as string);
                        openPrintableInvoice({
                          order_number: o.order_number,
                          created_at: o.created_at,
                          status: o.status,
                          customer_name: o.customer_name || "",
                          customer_phone: o.customer_phone || "",
                          customer_email: o.customer_email,
                          address: o.address || "",
                          thana: o.thana,
                          district: o.district,
                          items: items.map((it: any) => ({
                            name: it.name,
                            price: it.price,
                            qty: it.qty,
                            image: it.image,
                            variant: it.variant,
                            size: it.size,
                            sku: it.sku
                          })),
                          subtotal: Number(o.subtotal),
                          delivery_fee: Number(o.delivery_fee),
                          discount: Number(o.discount),
                          total: Number(o.total),
                          payment_method: o.payment_method || "cod",
                          txn_id: o.txn_id,
                          paid_amount: Number(o.paid_amount),
                          is_admin_view: true
                        });
                      }} 
                      title="Print Invoice"
                      className="p-1.5 text-blue-600"
                    >
                      <FileText className="h-4 w-4" />
                    </GhostButton>
                    <GhostButton 
                      onClick={() => setCourierOrder(o)} 
                      title="Send to Courier" 
                      className="p-1.5 text-orange-600"
                      disabled={o.status === 'shipped' || o.status === 'delivered'}
                    >
                      <Truck className="h-4 w-4" />
                    </GhostButton>
                    <DangerButton onClick={() => remove(o.id)} title="Delete" className="p-1.5"><Trash2 className="h-4 w-4" /></DangerButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Surface>

      {totalCount > pageSize && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-xs text-slate-500">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} orders
          </div>
          <div className="flex gap-2">
            <GhostButton 
              onClick={() => navigate({ search: (prev: any) => ({ ...prev, page: Math.max(1, page - 1) }) })}
              disabled={page === 1}
              className="px-3 py-1 text-xs"
            >
              Previous
            </GhostButton>
            <GhostButton 
              onClick={() => navigate({ search: (prev: any) => ({ ...prev, page: Math.min(Math.ceil(totalCount / pageSize), page + 1) }) })}
              disabled={page >= Math.ceil(totalCount / pageSize)}
              className="px-3 py-1 text-xs"
            >
              Next
            </GhostButton>
          </div>
        </div>
      )}

      {view && (
        <Modal onClose={() => setView(null)}>
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-lg font-bold">Order #{view.order_number}</h2>
            <GhostButton onClick={() => setView(null)} className="p-1 border-none shadow-none"><X className="h-5 w-5" /></GhostButton>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Surface className="p-3">
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Customer Info</h3>
                <div className="text-sm font-bold">{view.customer_name}</div>
                <div className="text-xs text-slate-600">{view.customer_phone}</div>
                <div className="text-xs text-slate-600 mt-1">{view.address}</div>
              </Surface>
              {view.dropshipper && (
                <Surface className="p-3 border-fuchsia-100 bg-fuchsia-50/30">
                  <h3 className="text-xs font-bold uppercase text-fuchsia-400 mb-2">Dropshipper Info</h3>
                  <div className="text-sm font-bold text-fuchsia-900">{view.dropshipper.store_name}</div>
                  <div className="text-[10px] text-fuchsia-700 font-mono">Code: {view.dropshipper.code}</div>
                  <div className="text-[10px] text-fuchsia-600 mt-1 italic">Order attributed via dropshipper store.</div>
                </Surface>
              )}
              {view.vendor && (
                <Surface className="p-3 border-emerald-100 bg-emerald-50/30">
                  <h3 className="text-xs font-bold uppercase text-emerald-400 mb-2">Vendor Info</h3>
                  <div className="text-sm font-bold text-emerald-900">{view.vendor.store_name}</div>
                  <div className="text-[10px] text-emerald-700 italic">Primary stock provider.</div>
                </Surface>
              )}

              <Surface className="p-3">
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Order Info</h3>
                <div className="flex justify-between text-xs">
                  <span>Total:</span>
                  <span className="font-bold text-purple-700">৳{Number(view.total).toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>Method:</span>
                  <span className="capitalize">{view.payment_method}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>Status:</span>
                  <span className="font-bold capitalize">{view.status}</span>
                </div>
                {view.tracking_number && (
                  <div className="mt-2 pt-2 border-t border-dashed">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Shipping Tracking</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize">{view.courier_name}:</span>
                      <a 
                        href={view.tracking_url || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-bold text-orange-600 hover:underline flex items-center gap-1"
                      >
                        {view.tracking_number} <Eye className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </Surface>
            </div>

            <OrderItemsPanel order={view} />


            <div className="border-t pt-4">
              <div className="flex items-center gap-2 text-sm font-bold uppercase text-slate-700 mb-3">
                <Clock className="h-4 w-4" /> History & Timeline
              </div>
              <div className="max-h-[300px] overflow-y-auto px-1">
                <OrderTimeline orderId={view.id} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <GhostButton onClick={() => setView(null)}>Close</GhostButton>
            </div>
          </div>
        </Modal>
      )}

      {courierOrder && (
        <SendToCourierModal 
          order={courierOrder} 
          onClose={() => setCourierOrder(null)} 
          onSuccess={() => {
            setCourierOrder(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function SendToCourierModal({ order, onClose, onSuccess }: { order: OrderExt, onClose: () => void, onSuccess: () => void }) {
  const [courier, setCourier] = useState<'steadfast' | 'pathao'>('steadfast');
  const [weight, setWeight] = useState(0.5);
  const [submitting, setSubmitting] = useState(false);
  const [serviceType, setServiceType] = useState('standard');
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("app_settings" as any) as any).select("*").eq("key", "courier_config").maybeSingle();
      if (data) setConfig(data.value);
    })();
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await submitToCourier({
        data: {
          order_id: order.id,
          courier,
          weight,
          service_type: serviceType,
          item_description: `Order #${order.order_number}`
        }
      });
      
      if (res.success) {
        toast.success(res.message);
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit to courier");
    } finally {
      setSubmitting(false);
    }
  };

  const isConfigured = config?.[courier]?.enabled;

  return (
    <Modal onClose={onClose}>
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Truck className="h-5 w-5 text-orange-600" />
          Send Order #{order.order_number} to Courier
        </h2>
        <GhostButton onClick={onClose} className="p-1 border-none shadow-none"><X className="h-5 w-5" /></GhostButton>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setCourier('steadfast')}
            className={`p-3 rounded-xl border text-center transition-all ${courier === 'steadfast' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'bg-white hover:bg-slate-50'}`}
          >
            <div className="font-bold text-sm">Steadfast</div>
            <div className="text-[10px] text-slate-500">Express Delivery</div>
          </button>
          <button 
            onClick={() => setCourier('pathao')}
            className={`p-3 rounded-xl border text-center transition-all ${courier === 'pathao' ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' : 'bg-white hover:bg-slate-50'}`}
          >
            <div className="font-bold text-sm">Pathao</div>
            <div className="text-[10px] text-slate-500">Reliable & Fast</div>
          </button>
        </div>

        {!isConfigured && config && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong>Courier Not Configured:</strong> {courier === 'steadfast' ? 'Steadfast' : 'Pathao'} API is not enabled in settings. This will use mock mode.
            </div>
          </div>
        )}

        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Weight (kg)</label>
              <input 
                type="number" 
                step="0.1" 
                value={weight} 
                onChange={e => setWeight(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Service Type</label>
              <select 
                value={serviceType}
                onChange={e => setServiceType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
              >
                <option value="standard">Standard</option>
                <option value="express">Express</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Recipient Details</label>
            <div className="text-xs font-bold text-slate-700">{order.customer_name}</div>
            <div className="text-[10px] text-slate-500">{order.customer_phone}</div>
            <div className="text-[10px] text-slate-500 line-clamp-1">{order.address}, {order.thana}, {order.district}</div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <GhostButton onClick={onClose} disabled={submitting}>Cancel</GhostButton>
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-700 active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {submitting ? "Sending..." : "Confirm & Send"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const money = (n: number) => `৳${Number(n || 0).toFixed(0)}`;

type EarningRow = { product_id: string | null; base_price: number; retail_price: number; qty: number; profit: number; status: string };
type ProdRow = { id: string; name: string; image: string | null; sku: string | null; price: number; dropshipper_price: number | null };

function OrderItemsPanel({ order }: { order: OrderExt }) {
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [prods, setProds] = useState<Record<string, ProdRow>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const ids = (order.items ?? []).map((i) => i.id).filter((id) => UUID_RE.test(String(id)));
      const [e, p] = await Promise.all([
        supabase.from("dropshipper_earnings").select("product_id, base_price, retail_price, qty, profit, status").eq("order_id", order.id),
        ids.length
          ? supabase.from("products").select("id, name, image, sku, price, dropshipper_price").in("id", ids)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      if (!alive) return;
      setEarnings(((e as any).data ?? []) as EarningRow[]);
      const map: Record<string, ProdRow> = {};
      for (const r of ((p as any).data ?? []) as ProdRow[]) map[r.id] = r;
      setProds(map);
    })();
    return () => { alive = false; };
  }, [order.id]);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const earnFor = (pid: string) => earnings.find((e) => String(e.product_id) === String(pid));

  const items = useMemo(() => {
    let list = (order.items ?? []).map((it) => {
      const p = prods[String(it.id)];
      const e = earnFor(String(it.id));
      const qty = Number(it.qty || 1);
      const sold = Number(e?.retail_price ?? it.price ?? 0);
      const vendorPrice = Number(p?.price ?? it.price ?? 0);
      const dsBase = Number(e?.base_price ?? p?.dropshipper_price ?? 0);
      const profit = e ? Number(e.profit || 0) : dsBase ? (sold - dsBase) * qty : 0;
      const lineTotal = sold * qty;

      return { ...it, p, e, qty, sold, vendorPrice, dsBase, profit, lineTotal };
    });

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(
        (it) =>
          it.name.toLowerCase().includes(s) ||
          (it.variant && it.variant.toLowerCase().includes(s)) ||
          (it.sku || it.p?.sku || "").toLowerCase().includes(s)
      );
    }

    if (sortField) {
      list.sort((a: any, b: any) => {
        const valA = a[sortField] || 0;
        const valB = b[sortField] || 0;
        return sortDirection === "asc" ? valA - valB : valB - valA;
      });
    }

    return list;
  }, [order.items, prods, earnings, searchTerm, sortField, sortDirection]);

  const totalProfit = earnings.reduce((s, e) => s + Number(e.profit || 0), 0);

  const paid = Number(order.paid_amount ?? 0);
  const total = Number(order.total ?? 0);
  const isCod = (order.payment_method ?? "").toLowerCase().includes("cod") || (order.payment_method ?? "").toLowerCase().includes("cash");
  const due = Math.max(0, total - paid);
  
  // Real-time validation for COD
  const codWarning = isCod && paid > 0 && due > 0;
  const codMismatch = isCod && paid >= total && total > 0;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };


  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="text-sm font-bold uppercase text-slate-700">Products & Details</div>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
          />
        </div>
      </div>
      <div className="relative rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="w-full text-xs min-w-[800px] border-collapse">
            <thead className="bg-slate-50/80 sticky top-0 backdrop-blur-sm z-10">
              <tr className="border-b border-slate-200">
                <th className="p-3 text-left font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Product</th>
                <th 
                  className="p-3 text-center font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("qty")}
                >
                  Qty {sortField === "qty" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th 
                  className="p-3 text-right font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("vendorPrice")}
                >
                  Vendor Price {sortField === "vendorPrice" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th 
                  className="p-3 text-right font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("dsBase")}
                >
                  Dropship Price {sortField === "dsBase" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th 
                  className="p-3 text-right font-bold uppercase tracking-wider text-purple-600 whitespace-nowrap cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("sold")}
                >
                  Sold Price {sortField === "sold" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th 
                  className="p-3 text-right font-bold uppercase tracking-wider text-fuchsia-600 whitespace-nowrap cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("profit")}
                >
                  DS Profit {sortField === "profit" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th 
                  className="p-3 text-right font-bold uppercase tracking-wider text-slate-700 whitespace-nowrap cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("lineTotal")}
                >
                  Line Total {sortField === "lineTotal" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it: any, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors align-middle">
                  <td className="p-3 min-w-[250px]">
                    <div className="flex items-center gap-3">
                      <ProductImage
                        src={it.image || it.p?.image}
                        alt={it.name}
                        className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover shadow-sm bg-white"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 leading-snug line-clamp-2">{it.name}</div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 border border-slate-200/50">
                            SKU: {it.sku || it.p?.sku || "—"}
                          </span>
                          {it.size && (
                            <span className="inline-flex items-center rounded bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 border border-purple-100/50">
                              {it.size}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 font-bold text-slate-700 border border-slate-200/30">
                      {it.qty}
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold text-slate-500 whitespace-nowrap">{it.vendorPrice ? money(it.vendorPrice) : "—"}</td>
                  <td className="p-3 text-right font-semibold text-slate-500 whitespace-nowrap">{it.dsBase ? money(it.dsBase) : "—"}</td>
                  <td className="p-3 text-right font-bold text-purple-700 whitespace-nowrap">{money(it.sold)}</td>
                  <td className={`p-3 text-right font-bold whitespace-nowrap ${it.profit > 0 ? "text-fuchsia-700" : "text-slate-400"}`}>
                    {it.profit ? money(it.profit) : "—"}
                  </td>
                  <td className="p-3 text-right font-black text-slate-900 whitespace-nowrap bg-slate-50/30 border-l border-slate-100/50">
                    {money(it.lineTotal)}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={7} className="p-12 text-center text-slate-400 font-medium">{searchTerm ? "No items match your search" : "No items in this order"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>



      <div className="grid gap-4 sm:grid-cols-2">
        <Surface className="p-3">
          <h3 className="mb-2 text-xs font-bold uppercase text-slate-400">Calculation</h3>
          <Row label="Subtotal" value={money(order.subtotal)} />
          {Number((order as any).discount ?? 0) > 0 && <Row label="Discount" value={`- ${money((order as any).discount)}`} />}
          <Row label="Delivery fee" value={money(order.delivery_fee)} />
          <Row label="Grand total" value={money(total)} strong />
          <div className="my-2 border-t border-dashed" />
          <Row label="Dropshipper profit" value={totalProfit ? money(totalProfit) : "—"} />
        </Surface>

        <Surface className="p-3">
          <h3 className="mb-2 text-xs font-bold uppercase text-slate-400">Payment</h3>
          <Row label="Method" value={(order.payment_method ?? "—").toUpperCase()} />
          {order.payment_type && <Row label="Type" value={order.payment_type} />}
          {order.txn_id && <Row label="Txn ID" value={order.txn_id} />}
          {order.sender_phone && <Row label="Sender" value={order.sender_phone} />}
          <Row label="Payment status" value={String((order as any).payment_status ?? "—").toUpperCase()} />
          <Row label="Paid by customer" value={money(paid)} />
          <Row label={isCod ? "Cash to collect on delivery" : "Amount due"} value={money(due)} strong />
          <div className={`mt-2 rounded-lg px-2 py-1.5 text-[11px] transition-colors ${
            codMismatch ? "bg-rose-50 text-rose-700 border border-rose-200" : 
            codWarning ? "bg-amber-50 text-amber-700 border border-amber-200" : 
            "bg-slate-50 text-slate-600"
          }`}>
            {codMismatch ? (
              <div className="flex items-center gap-1.5 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                Error: Full payment received but method is COD.
              </div>
            ) : codWarning ? (
              <div className="flex items-center gap-1.5 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
                Note: Partial payment ({money(paid)}) received for COD order.
              </div>
            ) : null}
            
            <div className={codWarning || codMismatch ? "mt-1" : ""}>
              {isCod
                ? `Cash on delivery — customer pays ${money(due)} to the courier.`
                : due <= 0
                  ? "Customer has fully paid this order online."
                  : `Customer paid ${money(paid)} online, ${money(due)} still pending.`}
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-2 text-xs mt-1">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? "font-bold text-purple-800" : "font-medium text-slate-800"}>{value}</span>
    </div>
  );
}
