import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle2, Package, Truck, CreditCard, AlertCircle, Search, Filter, Calendar, X } from "lucide-react";

type Activity = {
  id: string;
  action: string;
  description: string;
  metadata: any;
  created_at: string;
  actor_email?: string | null;
};

const ACTION_ICONS: Record<string, any> = {
  order_placed: CheckCircle2,
  status_change: Package,
  payment_update: CreditCard,
  tracking_added: Truck,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: AlertCircle,
};

const ACTION_COLORS: Record<string, string> = {
  order_placed: "text-emerald-500 bg-emerald-50 border-emerald-100",
  status_change: "text-blue-500 bg-blue-50 border-blue-100",
  payment_update: "text-purple-500 bg-purple-50 border-purple-100",
  tracking_added: "text-indigo-500 bg-indigo-50 border-indigo-100",
  processing: "text-sky-500 bg-sky-50 border-sky-100",
  shipped: "text-indigo-500 bg-indigo-50 border-indigo-100",
  delivered: "text-emerald-500 bg-emerald-50 border-emerald-100",
  cancelled: "text-rose-500 bg-rose-50 border-rose-100",
};

export function OrderTimeline({ orderId }: { orderId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("order_activities" as any)
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });
      setActivities((data as any) ?? []);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel(`order-activities-${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_activities" },
        (payload) => {
          if (payload.new.order_id === orderId) {
            setActivities((prev) => [payload.new as Activity, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const matchesSearch = 
        activity.description.toLowerCase().includes(search.toLowerCase()) ||
        (activity.actor_email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (activity.metadata?.note?.toLowerCase().includes(search.toLowerCase()) ?? false);
      
      const statusKey = activity.metadata?.new_status || activity.action;
      const matchesStatus = statusFilter === "all" || statusKey === statusFilter;
      
      const matchesDate = !dateFilter || activity.created_at.startsWith(dateFilter);
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [activities, search, statusFilter, dateFilter]);

  if (loading) return <div className="animate-pulse space-y-3 pt-2">
    {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-50 rounded" />)}
  </div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${showFilters ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          <Filter className="h-3 w-3" />
          {showFilters ? "Hide Filters" : "Filter History"}
        </button>
        {(search || statusFilter !== "all" || dateFilter) && (
          <button 
            onClick={() => { setSearch(""); setStatusFilter("all"); setDateFilter(""); }}
            className="flex items-center gap-1 text-[10px] text-rose-500 hover:text-rose-600 font-bold uppercase"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-2 rounded-md border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search description or updater..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-[10px] border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-[10px] border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 appearance-none"
            >
              <option value="all">All Statuses</option>
              {Object.keys(ACTION_ICONS).map(status => (
                <option key={status} value={status}>{status.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-[10px] border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
            />
          </div>
        </div>
      )}

      <div className="mt-4 relative space-y-4 before:absolute before:inset-y-0 before:left-4 before:w-px before:bg-slate-100">
        {filteredActivities.length === 0 && (
          <div className="flex items-center gap-3 pl-10 text-slate-400 py-4">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs">No matching activity found</span>
          </div>
        )}
        {filteredActivities.map((item) => {
        const statusKey = item.metadata?.new_status || item.action;
        const Icon = ACTION_ICONS[statusKey] || Clock;
        const colors = ACTION_COLORS[statusKey] || "text-slate-500 bg-slate-50 border-slate-100";
        
        return (
          <div key={item.id} className="relative pl-10 group">
            <div className={`absolute left-0 top-0.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition-transform group-hover:scale-110 ${colors}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-800">{item.description}</div>
                <div className="text-[10px] font-medium text-slate-400">
                  {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
              
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                <span className="font-bold text-slate-700">Updated by:</span> 
                <span className="rounded-sm bg-slate-100 px-1 py-0.5 text-slate-600 font-medium">
                  {item.actor_email || "System"}
                </span>
              </div>

              {item.metadata?.new_status && (
                <div className="mt-1">
                  <span className="inline-flex items-center rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700">
                    {item.metadata.new_status}
                  </span>
                </div>
              )}
              {item.metadata?.note && (
                <div className="mt-1 rounded bg-amber-50 px-2 py-1 text-[10px] text-amber-800 italic border border-amber-100">
                  {item.metadata.note}
                </div>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
