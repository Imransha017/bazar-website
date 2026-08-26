import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { getMyVendor, type Vendor } from "@/lib/vendor";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Package, ShoppingBag, Store, LogOut, Clock, Globe, Menu, X as CloseIcon, Rocket, MessageSquare, Bell, Star } from "lucide-react";

function usePendingOrderCount(vendorId: string | undefined) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!vendorId) return;
    let cancelled = false;
    const load = async () => {
      const { count: c } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("vendor_id", vendorId)
        .eq("status", "pending");
      if (!cancelled) setCount(c ?? 0);
    };
    load();
    const ch = supabase
      .channel(`vendor-pending-${vendorId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `vendor_id=eq.${vendorId}` }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [vendorId]);
  return count;
}

export const Route = createFileRoute("/vendor")({
  head: () => ({ meta: [{ title: "Vendor Dashboard — Bazar BD" }, { name: "robots", content: "noindex" }] }),
  component: VendorGate,
});

function VendorGate() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [checking, setChecking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const pendingCount = usePendingOrderCount(vendor?.id);

  const loadNotifications = async (vid: string) => {
    const { data } = await supabase
      .from("vendor_notifications")
      .select("*")
      .eq("vendor_id", vid)
      .is("read_at", null)
      .order("created_at", { ascending: false });
    setNotifications(data ?? []);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("vendor_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    setNotifications(n => n.filter(x => x.id !== id));
  };



  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/auth", search: { redirect: "/vendor", mode: "login" } }); return; }
    getMyVendor().then(v => { 
      setVendor(v); 
      setChecking(false); 
      if (v) loadNotifications(v.id);
    });
  }, [user, loading, nav]);

  if (loading || checking) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;

  if (!vendor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
          <Store className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-3 text-xl font-bold">You're not a vendor yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">Apply to open your store on Bazar BD.</p>
          <Link to="/become-vendor" className="mt-4 inline-block rounded bg-primary px-6 py-2 text-sm font-bold text-primary-foreground">Become a Vendor</Link>
        </div>
      </div>
    );
  }

  const isApproved = vendor.status === "approved";

  const tabs = [
    { to: "/vendor", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/vendor/products", label: "Products", icon: Package },
    { to: "/vendor/orders", label: "Orders", icon: ShoppingBag, badgeKey: "orders" as const },
    { to: "/vendor/store", label: "Store Info", icon: Store },
    { to: "/vendor/support", label: "Support", icon: MessageSquare },
  ];

  return (
    <div className="relative min-h-screen bg-[#FDF8E7]">
      {/* Vendor Dashboard Header */}
      <header className="sticky top-0 z-40 flex h-16 sm:h-20 w-full items-center bg-white border-b px-4 sm:px-8 shadow-sm">
        <div className="flex w-full items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="group relative flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-primary shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 cursor-pointer"
              aria-label="Open Menu"
            >
              <Rocket className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              <div className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-white border border-primary text-[8px] font-black text-primary animate-bounce">
                <Menu className="h-2 w-2" />
              </div>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-slate-900 leading-none truncate">{vendor.store_name}</h1>
                {vendor.badge === 'Top Vendor' && (
                  <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-black text-amber-700 shadow-sm ring-1 ring-amber-200">
                    <Star className="h-2 w-2 fill-current" /> TOP VENDOR
                  </span>
                )}
              </div>
              <p className="mt-0.5 sm:mt-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest text-primary truncate">Vendor Panel</p>


            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link 
              to="/store/$slug" 
              params={{ slug: vendor.slug }} 
              className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border-2 border-slate-900 px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black text-slate-900 hover:bg-slate-900 hover:text-white transition-all active:scale-95"
            >
              <span className="hidden xs:inline">View Store</span>
              <span className="xs:hidden">Store</span>
            </Link>
            <VendorLangToggle />
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted"
              >
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                    {notifications.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border bg-white p-2 shadow-2xl z-50">
                  <div className="mb-2 px-2 pt-1 text-xs font-black uppercase tracking-widest text-slate-400">Notifications</div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">No new notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="mb-1 rounded-lg bg-slate-50 p-3 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => markAsRead(n.id)}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-[11px] font-bold text-slate-900 leading-tight">{n.title}</div>
                            <div className={`mt-0.5 size-2 rounded-full flex-shrink-0 ${n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                          </div>
                          <div className="mt-1 text-[10px] text-slate-500 line-clamp-2">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={async () => { await signOut(); nav({ to: "/", replace: true }); }} 
              className="hidden xs:flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[10px] sm:text-xs hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar Menu */}
      <aside className={`fixed inset-y-0 left-0 z-[60] w-64 sm:w-72 transform bg-white shadow-2xl transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="flex h-16 sm:h-20 items-center justify-between px-5 sm:px-6 border-b bg-[#FDF8E7]/50">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-primary shadow-lg shadow-primary/20">
                <Rocket className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">Menu</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-lg p-2 hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1 sm:space-y-1.5 custom-scrollbar">
            {tabs.map(t => {
              const active = t.exact ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
              const showBadge = t.badgeKey === "orders" && pendingCount > 0;
              const Icon = t.icon;
              return (
                <Link 
                  key={t.to} 
                  to={t.to} 
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center justify-between rounded-lg sm:rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm font-bold transition-all duration-200 ${
                    active 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 ring-1 ring-primary" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-3.5">
                    <Icon className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${active ? "text-white" : "text-slate-400"}`} />
                    {t.label}
                  </div>
                  {showBadge && (
                    <span className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-white text-primary" : "bg-rose-600 text-white"}`}>
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 sm:p-4 border-t bg-slate-50/50 space-y-2">
            <Link 
              to="/store/$slug" 
              params={{ slug: vendor.slug }} 
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg sm:rounded-xl bg-slate-900 py-2.5 sm:py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
            >
              Visit Store
            </Link>
            <button 
              onClick={async () => { await signOut(); nav({ to: "/", replace: true }); }}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="mx-auto max-w-7xl p-3 sm:p-8">
        {!isApproved && (
          <div className={`mb-4 rounded-lg border-2 p-4 shadow-sm ${
            vendor.status === "pending" ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30" :
            vendor.status === "rejected" ? "border-rose-400 bg-rose-50 dark:bg-rose-950/30" :
            "border-slate-400 bg-slate-50 dark:bg-slate-950/30"
          }`}>
            <div className="flex items-start gap-3">
              <Clock className={`h-6 w-6 flex-shrink-0 ${
                vendor.status === "pending" ? "text-amber-600" :
                vendor.status === "rejected" ? "text-rose-600" : "text-slate-600"
              }`} />
              <div className="flex-1">
                <div className="text-sm font-bold capitalize">
                  {vendor.status === "pending" && "অ্যাকাউন্ট রিভিউ চলছে — Admin Approval Pending"}
                  {vendor.status === "rejected" && "আবেদন প্রত্যাখ্যাত হয়েছে — Application Rejected"}
                  {vendor.status === "suspended" && "স্টোর সাসপেন্ড করা হয়েছে — Store Suspended"}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {vendor.status === "pending" && "আপনার ভেন্ডার অ্যাকাউন্টটি এডমিন এর অনুমোদনের অপেক্ষায় আছে। অনুমোদন পাওয়ার পর সকল অপশন চালু হবে এবং আপনি পণ্য যোগ ও অর্ডার ম্যানেজ করতে পারবেন। Your vendor account is awaiting admin approval. All features will be enabled once approved."}
                  {vendor.status === "rejected" && "দুঃখিত, আপনার আবেদন গ্রহণ করা হয়নি। আরও তথ্যের জন্য এডমিন এর সাথে যোগাযোগ করুন।"}
                  {vendor.status === "suspended" && "আপনার স্টোর সাময়িকভাবে বন্ধ রাখা হয়েছে। বিস্তারিত জানতে এডমিন এর সাথে যোগাযোগ করুন।"}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className={!isApproved ? "pointer-events-none select-none opacity-50" : ""} aria-disabled={!isApproved}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function VendorLangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "bn" ? "en" : "bn")}
      className="flex items-center gap-1 rounded border px-3 py-1.5 text-xs hover:bg-muted"
      aria-label="Toggle language"
    >
      <Globe className="h-3.5 w-3.5" /> {lang === "bn" ? "EN" : "বাং"}
    </button>
  );
}
