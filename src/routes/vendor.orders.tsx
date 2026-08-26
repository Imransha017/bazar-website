import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { supabase } from "@/integrations/supabase/client";
import { getMyVendor } from "@/lib/vendor";
import { toast } from "sonner";
import { User, Phone, Mail, MapPin, CreditCard, Package, Truck, StickyNote, Clock, Hash, X, ShoppingBag, Printer, Store, Download, Eye } from "lucide-react";
import { OrderAutocomplete } from "@/components/OrderAutocomplete";
import { openPrintableInvoice } from "@/lib/print-invoice";
import { OrderTimeline } from "@/components/OrderTimeline";
import { exportToCSV, formatOrdersForExport } from "@/lib/export-utils";

import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";

const searchSchema = z.object({
  page: fallback(z.number(), 1).default(1),
  filter: fallback(z.string(), "all").default("all"),
  search: fallback(z.string(), "").default(""),
  date: fallback(z.string(), "").default(""),
  sortCol: fallback(z.string(), "created_at").default("created_at"),
  sortDir: fallback(z.enum(["asc", "desc"]), "desc").default("desc"),
});

export const Route = createFileRoute("/vendor/orders")({
  validateSearch: zodValidator(searchSchema),
  component: VendorOrders,
});

type Item = { name?: string; qty: number; price: number; image?: string; sku?: string; size?: string; color?: string; variant?: string };
type Order = {
  id: string; order_number: string;
  customer_name: string; customer_phone: string; customer_email: string | null;
  address: string; district: string | null; thana: string | null;
  items: Item[];
  subtotal: number; delivery_fee: number; total: number;
  discount: number | null; coupon_code: string | null;
  payment_method: string; payment_type: string | null;
  txn_id: string | null; sender_phone: string | null; paid_amount: number | null;
  status: string; notes: string | null;
  courier_name: string | null; tracking_number: string | null; tracking_url: string | null;
  created_at: string; updated_at: string | null;
  dropshipper?: { store_name: string; phone: string; code: string } | null;
};

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-sky-100 text-sky-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

function VendorOrders() {
  const { page, filter, search, date: dateFilter, sortCol, sortDir } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [vendorId, setVendorId] = useState<string | undefined>();
  const [open, setOpen] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const pageSize = 50;
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebounce(localSearch, 500);
  const hasAnyFilter = filter !== "all" || dateFilter !== "" || search !== "";

  const reload = async () => {
    setLoading(true);
    const v = await getMyVendor();
    if (!v) { setLoading(false); return; }
    setVendorId(v.id);

    // Get my dropshipper profile if I have one (users can be both vendor and dropshipper)
    const { data: dsProfile } = await supabase.from("dropshippers").select("code").eq("user_id", v.user_id).maybeSingle();
    
    let query = supabase.from("orders")
      .select("*, dropshipper:dropshippers(store_name, phone, code)", { count: "exact" });

    const orConditions = [`vendor_id.eq.${v.id}`, `items->0->>vendor_id.eq.${v.id}`];
    if (dsProfile?.code) {
      orConditions.push(`dropshipper_id.eq.${v.id}`);
      orConditions.push(`dropshipper_code.eq.${dsProfile.code}`);
    }
    
    query = query.or(orConditions.join(","));
    
    if (filter !== "all") {
      const statuses = filter.split(",");
      query = query.in("status", statuses);
    }
    if (dateFilter) query = query.gte("created_at", `${dateFilter}T00:00:00`).lte("created_at", `${dateFilter}T23:59:59`);
    
    if (search) {
      const s = `%${search}%`;
      query = query.or(`order_number.ilike.${s},customer_name.ilike.${s},customer_phone.ilike.${s}`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count } = await query
      .order(sortCol, { ascending: sortDir === "asc" })
      .range(from, to);
      
    setOrders((data ?? []) as unknown as Order[]);
    setTotalCount(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { reload(); }, [filter, search, dateFilter, page, sortCol, sortDir]);
  
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch !== search) {
      navigate({ search: (prev) => ({ ...prev, search: debouncedSearch, page: 1 }) });
    }
  }, [debouncedSearch]);

  const updateStatus = async (id: string, status: string) => {
    const oldStatus = orders.find(o => o.id === id)?.status;
    if (oldStatus === status) return;

    const note = prompt("Enter a note for this status change (optional):");
    const { data: updatedData, error, count } = await supabase.from("orders").update({ 
      status,
      updated_at: new Date().toISOString()
    }).eq("id", id).eq("vendor_id", vendorId as string).select();

    if (error) return toast.error(error.message);
    if (!updatedData || updatedData.length === 0) {
      toast.error("Access Denied", {
        description: "You cannot update this order. Please ensure you are selecting an order that belongs to your store."
      });
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("order_activities").insert({
      order_id: id,
      action: "status_change",
      description: `Status changed to ${status}`,
      actor_email: user?.email,
      vendor_id: vendorId,
      metadata: { old_status: oldStatus, new_status: status, note: note }
    } as any);

    toast.success("Order status updated");
    reload();
  };

  const toggleSort = (col: string) => {
    const dir = sortCol === col && sortDir === "desc" ? "asc" : "desc";
    navigate({ search: (prev) => ({ ...prev, sortCol: col, sortDir: dir, page: 1 }) });
  };

  const SortIcon = ({ col }: { col: string }) => (
    <span className="ml-1 opacity-20">{sortCol === col ? (sortDir === "desc" ? "↓" : "↑") : "↕"}</span>
  );

  if (loading) return <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Orders</h1>
        {hasAnyFilter && (
          <button 
            onClick={() => navigate({ search: (prev) => ({ ...prev, filter: "all", date: "", search: "", page: 1 }) })}
            className="rounded-full px-3 py-1 text-[10px] font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition shadow-sm animate-pulse"
          >
            Reset All Filters
          </button>
        )}
        <button 
          onClick={() => exportToCSV(formatOrdersForExport(orders), `vendor-orders-${new Date().toISOString().split('T')[0]}.csv`)}
          className="ml-auto flex items-center gap-2 rounded border bg-card px-3 py-1.5 text-xs hover:bg-muted"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="flex flex-col gap-2 bg-muted/30 p-2 rounded-lg border">
        <div className="flex flex-wrap gap-2 items-center">
          <OrderAutocomplete
            placeholder="Search..."
            value={localSearch}
            onChange={val => setLocalSearch(val)}
            className="w-48"
            context="vendor"
            vendorId={vendorId}
          />
          <div className="flex flex-col gap-1">
            <input
              type="date"
              value={dateFilter}
              onChange={e => navigate({ search: (prev) => ({ ...prev, date: e.target.value, page: 1 }) })}
              className="rounded border bg-card px-3 py-1.5 text-sm"
            />
            <div className="flex gap-1 text-[9px] font-bold text-primary">
              <button onClick={() => navigate({ search: (prev) => ({ ...prev, date: new Date().toISOString().split('T')[0], page: 1 }) })} className="hover:underline">Today</button>
              <button onClick={() => {
                const d = new Date(); d.setDate(d.getDate() - 7);
                navigate({ search: (prev) => ({ ...prev, date: d.toISOString().split('T')[0], page: 1 }) });
              }} className="hover:underline">7 Days</button>
            </div>
          </div>
          <select value={filter} onChange={e => navigate({ search: (prev) => ({ ...prev, filter: e.target.value, page: 1 }) })} className="rounded border bg-card px-3 py-1.5 text-sm">
            <option value="all">All</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-lg bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs">
            <tr>
              <th className="p-3 text-left cursor-pointer hover:text-primary" onClick={() => toggleSort("order_number")}>
                Order # <SortIcon col="order_number" />
              </th>
              <th className="p-3 text-left cursor-pointer hover:text-primary" onClick={() => toggleSort("customer_name")}>
                Customer <SortIcon col="customer_name" />
              </th>
              <th className="p-3 text-right cursor-pointer hover:text-primary" onClick={() => toggleSort("total")}>
                Total <SortIcon col="total" />
              </th>
              <th className="p-3 text-center cursor-pointer hover:text-primary" onClick={() => toggleSort("status")}>
                Status <SortIcon col="status" />
              </th>
              <th className="p-3 text-left cursor-pointer hover:text-primary" onClick={() => toggleSort("created_at")}>
                Date <SortIcon col="created_at" />
              </th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b animate-pulse">
                  <td className="p-3"><div className="h-4 w-20 bg-muted rounded"></div></td>
                  <td className="p-3"><div className="h-4 w-24 bg-muted rounded"></div></td>
                  <td className="p-3"><div className="h-4 w-16 bg-muted rounded ml-auto"></div></td>
                  <td className="p-3"><div className="h-6 w-16 bg-muted rounded-full mx-auto"></div></td>
                  <td className="p-3"><div className="h-4 w-8 bg-muted rounded ml-auto"></div></td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No orders found</td></tr>
            ) : (
              orders.map(o => (
                <tr key={o.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{o.order_number}</td>
                  <td className="p-3 text-xs">{o.customer_name}</td>
                  <td className="p-3 text-right font-bold">৳{Number(o.total).toFixed(0)}</td>
                  <td className="p-3 text-center">
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className={`rounded border px-1.5 py-0.5 text-[10px] capitalize ${STATUS_COLORS[o.status]}`}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <button 
                      onClick={() => setOpen(o)} 
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
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-xs text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} orders
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => navigate({ search: (prev) => ({ ...prev, page: Math.max(1, page - 1) }) })}
              disabled={page === 1}
              className="px-3 py-1 text-xs border rounded hover:bg-muted disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              onClick={() => navigate({ search: (prev) => ({ ...prev, page: Math.min(Math.ceil(totalCount / pageSize), page + 1) }) })}
              disabled={page >= Math.ceil(totalCount / pageSize)}
              className="px-3 py-1 text-xs border rounded hover:bg-muted disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {open && <OrderDetailModal order={open} onClose={() => setOpen(null)} onUpdateStatus={(s) => updateStatus(open.id, s)} />}
    </div>
  );
}

function OrderDetailModal({ order, onClose, onUpdateStatus }: { order: Order; onClose: () => void; onUpdateStatus: (status: string) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" onClick={onClose}>
      <div className="my-6 w-full max-w-3xl rounded-xl bg-background p-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-lg font-bold">Order {order.order_number}</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-bold text-sm mb-2">Customer Info</h3>
            <p className="text-sm">{order.customer_name}</p>
            <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
            <p className="text-xs mt-1">{order.address}</p>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-2">Order Items</h3>
            <div className="space-y-1">
              {order.items.map((it, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span>{it.name} x {it.qty}</span>
                  <span>৳{(it.price * it.qty).toFixed(0)}</span>
                </div>
              ))}
              <div className="border-t pt-1 font-bold flex justify-between">
                <span>Total</span>
                <span>৳{Number(order.total).toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase text-slate-700 mb-3">
              <Clock className="h-4 w-4" /> Order History
            </div>
            <div className="max-h-48 overflow-y-auto">
              <OrderTimeline orderId={order.id} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase text-slate-700 mb-3">
              <Store className="h-4 w-4" /> Attribution
            </div>
            <div className="rounded bg-muted/50 p-2.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Store:</span>
                <span className="font-semibold">{order.dropshipper?.store_name || "Direct Vendor Sale"}</span>
              </div>
              {order.dropshipper?.code && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dropshipper Code:</span>
                  <span className="font-mono">{order.dropshipper.code}</span>
                </div>
              )}
              {order.dropshipper?.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dropshipper Contact:</span>
                  <span>{order.dropshipper.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <button onClick={() => openPrintableInvoice(order as any)} className="px-3 py-1.5 border rounded text-xs hover:bg-muted transition-colors">Print Invoice</button>
          <button onClick={onClose} className="px-3 py-1.5 bg-primary text-white rounded text-xs hover:opacity-90 transition-opacity">Close</button>
        </div>
      </div>
    </div>
  );
}
