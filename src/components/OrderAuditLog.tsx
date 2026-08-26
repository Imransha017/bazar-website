import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Loader2, RefreshCw, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

type OrderAuditLogEntry = {
  id: string;
  order_id: string;
  event_type: string;
  severity: string;
  message: string;
  metadata: any;
  actor_id: string | null;
  created_at: string;
};

const SEVERITY_ICONS: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertTriangle,
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "text-blue-500 bg-blue-50 border-blue-100",
  warning: "text-amber-500 bg-amber-50 border-amber-100",
  error: "text-rose-500 bg-rose-50 border-rose-100",
};

export function OrderAuditLog({ orderId }: { orderId: string }) {
  const [logs, setLogs] = useState<OrderAuditLogEntry[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("order_audit_logs" as any)
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setLogs((data as any) ?? []);
    } catch (err) {
      console.error("Failed to fetch order audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [orderId]);

  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Attribution & RLS Debug Log
        </div>
        <button 
          onClick={fetchLogs} 
          disabled={loading}
          className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold hover:bg-slate-50 transition-colors"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Refresh
        </button>
      </div>

      {!logs ? (
        <div className="py-8 text-center text-[11px] text-slate-400 italic">Initializing debug logs...</div>
      ) : logs.length === 0 ? (
        <div className="py-6 text-center text-[11px] text-slate-400 border border-dashed border-slate-100 rounded-lg">
          No attribution or system logs for this order yet.
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => {
            const Icon = SEVERITY_ICONS[log.severity] || Info;
            const colors = SEVERITY_COLORS[log.severity] || "text-slate-500 bg-slate-50 border-slate-100";
            
            return (
              <div key={log.id} className={`rounded-lg border p-2.5 text-[11px] transition-all hover:shadow-sm ${colors}`}>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 shrink-0">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold uppercase text-[9px] tracking-widest opacity-70">
                        {log.event_type.replace('_', ' ')}
                      </span>
                      <span className="text-[9px] opacity-60">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-medium leading-relaxed">{log.message}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-2 rounded bg-white/40 p-1.5 font-mono text-[9px] overflow-x-auto whitespace-pre border border-black/5">
                        {JSON.stringify(log.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-3 text-[9px] text-slate-400 leading-tight">
        <p><b>Internal Audit:</b> This log records technical attribution events and RLS access checks. It is intended for troubleshooting missing orders or commission errors.</p>
      </div>
    </div>
  );
}
