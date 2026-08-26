import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Trash2, Minus, Plus, ShoppingBag, LogIn } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { useCart } from "@/lib/cart";
import { useI18n, pick } from "@/lib/i18n";
import { formatBDT } from "@/lib/data";
import { ProductImage } from "@/components/ProductImage";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Shopping Cart — Bazar BD" },
      { name: "description", content: "Review the items in your Bazar BD cart, update quantities and continue to checkout with cash on delivery." },
      { property: "og:title", content: "Shopping Cart — Bazar BD" },
      { property: "og:description", content: "Review your cart and checkout securely on Bazar BD." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),

  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal, clear } = useCart();
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Removed mandatory sign-in for cart view. Any user can view their cart.

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-none px-4 py-16 text-center">
          <ShoppingBag className="mx-auto size-20 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">{t("empty_cart")}</h1>
          <Link to="/" className="mt-4 inline-block rounded bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground">
            {t("continue_shopping")}
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-none px-3 py-4 md:px-4">
        <h1 className="mb-3 text-xl font-bold">{t("cart")} ({items.length})</h1>
        <div className="grid gap-4 md:grid-cols-[1fr_320px]">
          <div className="space-y-2">
            {items.map(({ product: p, qty }) => (
              <div key={p.id} className="flex gap-3 rounded-md bg-card p-3 shadow-card">
                <Link to="/product/$id" params={{ id: p.id }} className="size-24 shrink-0 overflow-hidden rounded bg-muted">
                  <ProductImage src={p.image} alt="" className="size-full object-cover" />
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link to="/product/$id" params={{ id: p.id }} className="line-clamp-2 text-sm hover:text-primary">
                      {pick(p.title, lang)}
                    </Link>
                    <p className="text-xs text-muted-foreground">{p.brand}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded border">
                      <button onClick={() => setQty(p.id, qty - 1)} className="grid size-7 place-items-center hover:bg-muted">
                        <Minus className="size-3" />
                      </button>
                      <span className="w-8 text-center text-xs">{qty}</span>
                      <button onClick={() => setQty(p.id, qty + 1)} className="grid size-7 place-items-center hover:bg-muted">
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <span className="text-[15px] md:text-[14px] font-bold text-[#A52A2A] dark:text-[#E9967A] leading-none whitespace-nowrap">{formatBDT(p.price * qty)}</span>
                  </div>
                </div>
                <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive" aria-label={t("remove")}>
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <button onClick={clear} className="text-xs text-muted-foreground hover:text-destructive">
              Clear cart
            </button>
          </div>
          <aside className="self-start rounded-md bg-card p-4 shadow-card">
            <h2 className="mb-3 font-bold">Order Summary</h2>
            <div className="space-y-2 border-b pb-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span>{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("free_shipping")}</span>
                <span className="text-success">৳0</span>
              </div>
            </div>
            <div className="flex justify-between py-3 text-base font-bold">
              <span>Total</span>
              <span className="text-[#A52A2A] dark:text-[#E9967A]">{formatBDT(subtotal)}</span>
            </div>
            <Link
              to="/checkout"
              className="group relative block w-full overflow-hidden rounded-full border-2 border-transparent bg-card py-3 text-center text-sm font-bold text-foreground shadow-lg transition-all active:scale-[0.98]"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 p-[2px]">
                <span className="block size-full rounded-full bg-card transition-colors group-hover:bg-transparent" />
              </span>
              <span className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 bg-clip-text text-transparent transition-colors group-hover:text-white">
                {t("checkout")} ({items.length})
              </span>
            </Link>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}
