import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type NavLink = { label: string; href: string; sort?: number };
export type FooterColumn = { title: string; links: { label: string; href: string }[] };
export type PaymentBadge = { label: string; bg: string; fg: string };

export type SiteSettings = {
  brand: { name: string; tagline: string; logo_url: string; favicon_url: string };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    header_bg: string;
    footer_bg: string;
    text_primary: string;
    checkout_bg: string;
    checkout_accent: string;
    order_confirm_bg: string;
    order_confirm_accent: string;
  };
  typography: {
    font_family: string;
    base_font_size: number;
    heading_font_size_multiplier: number;
  };
  header: {
    top_bar_enabled: boolean;
    top_bar_text: string;
    nav_links: NavLink[];
    show_search: boolean;
    show_wishlist: boolean;
    show_cart: boolean;
    show_account: boolean;
  };
  footer: {
    columns: FooterColumn[];
    payment_badges: PaymentBadge[];
    app_links: { app_store: string; google_play: string };
    contact: { email: string; phone: string; address: string };
    social: { facebook: string; instagram: string; youtube: string; twitter: string };
    copyright_text: string;
  };
  homepage: {
    hero_video_url?: string;
    section_order?: string[]; 
    promo_banners: { image_url: string; link: string; title?: string }[];
    featured_categories: string[]; 
    
    // Visibility per device
    visibility?: Record<string, { mobile: boolean; tablet: boolean; desktop: boolean }>;
    
    // Per-section customization (labels, count, sort order, 'more' behavior)
    section_config?: Record<string, {
      label_en?: string;
      label_bn?: string;
      count?: number;
      more_behavior?: 'modal' | 'page';
      sort_order?: 'popular' | 'newest' | 'price_asc' | 'price_desc';
    }>;
    
    show_best_sellers: boolean;
    best_seller_ids?: string[]; 
    
    show_viral_products: boolean;
    viral_product_ids?: string[]; 
    
    show_promo_cards: boolean;
    promo_card_ids?: string[]; 

    show_flash_sale: boolean;
    flash_sale?: {
      start_time: string;
      end_time: string;
      show_timer: boolean;
      badge_text: string;
      badge_color: string;
      product_ids: string[];
      auto_toggle?: boolean;
    };
    
    show_all_products?: boolean;
    
    show_promotions_strip: boolean;
    
    show_videos: boolean;
    videos_config?: {
      layout: 'grid' | 'carousel';
      aspect_ratio: '16:9' | '9:16' | '1:1';
      autoplay: boolean;
      show_thumbnail: boolean;
      custom_thumbnails?: Record<string, string>; // video_id -> thumbnail_url
      stats?: {
        views: number;
        plays: number;
        avg_watch_time: number;
      };
    };
    
    marketing_ads: { 
      id: string;
      image_url: string; 
      link: string; 
      position: 'top' | 'middle' | 'bottom';
      clicks?: { date: string; count: number }[]; // For range selector and reports
    }[];
    vouchers?: { code: string; off: string; min: string }[];
    custom_ads?: {
      id: string;
      position_before_section: string; // ID of the section this ad appears BEFORE
      type: 'image' | 'video' | 'animation';
      content_url: string;
      link_url?: string;
      button_text?: string;
      height_px?: number;
      is_active: boolean;
      visibility: { mobile: boolean; tablet: boolean; desktop: boolean };
    }[];
  };
  presets?: Record<string, Partial<SiteSettings>>;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  brand: { name: "Bazar BD", tagline: "Bangladesh's premium online marketplace", logo_url: "", favicon_url: "" },
  colors: {
    primary: "#5200FF",
    secondary: "#FFD600",
    accent: "#FFD600",
    header_bg: "#ffffff",
    footer_bg: "#f8fafc",
    text_primary: "#1e293b",
    checkout_bg: "#ffffff",
    checkout_accent: "#5200FF",
    order_confirm_bg: "#f0fdf4",
    order_confirm_accent: "#16a34a",
  },
  typography: {
    font_family: "Inter, sans-serif",
    base_font_size: 16,
    heading_font_size_multiplier: 1.2,
  },
  header: {
    top_bar_enabled: true,
    top_bar_text: "",
    nav_links: [],
    show_search: true, show_wishlist: true, show_cart: true, show_account: true,
  },
  footer: {
    columns: [],
    payment_badges: [
      { label: "bKash", bg: "#E2136E", fg: "#ffffff" },
      { label: "Nagad", bg: "#EC1C24", fg: "#ffffff" },
      { label: "Rocket", bg: "#8B2C8B", fg: "#ffffff" },
      { label: "VISA", bg: "#1A1F71", fg: "#F7B600" },
      { label: "MasterCard", bg: "#ffffff", fg: "#EB001B" },
      { label: "COD", bg: "#16a34a", fg: "#ffffff" },
    ],
    app_links: { app_store: "", google_play: "" },
    contact: { email: "", phone: "", address: "" },
    social: { facebook: "", instagram: "", youtube: "", twitter: "" },
    copyright_text: "© 2026 Bazar Clone",
  },
  homepage: {
    section_order: ["hero", "services", "categories", "promotions_strip", "promo_cards", "videos", "flash_sale", "viral", "best_sellers", "recently_viewed", "vouchers", "for_you", "all_products"],
    promo_banners: [],
    featured_categories: [],
    show_best_sellers: true,
    show_viral_products: true,
    show_flash_sale: true,
    show_promotions_strip: true,
    show_promo_cards: true,
    show_videos: true,
    show_all_products: true,
    section_config: {
      best_sellers: { count: 10, sort_order: 'popular', more_behavior: 'page' },
      viral: { count: 12, sort_order: 'popular', more_behavior: 'page' },
      top_selling: { count: 12, sort_order: 'popular', more_behavior: 'page' },
      promo_cards: { count: 8, sort_order: 'popular', more_behavior: 'page' },
      flash_sale: { count: 6, sort_order: 'popular', more_behavior: 'page' },
      all_products: { count: 20, sort_order: 'popular', more_behavior: 'page', label_en: "All Products", label_bn: "সব প্রোডাক্ট" },
    },
    marketing_ads: [],
    vouchers: [
      { code: "BAZAR50", off: "৳50 OFF", min: "Min. ৳499" },
      { code: "FREE100", off: "৳100 OFF", min: "Min. ৳999" },
      { code: "MEGA200", off: "৳200 OFF", min: "Min. ৳1999" },
      { code: "MALL500", off: "৳500 OFF", min: "Min. ৳4999" },
    ],
  },
};

function merge(partial: Partial<SiteSettings> | null | undefined): SiteSettings {
  const p = partial ?? {};
  return {
    brand: { ...DEFAULT_SETTINGS.brand, ...(p.brand ?? {}) },
    colors: { ...DEFAULT_SETTINGS.colors, ...(p.colors ?? {}) },
    header: { ...DEFAULT_SETTINGS.header, ...(p.header ?? {}) },
    footer: { ...DEFAULT_SETTINGS.footer, ...(p.footer ?? {}) },
    homepage: { 
      ...DEFAULT_SETTINGS.homepage, 
      ...(p.homepage ?? {}),
      section_config: {
        ...DEFAULT_SETTINGS.homepage.section_config,
        ...(p.homepage?.section_config ?? {})
      },
      section_order: p.homepage?.section_order && p.homepage.section_order.length > 0 
        ? p.homepage.section_order 
        : DEFAULT_SETTINGS.homepage.section_order
    },
    typography: { ...DEFAULT_SETTINGS.typography, ...(p.typography ?? {}) },
  };
}

export const siteSettingsQuery = () =>
  queryOptions({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("site_settings_public")
        .select("settings")
        .eq("id", 1)
        .maybeSingle();
      if (error) return DEFAULT_SETTINGS;
      return merge(data?.settings as Partial<SiteSettings> | undefined);
    },
    staleTime: 60_000,
  });

export function useSiteSettings(): SiteSettings {
  const { data } = useQuery(siteSettingsQuery());
  return data ?? DEFAULT_SETTINGS;
}

export async function saveSiteSettings(settings: SiteSettings) {
  const { error } = await (supabase as any)
    .from("site_settings")
    .update({ settings })
    .eq("id", 1);
  if (error) throw error;
}
