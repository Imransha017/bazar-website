import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import {
  LayoutDashboard, Package, FolderTree, ShoppingBag, LogOut, Tag,
  MessageSquare, BarChart3, Image as ImageIcon, Store, Menu, X, Globe,
  Users, Truck, Settings, Shield, Handshake, Rocket, Wallet, DollarSign, Megaphone, Palette, Lock, Bell, AlertTriangle, Monitor, Smartphone
} from "lucide-react";
import { usePendingResets } from "@/hooks/use-pending-resets";
import { useServerFn } from "@tanstack/react-start";
import { getAdminNotifications, markNotificationRead } from "@/lib/logging.functions";
import { toast } from "sonner";



export const Route = createFileRoute("/sys-x7k9-control")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Bazar BD" },
      { name: "robots", content: "noindex,nofollow,noarchive" },
    ],
  }),
  component: AdminGate,
});

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || "emransha952@gmail.com").toLowerCase().trim();

function AdminGate() {
  const { user, isAdmin, loading, roleLoading, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const isAuthLoading = loading || roleLoading;
  const isSuperAdmin = (user?.email ?? "").toLowerCase() === ADMIN_EMAIL;
  // If user has 'admin' role in user_roles table or matches configured super admin email
  const allowed = !!user && (isAdmin || isSuperAdmin);


  const redirectedRef = useRef(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (redirectedRef.current) return;
    if (!loc.pathname.startsWith("/sys-x7k9-control")) return;

    if (!user) {
      redirectedRef.current = true;
      nav({
        to: "/auth",
        search: { redirect: loc.pathname, mode: "login" },
        replace: true,
      });
    } else if (!allowed) {
      redirectedRef.current = true;
      signOut().finally(() => nav({ to: "/", replace: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthLoading, user, allowed]);

  if (isAuthLoading || !allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
        {isAuthLoading ? "Verifying authorization…" : "Access denied"}
      </div>
    );
  }


  const panels: Panel[] = [
    {
      key: "customer",
      label: "Customer",
      icon: Users,
      color: "from-blue-600 to-cyan-500",
      sections: [
        {
          label: "Customer Sales",
          items: [
            { to: "/sys-x7k9-control/orders", label: "Customer Orders", icon: ShoppingBag, search: { source: "customer" } },
            { to: "/sys-x7k9-control/orders", label: "AI Orders", icon: ShoppingBag, search: { source: "ai" } },
            { to: "/sys-x7k9-control/customers", label: "Customers", icon: Users },
            { to: "/sys-x7k9-control/reviews", label: "Reviews", icon: MessageSquare },
            { to: "/sys-x7k9-control/shipping", label: "Shipping", icon: Truck },
          ],
        },
        {
          label: "Storefront",
          items: [
            { to: "/sys-x7k9-control/banners", label: "Banners", icon: ImageIcon },
            { to: "/sys-x7k9-control/promotions", label: "Promotions", icon: Megaphone },
            { to: "/sys-x7k9-control/coupons", label: "Coupons", icon: Tag },
          ],
        },
      ],
    },
    {
      key: "vendor",
      label: "Vendor",
      icon: Store,
      color: "from-emerald-600 to-teal-500",
      sections: [
        {
          label: "Vendor Management",
          items: [
            { to: "/sys-x7k9-control/vendors", label: "Vendors", icon: Store },
            { to: "/sys-x7k9-control/orders", label: "Vendor Orders", icon: ShoppingBag, search: { source: "vendor" } },
          ],
        },
      ],
    },
    {
      key: "dropshipping",
      label: "Dropshipping",
      icon: Rocket,
      color: "from-fuchsia-600 to-pink-500",
      sections: [
        {
          label: "Dropshipping Program",
          items: [
            { to: "/sys-x7k9-control/dropshippers", label: "Dropshippers", icon: Rocket },
            { to: "/sys-x7k9-control/orders", label: "Dropshipper Orders", icon: ShoppingBag, search: { source: "dropshipper" } },
            { to: "/sys-x7k9-control/dropshipping-earnings", label: "Earnings Ledger", icon: DollarSign },
            { to: "/sys-x7k9-control/dropshipping-payouts", label: "Payouts", icon: Wallet },
            { to: "/sys-x7k9-control/dropshipping-announcements", label: "Announcements", icon: Megaphone },
            { to: "/sys-x7k9-control/dropshipping-settings", label: "Program Settings", icon: Settings },
            { to: "/sys-x7k9-control/ds-diagnostic", label: "E2E Diagnostic", icon: Shield },
          ],
        },
      ],
    },
    {
      key: "affiliate",
      label: "Affiliate",
      icon: Handshake,
      color: "from-indigo-600 to-violet-500",
      sections: [
        {
          label: "Affiliate Program",
          items: [
            { to: "/sys-x7k9-control/affiliates", label: "Affiliates", icon: Handshake },
            { to: "/sys-x7k9-control/orders", label: "Affiliate Orders", icon: ShoppingBag, search: { source: "affiliate" } },
          ],
        },
      ],
    },
    {
      key: "website",
      label: "Full Website",
      icon: LayoutDashboard,
      color: "from-amber-500 to-orange-500",
      sections: [
        {
          label: "Overview",
          items: [
            { to: "/sys-x7k9-control", label: "Dashboard", icon: LayoutDashboard, exact: true },
            { to: "/sys-x7k9-control/analytics", label: "Analytics", icon: BarChart3 },
            { to: "/sys-x7k9-control/related-clicks", label: "Related Clicks", icon: BarChart3 },
            { to: "/sys-x7k9-control/ai-assistant", label: "AI Assistant", icon: MessageSquare },
            { to: "/sys-x7k9-control/whatsapp", label: "WhatsApp Updates", icon: MessageSquare },
          ],
        },
        {
          label: "Catalog",
          items: [
            { to: "/sys-x7k9-control/products", label: "Products", icon: Package },
            { to: "/sys-x7k9-control/offers", label: "Discount & Offers", icon: Tag },
            { to: "/sys-x7k9-control/categories", label: "Categories", icon: FolderTree },

          ],
        },
        {
          label: "System",
          items: [
            { to: "/sys-x7k9-control/staff", label: "Staff & Roles", icon: Shield },
            { to: "/sys-x7k9-control/support", label: "Support Tickets", icon: MessageSquare },
            { to: "/sys-x7k9-control/audit-logs", label: "Audit Logs", icon: Shield },
             { to: "/sys-x7k9-control/audit-logs", label: "Stock Audit", icon: Package },
            { to: "/sys-x7k9-control/password-resets", label: "Password Resets", icon: Lock },
            { to: "/sys-x7k9-control/site-customization", label: "Site Customization", icon: Palette },
            { to: "/sys-x7k9-control/settings", label: "Site Settings", icon: Settings },
          ],
        },
      ],
    },
  ];

  return (
    <>
      <AdminShell panels={panels} email={user.email ?? ""} signOut={async () => { await signOut(); nav({ to: "/", replace: true }); }} pathname={loc.pathname} />
      <div className="hidden">
        {`'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            ড্রপশিপারদের আকৃষ্ট করতে

টিয়ার লেভেল (Bronze→Gold) — বেশি সেলে বেশি প্রফিট মার্জিন, লিডারবোর্ড ও মাসিক বোনাস।

ইনস্ট্যান্ট পেআউট রিকোয়েস্ট — bKash/Nagad-এ ব্যালেন্স উইথড্র, স্ট্যাটাস ট্র্যাকিং সহ।

ওয়ান-ক্লিক "Push to My Store" + রেডিমেড অ্যাড ক্রিয়েটিভ, ভিডিও, ক্যাপশন প্যাক প্রতি প্রোডাক্টে।

মোবাইল-ফার্স্ট সেলস অ্যাপ ভিউ (PWA) — ফোনে ইনস্টল করে অর্ডার/আয় দেখা, নোটিফিকেশন পাওয়া।

ট্রেনিং একাডেমি — ভিডিও লেসন, সার্টিফিকেট; নতুনরা দ্রুত শুরু করতে পারবে।`}
      </div>
    </>
  );
}

type NavItem = { to: string; label: string; icon: any; exact?: boolean; search?: Record<string, unknown> };
type Section = { label: string; items: NavItem[] };
type Panel = { key: string; label: string; icon: any; color: string; sections: Section[] };

const PANEL_STORAGE_KEY = "admin_active_panel";
const DESKTOP_MODE_KEY = "admin_force_desktop";

function DesktopModeToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={on ? "Desktop view (on) — tap for mobile view" : "Mobile view (on) — tap for desktop view"}
      aria-pressed={on}
      className="flex items-center gap-1.5 rounded-lg border border-purple-50/10 bg-purple-50/5 px-2 py-1.5 text-[11px] font-medium hover:bg-purple-50/10 transition"
    >
      {on ? <Monitor className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{on ? "Desktop" : "Mobile"}</span>
      <span
        className={`relative inline-flex h-4 w-8 items-center rounded-full transition ${on ? "bg-amber-400" : "bg-purple-50/20"}`}
      >
        <span
          className={`absolute h-3 w-3 rounded-full bg-white transition-all ${on ? "left-[18px]" : "left-[2px]"}`}
        />
      </span>
    </button>
  );
}

function pickPanelForPath(panels: Panel[], pathname: string): Panel {
  // Prefer the panel that contains the current route
  let best: { panel: Panel; score: number } | null = null;
  for (const p of panels) {
    for (const s of p.sections) {
      for (const i of s.items) {
        const match = i.exact ? pathname === i.to : pathname === i.to || pathname.startsWith(i.to + "/");
        if (match && (!best || i.to.length > best.score)) best = { panel: p, score: i.to.length };
      }
    }
  }
  return best?.panel ?? panels[0];
}

function AdminShell({ panels, email, signOut, pathname }: { panels: Panel[]; email: string; signOut: () => void; pathname: string }) {
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string>(() => {
    if (typeof window === "undefined") return panels[0].key;
    return localStorage.getItem(PANEL_STORAGE_KEY) ?? panels[0].key;
  });
  const { pendingCount } = usePendingResets({ notify: true });
  const [forceDesktop, setForceDesktop] = useState(false);
  const [desktopScale, setDesktopScale] = useState(1);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setForceDesktop(localStorage.getItem(DESKTOP_MODE_KEY) !== "0");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateDesktopScale = () => {
      const nextScale = Math.min(1, Math.max(0.25, window.innerWidth / 1280));
      setDesktopScale(nextScale);
    };

    updateDesktopScale();
    window.addEventListener("resize", updateDesktopScale);
    window.addEventListener("orientationchange", updateDesktopScale);

    return () => {
      window.removeEventListener("resize", updateDesktopScale);
      window.removeEventListener("orientationchange", updateDesktopScale);
    };
  }, []);

  const toggleDesktop = () => {
    setForceDesktop((v) => {
      const next = !v;
      try { localStorage.setItem(DESKTOP_MODE_KEY, next ? "1" : "0"); } catch {}
      return next;
    });
  };
  const [notifications, setNotifications] = useState<any[]>([]);
  const fetchNotifications = useServerFn(getAdminNotifications);
  const markRead = useServerFn(markNotificationRead);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data || []);
    } catch (e) {
      console.error("Failed to load admin notifications:", e);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Ask for browser notification permission once
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);


  // Sync active panel to current route if user navigates into a different panel
  useEffect(() => {
    const p = pickPanelForPath(panels, pathname);
    setActiveKey(p.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(PANEL_STORAGE_KEY, activeKey);
  }, [activeKey]);

  const active = panels.find(p => p.key === activeKey) ?? panels[0];
  const shellStyle = forceDesktop
    ? ({ "--admin-desktop-scale": String(desktopScale) } as CSSProperties)
    : undefined;

  const badgeFor = (to: string): number => {
    if (to === "/sys-x7k9-control/password-resets") return pendingCount;
    return 0;
  };

  return (
    <div
      className={`admin-desktop-shell ${forceDesktop ? "admin-force-desktop" : ""} min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50/40`}
      style={shellStyle}
    >

      <header className="sticky top-0 z-30 border-b border-purple-900/10 bg-purple-950/95 text-purple-50 backdrop-blur supports-[backdrop-filter]:bg-purple-950/80">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 px-2 py-3 sm:gap-3 sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              className="grid h-9 w-9 place-items-center rounded-lg border border-purple-50/10 hover:bg-purple-50/10 transition"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-purple-950 font-black shadow-lg shadow-amber-500/20">
              B
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-tight">Bazar Admin</div>
              <div className="text-[10px] text-purple-200/70 truncate">{email}</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <DesktopModeToggle on={forceDesktop} onToggle={toggleDesktop} />
            <LangToggle />
            <AdminNotificationBell 
              notifications={notifications} 
              onMarkRead={async (id) => {
                await markRead({ data: { id } });
                loadNotifications();
              }} 
            />
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-lg border border-purple-50/10 bg-purple-50/5 px-2 py-1.5 text-xs font-medium hover:bg-purple-50/10 transition sm:px-3"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>

        </div>
        {/* Horizontal panel switcher */}
        <div className="border-t border-purple-50/10 bg-purple-950/60">
          <div className="mx-auto flex max-w-[1600px] gap-1 overflow-x-auto px-2 py-2">
            {panels.map((p) => {
              const isActive = p.key === active.key;
              return (
                <button
                  key={p.key}
                  onClick={() => { setActiveKey(p.key); setOpen(true); }}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    isActive
                      ? `bg-gradient-to-r ${p.color} text-white shadow-md`
                      : "text-purple-100/80 hover:bg-purple-50/10"
                  }`}
                >
                  <p.icon className="h-3.5 w-3.5" />
                  {p.label} Panel
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 top-[110px] z-20 bg-black/50 backdrop-blur-sm" />
      )}

      <aside
        className={`fixed left-0 top-[110px] z-30 h-[calc(100vh-110px)] w-64 overflow-y-auto border-r border-purple-900/10 bg-white p-3 shadow-xl transition-transform ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className={`mb-3 rounded-lg bg-gradient-to-r ${active.color} px-3 py-2 text-xs font-bold text-white shadow`}>
          <div className="flex items-center gap-2">
            <active.icon className="h-4 w-4" />
            {active.label} Control Panel
          </div>
        </div>
        <nav className="flex flex-col gap-4">
          {active.sections.map((sec) => (
            <div key={sec.label}>
              <div className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-purple-700/60">
                {sec.label}
              </div>
              <div className="flex flex-col gap-0.5">
                {sec.items.map((t) => {
                  const isActive = t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/");
                  const badge = badgeFor(t.to);
                  return (
                    <Link
                      key={`${t.label}:${t.to}:${JSON.stringify(t.search ?? {})}`}
                      to={t.to}
                      search={t.search as never}
                      onClick={() => setOpen(false)}
                      className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-gradient-to-r from-purple-900 to-purple-700 text-white shadow-md shadow-purple-900/20"
                          : "text-slate-600 hover:bg-purple-50 hover:text-purple-900"
                      }`}
                    >
                      <t.icon className={`h-4 w-4 ${isActive ? "text-amber-300" : "text-slate-400 group-hover:text-purple-700"}`} />
                      <span className="flex-1">{t.label}</span>
                      {badge > 0 && (
                        <span className={`inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none ${isActive ? "bg-amber-300 text-purple-950" : "bg-red-600 text-white animate-pulse"}`}>
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <main className="mx-auto max-w-[1600px] p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}

function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "bn" ? "en" : "bn")}
      className="flex items-center gap-1.5 rounded-lg border border-purple-50/10 bg-purple-50/5 px-2.5 py-1.5 text-xs font-medium hover:bg-purple-50/10 transition"
      aria-label="Toggle language"
      title="Toggle language"
    >
      <Globe className="h-3.5 w-3.5" /> {lang === "bn" ? "EN" : "বাং"}
    </button>
  );
}

function AdminNotificationBell({ notifications, onMarkRead }: { notifications: any[], onMarkRead: (id: string) => void }) {
  const [show, setShow] = useState(false);
  const count = notifications.length;

  return (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        className="relative flex items-center gap-1.5 rounded-lg border border-purple-50/10 bg-purple-50/5 px-2.5 py-1.5 text-xs font-medium hover:bg-purple-50/10 transition"
      >
        <Bell className={`h-3.5 w-3.5 ${count > 0 ? "animate-swing" : ""}`} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-purple-950">
            {count}
          </span>
        )}
      </button>

      {show && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShow(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-purple-900/10 bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-4 py-3">
              <h3 className="text-sm font-bold text-purple-950">System Notifications</h3>
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                {count} New
              </span>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                  <Bell className="mb-2 h-8 w-8 opacity-20" />
                  <p className="text-xs">All clear! No new alerts.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className="group border-b border-slate-50 px-4 py-3 transition hover:bg-purple-50/30"
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${n.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-bold text-slate-900">{n.title}</p>
                          <span className="shrink-0 text-[10px] text-slate-400">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                          {n.message}
                        </p>
                        <button 
                          onClick={() => onMarkRead(n.id)}
                          className="mt-2 text-[10px] font-bold text-purple-600 opacity-0 transition group-hover:opacity-100 hover:text-purple-700"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


