import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ClipboardList, Filter, Search, RefreshCw, AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader, Surface, Badge } from "@/lib/admin-ui";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { formatBDT } from "@/lib/data";

export const Route = createFileRoute("/sys-x7k9-control/audit-logs")({
  component: AuditLogs,
});

type StockLog = {
  id: string;
  product_id: string;
  order_id: string | null;
  change_amount: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  created_at: string;
  product?: { name: string; sku: string | null };
  order?: { order_number: string };
};

function AuditLogs() {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [reasonFilter, setReasonFilter] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    let q = supabase
      .from("stock_logs")
      .select(`
        *,
        product:products(name, sku),
        order:orders(order_number)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (reasonFilter !== "all") {
      q = q.eq("reason", reasonFilter);
    }

    const { data, error } = await q;
    if (error) console.error(error);
    else setLogs(data as StockLog[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [reasonFilter]);

  const filteredLogs = logs.filter(log => 
    log.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.order?.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={ClipboardList} 
        title="Stock & Audit Logs" 
        subtitle="Track every inventory change, order deduction, and restock event" 
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by product, SKU, order #..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={reasonFilter}
          onChange={(e) => setReasonFilter(e.target.value)}
        >
          <option value="all">All Reasons</option>
          <option value="order_placed">Order Placed</option>
          <option value="order_cancelled">Order Cancelled</option>
          <option value="order_failed">Order Failed</option>
          <option value="stock_skip_failed">Stock Skip (Failed)</option>
          <option value="stock_skip_cancelled">Stock Skip (Cancelled)</option>
        </select>

        <button 
          onClick={fetchLogs}
          className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <Surface className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Event / Reason</th>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3 text-center">Change</th>
                <th className="px-4 py-3 text-right">New Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="py-20 text-center text-muted-foreground">Loading logs...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-muted-foreground">No logs found matching filters.</td></tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{log.product?.name || "Unknown Product"}</div>
                      <div className="text-[10px] text-muted-foreground">SKU: {log.product?.sku || "N/A"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ReasonBadge reason={log.reason} />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {log.order?.order_number ? (
                        <Link 
                          to="/sys-x7k9-control/orders" 
                          search={{ search: log.order.order_number }}
                          className="text-primary hover:underline"
                        >
                          {log.order.order_number}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {log.change_amount > 0 ? (
                          <span className="flex items-center gap-0.5 font-bold text-emerald-600">
                            <TrendingUp className="h-3 w-3" /> +{log.change_amount}
                          </span>
                        ) : log.change_amount < 0 ? (
                          <span className="flex items-center gap-0.5 font-bold text-rose-600">
                            <TrendingDown className="h-3 w-3" /> {log.change_amount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground/60">Prev: {log.previous_stock}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      {log.new_stock}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Surface>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Surface className="bg-amber-50/50 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/30">
          <h3 className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" /> Stock Protection Guard
          </h3>
          <p className="mt-2 text-xs text-amber-700/80 dark:text-amber-400/70 leading-relaxed">
            Every order placement checks for payment status. If an order is flagged as <strong>failed</strong> or <strong>cancelled</strong> during checkout, stock deduction is bypassed automatically. All skips are logged above for transparency.
          </p>
        </Surface>
        
        <Surface className="bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30">
          <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-400">
            <RefreshCw className="h-4 w-4" /> Automatic Reconciliation
          </h3>
          <p className="mt-2 text-xs text-emerald-700/80 dark:text-emerald-400/70 leading-relaxed">
            When an existing order is cancelled or refunded via the admin/vendor panel, the <code>trg_restock_on_cancel_refund</code> trigger instantly returns the items to the inventory and creates an audit entry.
          </p>
        </Surface>
      </div>
    </div>
  );
}

function ReasonBadge({ reason }: { reason: string }) {
  const r = reason.toLowerCase();
  if (r === "order_placed") return <Badge tone="sky">Deduction</Badge>;
  if (r === "order_cancelled" || r === "order_refunded") return <Badge tone="emerald">Restock</Badge>;
  if (r === "order_failed") return <Badge tone="rose">Failed Order</Badge>;
  if (r.startsWith("stock_skip")) return <Badge tone="indigo">Bypassed</Badge>;
  return <Badge tone="slate">{reason}</Badge>;
}
