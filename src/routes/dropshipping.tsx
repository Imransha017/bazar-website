import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { useAuth } from "@/lib/auth";
import { getMyDropshipper, type Dropshipper } from "@/lib/dropshipper";
import { LayoutDashboard, PackagePlus, ShoppingBag, Wallet, Settings, Rocket, DollarSign, Megaphone, Link2, Menu, X as CloseIcon, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/dropshipping")({
  head: () => ({
    meta: [
      { title: "Dropshipping Dashboard — Bazar BD" },
      { name: "description", content: "Manage your dropshipping store: import products, track orders and request payouts." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DropshipperShell,
});

export type DropshipperCtx = { ds: Dropshipper };

function DropshipperShell() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ds-sidebar-collapsed') === 'true';
    }
    return false;
  });
  const [ds, setDs] = useState<Dropshipper | null | undefined>(undefined);

  const isApplyRoute = loc.pathname === "/dropshipping/apply";

  useEffect(() => {
    if (isApplyRoute) return;
    if (loading) return;
    if (!user) { nav({ to: "/auth", search: { redirect: "/dropshipping", mode: "login" }, replace: true }); return; }
    getMyDropshipper().then(setDs).catch(() => setDs(null));
  }, [user, loading, nav, isApplyRoute]);

  // The apply route is a child of this layout but must be reachable
  // to users who haven't been approved yet — otherwise the fallback
  // below hides the form and the "Apply now" button loops back here.
  if (isApplyRoute) {
    return <Outlet />;
  }

  if (loading || ds === undefined) {
    return <SiteLayout><div className="p-16 text-center text-sm text-muted-foreground">Loading…</div></SiteLayout>;
  }

  if (!ds || ds.status !== "approved") {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md p-8 text-center">
          <Rocket className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-3 text-xl font-bold">
            {!ds ? "You haven't applied yet" : ds.status === "pending" ? "Awaiting approval" : "Account not active"}
          </h1>
          <Link to="/dropshipping/apply" className="mt-4 inline-block rounded bg-primary px-6 py-2 text-sm font-bold text-primary-foreground">
            {!ds ? "Apply now" : "View application"}
          </Link>
        </div>
      </SiteLayout>
    );
  }


  const tabs: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
    { to: "/dropshipping", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/dropshipping/products", label: "Products", icon: PackagePlus },
    { to: "/dropshipping/orders", label: "Orders", icon: ShoppingBag },
    { to: "/dropshipping/earnings", label: "Earnings", icon: DollarSign },
    { to: "/dropshipping/payouts", label: "Payouts", icon: Wallet },
    { to: "/dropshipping/marketing", label: "Marketing", icon: Megaphone },
    { to: "/dropshipping/links", label: "Link History", icon: Link2 },
    { to: "/dropshipping/support", label: "Support", icon: MessageSquare },
    { to: "/dropshipping/settings", label: "Settings", icon: Settings },
  ];


  return (
    <SiteLayout>
      <div className="relative min-h-screen bg-[#FDF8E7]">
        {/* Dropshipping Dashboard Header */}
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
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-slate-900 leading-none truncate">{ds.store_name}</h1>
                <p className="mt-0.5 sm:mt-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest text-primary truncate">Dropshipper Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Link 
                to="/ds/$slug" 
                params={{ slug: ds.store_slug }} 
                target="_blank" 
                className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border-2 border-slate-900 px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black text-slate-900 hover:bg-slate-900 hover:text-white transition-all active:scale-95"
              >
                <span className="hidden xs:inline">View Public Store</span>
                <span className="xs:hidden">Store</span>
              </Link>
              <div className="h-6 sm:h-8 w-px bg-slate-200 mx-0.5 sm:mx-1 hidden xs:block" />
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-600">{ds.store_name.substring(0, 2).toUpperCase()}</span>
                </div>
              </div>
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
                const Icon = t.icon;
                return (
                  <Link 
                    key={t.to} 
                    to={t.to as "/dropshipping"} 
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 sm:gap-3.5 rounded-lg sm:rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm font-bold transition-all duration-200 ${
                      active 
                        ? "bg-primary text-white shadow-lg shadow-primary/20 ring-1 ring-primary" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${active ? "text-white" : "text-slate-400"}`} />
                    {t.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-3 sm:p-4 border-t bg-slate-50/50">
              <Link 
                to="/ds/$slug" 
                params={{ slug: ds.store_slug }} 
                target="_blank"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg sm:rounded-xl bg-slate-900 py-2.5 sm:py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
              >
                Visit Store
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={`mx-auto w-full ${loc.pathname === '/dropshipping/orders' ? 'p-0 sm:p-8 max-w-none' : 'max-w-7xl p-3 sm:p-8'}`}>
          <Outlet />
        </main>
      </div>
    </SiteLayout>
  );
}
