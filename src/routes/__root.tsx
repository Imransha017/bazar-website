import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { I18nProvider } from "@/lib/i18n";
import { CartProvider } from "@/lib/cart";
import { OrdersProvider } from "@/lib/orders";
import { AuthProvider } from "@/lib/auth";
import { WishlistProvider } from "@/lib/wishlist";
import { RecentlyViewedProvider } from "@/lib/recently-viewed";
import { Toaster } from "sonner";

import { AffiliateRefCapture } from "@/components/AffiliateRefCapture";
import { DropshipperRefCapture } from "@/components/DropshipperRefCapture";
import { logClientError } from "@/lib/logging.functions";
import { AIChatbot } from "@/components/ai/AIChatbot";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md text-center">
        <p className="text-6xl font-black tracking-tight text-primary">404</p>
        <h1 className="mt-3 text-xl font-extrabold text-foreground">
          পেজটি খুঁজে পাওয়া যায়নি / Page not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          লিংকটি ভুল বা প্রোডাক্ট/ক্যাটাগরিটি আর নেই। নিচের অপশনগুলো ব্যবহার করুন।
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            হোম / Home
          </Link>
          <Link
            to="/categories"
            className="rounded-full border px-5 py-2 text-sm font-bold hover:bg-muted"
          >
            ক্যাটাগরি / Categories
          </Link>
          <Link
            to="/search"
            search={{ q: "" }}
            className="rounded-full border px-5 py-2 text-sm font-bold hover:bg-muted"
          >
            সার্চ / Search
          </Link>
        </div>
      </div>
    </div>
  );
}


function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: ({ context }) => {
    // Prefetch (non-blocking) so the header CategoryBar/menu has data instantly
    // on the first navigation and is cached across route changes.
    void import("@/lib/live-catalog").then(({ liveCatalogQueryOptions }) =>
      context.queryClient.prefetchQuery(liveCatalogQueryOptions()),
    );
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Bazar BD" },
      { name: "description", content: "Bazar BD - Best Online Shopping Platform in Bangladesh. Shop mobiles, electronics, fashion, and home appliances." },
      { name: "author", content: "Bazar BD" },
      { property: "og:title", content: "Bazar BD" },
      { property: "og:description", content: "Bazar BD - Best Online Shopping Platform in Bangladesh. Shop mobiles, electronics, fashion, and home appliances." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@BazarBD" },
      { name: "twitter:title", content: "Bazar BD" },
      { name: "twitter:description", content: "Bazar BD - Best Online Shopping Platform in Bangladesh. Shop mobiles, electronics, fashion, and home appliances." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7add2e7d-10e5-4779-b11b-f68a86994746/id-preview-ea4b1e0e--9ba97df9-8409-4f69-a5d5-d9436227f3da.lovable.app-1782844526156.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7add2e7d-10e5-4779-b11b-f68a86994746/id-preview-ea4b1e0e--9ba97df9-8409-4f69-a5d5-d9436227f3da.lovable.app-1782844526156.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
    ],

  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const loc = useLocation();
  const logError = useServerFn(logClientError);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logError({
        data: {
          message: event.message,
          stack: event.error?.stack,
          url: window.location.href,
          context: { type: "uncaughtException", filename: event.filename },
        }
      }).catch(console.error);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      logError({
        data: {
          message: event.reason?.message || "Unhandled Promise Rejection",
          stack: event.reason?.stack,
          url: window.location.href,
          context: { type: "unhandledRejection", reason: event.reason },
        }
      }).catch(console.error);
    };


    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <RecentlyViewedProvider>
            <CartProvider>
              <WishlistProvider>
                <OrdersProvider>
                  <Outlet />
                  <AffiliateRefCapture />
                  <DropshipperRefCapture />

                  <Toaster position="top-center" richColors />
                  <AIChatbot />
                  <ThemeCustomizer />
                  
                </OrdersProvider>
              </WishlistProvider>
            </CartProvider>
          </RecentlyViewedProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
