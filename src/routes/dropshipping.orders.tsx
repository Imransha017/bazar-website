import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { getMyDropshipper, listMyEarnings, type Dropshipper, type DropshipperEarning } from "@/lib/dropshipper";
import { supabase } from "@/integrations/supabase/client";
import { OrderAutocomplete } from "@/components/OrderAutocomplete";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { User, Phone, MapPin, CreditCard, Package, Clock, X, ShoppingBag, Download, Eye } from "lucide-react";
import { OrderTimeline } from "@/components/OrderTimeline";
import { exportToCSV, formatOrdersForExport } from "@/lib/export-utils";
import { ProductImage } from "@/components/ProductImage";

const searchSchema = z.object({
  page: fallback(z.number(), 1).default(1),
  filter: fallback(z.string(), "all").default("all"),
  search: fallback(z.string(), "").default(""),
  date: fallback(z.string(), "").default(""),
  sortCol: fallback(z.string(), "created_at").default("created_at"),
  sortDir: fallback(z.enum(["asc", "desc"]), "desc").default("desc"),
});

export const Route = createFileRoute("/dropshipping/orders")({
  head: () => ({ meta: [{ title: "Orders — Dropshipping" }, { name: "robots", content: "noindex" }] }),
  validateSearch: zodValidator(searchSchema),
  component: OrdersPage,
});

function OrdersPage() {
  const { page, filter, search, date: dateFilter, sortCol, sortDir } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [ds, setDs] = useState<Dropshipper | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // Re-verify marker: 1784566371728
  const pageSize = 50;
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebounce(localSearch, 500);
  const hasAnyFilter = filter !== "all" || dateFilter !== "" || search !== "";

  const load = async () => {
    setIsLoading(true);
    const d = await getMyDropshipper();
    setDs(d);
    if (!d) return;

    let query = supabase.from("orders")
      .select("*, vendor:vendors(store_name)", { count: "exact" })
      .or(`dropshipper_id.eq.${d.id},dropshipper_code.eq.${d.code}`);

    if (filter !== "all") query = query.in("status", filter.split(","));
    if (dateFilter) query = query.gte("created_at", `${dateFilter}T00:00:00`).lte("created_at", `${dateFilter}T23:59:59`);
    if (search) {
      const s = `%${search}%`;
      query = query.or(`order_number.ilike.${s},customer_name.ilike.${s},customer_phone.ilike.${s}`);
    }

    const { data, count } = await query
      .order(sortCol, { ascending: sortDir === "asc" })
      .range((page - 1) * pageSize, page * pageSize - 1);

    setItems((data ?? []) as any);
    setTotalCount(count ?? 0);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [filter, search, dateFilter, page, sortCol, sortDir]);

  useEffect(() => {
    if (debouncedSearch !== search) {
      navigate({ search: (prev) => ({ ...prev, search: debouncedSearch, page: 1 }) });
    }
  }, [debouncedSearch]);

  if (!ds && !isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-3 p-0 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b p-3 sm:p-0 sm:pb-4">
        <h1 className="text-xl font-bold">Earnings & Orders</h1>
        <div className="flex items-center gap-2">
          {hasAnyFilter && (
            <button 
              onClick={() => navigate({ search: (prev) => ({ ...prev, filter: "all", date: "", search: "", page: 1 }) })}
              className="text-[10px] font-bold text-rose-600 hover:underline"
            >
              Reset All Filters
            </button>
          )}
          <button 
            onClick={() => exportToCSV(formatOrdersForExport(items.map(i => ({ ...i.order, status: i.status }))), `dropshipper-orders-${new Date().toISOString().split('T')[0]}.csv`)}
            className="flex items-center gap-2 rounded border bg-card px-3 py-1.5 text-xs hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 bg-muted/30 p-3 sm:rounded-lg border-x-0 sm:border shadow-sm">
        <div className="w-full">
          <OrderAutocomplete
            placeholder="Search Order / Customer..."
            value={localSearch}
            onChange={val => setLocalSearch(val)}
            className="w-full"
            context="dropshipper"
            dropshipperId={ds?.id}
          />
        </div>
        
        <div className="flex flex-row gap-2 items-center w-full">
          <div className="flex-1 flex gap-2 items-center">
            <input
              type="date"
              value={dateFilter}
              onChange={e => navigate({ search: (prev) => ({ ...prev, date: e.target.value, page: 1 }) })}
              className="w-full rounded border bg-card px-2 py-1.5 text-[11px] focus:ring-1 focus:ring-primary outline-none"
            />
            {dateFilter && (
              <button 
                onClick={() => navigate({ search: (prev) => ({ ...prev, date: "", page: 1 }) })}
                className="text-[10px] text-rose-500 font-bold whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="flex-1">
            <select 
              value={filter} 
              onChange={e => navigate({ search: (prev) => ({ ...prev, filter: e.target.value, page: 1 }) })} 
              className="w-full rounded border bg-card px-2 py-1.5 text-[11px] focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 text-[9px] font-bold text-primary px-1">
          <button onClick={() => navigate({ search: (prev) => ({ ...prev, date: new Date().toISOString().split('T')[0], page: 1 }) })} className="hover:underline bg-primary/5 px-2 py-0.5 rounded">Today</button>
          <button onClick={() => {
            const d = new Date(); d.setDate(d.getDate() - 7);
            navigate({ search: (prev) => ({ ...prev, date: d.toISOString().split('T')[0], page: 1 }) });
          }} className="hover:underline bg-primary/5 px-2 py-0.5 rounded">Last 7 Days</button>
          <button onClick={() => {
            const d = new Date(); d.setDate(d.getDate() - 30);
            navigate({ search: (prev) => ({ ...prev, date: d.toISOString().split('T')[0], page: 1 }) });
          }} className="hover:underline bg-primary/5 px-2 py-0.5 rounded">Last 30 Days</button>
        </div>
      </div>

      <div className="overflow-x-auto sm:rounded-xl border-y sm:border bg-card shadow-sm max-h-[calc(100vh-280px)] custom-scrollbar">
        <table className="w-full text-xs min-w-[600px] border-collapse">
          <thead className="bg-muted/90 backdrop-blur-sm text-left sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-2 cursor-pointer hover:text-primary" onClick={() => {
                const dir = sortCol === "created_at" && sortDir === "desc" ? "asc" : "desc";
                navigate({ search: (prev) => ({ ...prev, sortCol: "created_at", sortDir: dir, page: 1 }) });
              }}>
                Date {sortCol === "created_at" ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
              </th>
              <th className="p-2 text-left">Order #</th>
              <th className="p-2 text-left">Customer</th>
              <th className="p-2 text-right">Total</th>
              <th className="p-2 cursor-pointer hover:text-primary" onClick={() => {
                const dir = sortCol === "status" && sortDir === "desc" ? "asc" : "desc";
                navigate({ search: (prev) => ({ ...prev, sortCol: "status", sortDir: dir, page: 1 }) });
              }}>
                Status {sortCol === "status" ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
              </th>
              <th className="p-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-t animate-pulse">
                  <td className="p-2"><div className="h-3 w-16 bg-muted rounded"></div></td>
                  <td className="p-2"><div className="h-3 w-20 bg-muted rounded"></div></td>
                  <td className="p-2">
                    <div className="h-3 w-24 bg-muted rounded mb-1"></div>
                    <div className="h-2 w-16 bg-muted rounded"></div>
                  </td>
                  <td className="p-2 text-right"><div className="h-3 w-12 bg-muted rounded ml-auto"></div></td>
                  <td className="p-2"><div className="h-5 w-16 bg-muted rounded mx-auto"></div></td>
                  <td className="p-2 text-right"><div className="h-7 w-7 bg-muted rounded-full ml-auto"></div></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No orders found</td></tr>
            ) : (
              items.map((order) => (
                <tr key={order.id} className="border-t hover:bg-muted/30">
                  <td className="p-2">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="p-2 font-mono">#{order.order_number}</td>
                  <td className="p-2">
                    <div className="font-medium">{order.customer_name}</div>
                    <div className="text-[10px] text-muted-foreground">{order.customer_phone}</div>
                  </td>
                  <td className="p-2 text-right font-bold text-yellow-600">৳{order.total}</td>
                  <td className="p-2 text-center">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                      'bg-sky-100 text-sky-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-full p-1.5 hover:bg-muted text-primary transition-colors"
                      title="View Details"
                    >
                      <Eye className="size-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalCount > pageSize && (
        <div className="flex items-center justify-between border-t p-3 sm:p-0 sm:pt-2">
          <div className="text-[10px] text-muted-foreground">
            {totalCount} results
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => navigate({ search: (prev) => ({ ...prev, page: Math.max(1, page - 1) }) })}
              disabled={page === 1}
              className="px-2 py-1 text-[10px] border rounded hover:bg-muted disabled:opacity-50"
            >
              Prev
            </button>
            <span className="flex items-center px-2 text-[10px] font-bold">
              {page} / {Math.ceil(totalCount / pageSize)}
            </span>
            <button 
              onClick={() => navigate({ search: (prev) => ({ ...prev, page: Math.min(Math.ceil(totalCount / pageSize), page + 1) }) })}
              disabled={page >= Math.ceil(totalCount / pageSize)}
              className="px-2 py-1 text-[10px] border rounded hover:bg-muted disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}

function OrderDetailsModal({ order, onClose }: { order: any; onClose: () => void }) {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [vendor, setVendor] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const loadDetails = async () => {
      setIsLoading(true);
      const [eRes, vRes] = await Promise.all([
        supabase.from("dropshipper_earnings").select("*").eq("order_id", order.id),
        order.vendor_id 
          ? supabase.from("vendors").select("store_name, phone, address").eq("id", order.vendor_id).single()
          : Promise.resolve({ data: null })
      ]);
      
      if (!alive) return;
      setEarnings(eRes.data || []);
      setVendor(vRes.data);
      setIsLoading(false);
    };
    loadDetails();
    return () => { alive = false; };
  }, [order.id]);

  const money = (n: number) => `৳${Number(n || 0).toLocaleString()}`;
  const totalProfit = earnings.reduce((s, e) => s + Number(e.profit || 0), 0);
  const isCod = (order.payment_method || "").toLowerCase().includes("cod") || (order.payment_method || "").toLowerCase().includes("cash");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="my-4 w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center bg-white border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-bold">Order Details</h2>
            <p className="text-xs text-muted-foreground">
              Order #{order.order_number} • {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Customer & Vendor */}
            <div className="space-y-4">
              {/* Customer Information */}
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-3 border-b pb-2">
                  <User className="size-3 text-primary" /> Customer Information
                </h3>
                <div className="space-y-2">
                  <p className="font-bold text-slate-800">{order.customer_name}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="size-3 text-primary" /> {order.customer_phone}
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin className="size-3 mt-1 text-primary shrink-0" /> 
                    <span>{order.address}</span>
                  </div>
                </div>
              </div>

              {/* Vendor Info */}
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-3 border-b pb-2">
                  <ShoppingBag className="size-3 text-primary" /> Vendor Details
                </h3>
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-slate-800">{vendor?.store_name || "Platform Direct"}</p>
                  {vendor?.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Phone className="size-3" /> {vendor.phone}
                    </div>
                  )}
                  {vendor?.address && (
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <MapPin className="size-3 shrink-0" /> <span>{vendor.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Payment & Timeline */}
            <div className="space-y-4">
              {/* Payment Summary */}
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-3 border-b pb-2">
                  <CreditCard className="size-3 text-primary" /> Payment Summary
                </h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Method</span>
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 rounded-full uppercase">{order.payment_method || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Total Bill</span>
                    <span className="text-sm font-bold text-slate-800">{money(order.total)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Paid Amount</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {order.paid_amount > 0 ? money(order.paid_amount) : '৳0 (COD)'}
                    </span>
                  </div>
                  {order.txn_id && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-50">
                      <span className="text-[10px] text-slate-400">Transaction ID</span>
                      <span className="text-[10px] font-mono text-slate-600">{order.txn_id}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Timeline */}
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-3 border-b pb-2">
                  <Clock className="size-3 text-primary" /> Timeline
                </h3>
                <div className="max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                  <OrderTimeline orderId={order.id} />
                </div>
              </div>
            </div>
          </div>

          {/* Product Items Table */}
          <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <Package className="size-3 text-primary" /> Ordered Products
              </h3>
              <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border">
                {(order.items || []).length} Items
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/50 text-left border-b">
                    <th className="px-4 py-2 font-bold text-slate-500">Product</th>
                    <th className="px-4 py-2 text-center font-bold text-slate-500">Qty</th>
                    <th className="px-4 py-2 text-right font-bold text-slate-500">Unit Price</th>
                    <th className="px-4 py-2 text-right font-bold text-slate-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(order.items || []).map((it: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductImage src={it.image} alt={it.name} className="size-10 rounded-lg border object-cover shrink-0 shadow-sm" />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 line-clamp-1">{it.name}</p>
                            {(it.variant || it.size || it.sku) && (
                              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                {it.size && <span>Size: {it.size} </span>}
                                {it.sku && <span>SKU: {it.sku}</span>}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-slate-600">{it.qty}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{money(it.price)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{money(it.price * it.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Profit Analysis Section */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
            <h3 className="flex items-center gap-2 text-xs font-bold text-primary mb-4">
              <CreditCard className="size-3" /> Financial Analysis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg p-3 bg-white border border-slate-100 shadow-sm text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Items Total</p>
                <p className="text-sm font-bold text-slate-800">{money(order.total)}</p>
              </div>
              <div className="rounded-lg p-3 bg-white border border-slate-100 shadow-sm text-center">
                <p className="text-[10px] text-primary/70 font-bold uppercase mb-1">Your Profit</p>
                <p className="text-sm font-bold text-primary">+{money(totalProfit)}</p>
              </div>
              <div className="rounded-lg p-3 bg-primary text-primary-foreground text-center shadow-md">
                <p className="text-[10px] font-bold uppercase mb-1 opacity-80">Receivable</p>
                <p className="text-sm font-bold">{money(order.total)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-muted/50 border-t px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`size-2 rounded-full ${
              order.status === 'delivered' ? 'bg-emerald-500' :
              order.status === 'cancelled' ? 'bg-rose-500' : 'bg-primary'
            }`} />
            <span className="text-xs font-bold text-muted-foreground uppercase">Status: {order.status}</span>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 rounded border bg-card px-3 py-1.5 text-xs font-bold transition-all hover:bg-muted shadow-sm">
              <Download className="size-3.5" /> Invoice
            </button>
            <button onClick={onClose} className="rounded bg-primary px-5 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition-all shadow-md">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
