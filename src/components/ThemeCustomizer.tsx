import { useEffect } from "react";
import { useSiteSettings } from "@/lib/site-settings";

export function ThemeCustomizer() {
  const settings = useSiteSettings();

  useEffect(() => {
    const root = document.documentElement;
    const { colors } = settings;

    if (colors) {
      // Primary
      root.style.setProperty("--primary", hexToHsl(colors.primary));
      root.style.setProperty("--primary-foreground", isDark(colors.primary) ? "0 0% 100%" : "222.2 47.4% 11.2%");
      
      // Header & Footer
      root.style.setProperty("--header-bg", colors.header_bg);
      root.style.setProperty("--footer-bg", colors.footer_bg);

      // Checkout & Order Confirm
      root.style.setProperty("--checkout-bg", colors.checkout_bg);
      root.style.setProperty("--checkout-accent", colors.checkout_accent);
      root.style.setProperty("--order-confirm-bg", colors.order_confirm_bg);
      root.style.setProperty("--order-confirm-accent", colors.order_confirm_accent);

      // Raw hexes
      root.style.setProperty("--color-brand-primary", colors.primary);
      root.style.setProperty("--color-brand-secondary", colors.secondary);
      root.style.setProperty("--color-brand-accent", colors.accent);
    }

    if (settings.typography) {
      root.style.setProperty("--font-family", settings.typography.font_family);
      root.style.setProperty("--base-font-size", `${settings.typography.base_font_size}px`);
      root.style.setProperty("--heading-multiplier", settings.typography.heading_font_size_multiplier.toString());
    }
  }, [settings.colors, settings.typography]);

  return null;
}

function hexToHsl(hex: string): string {
  // Simple hex to HSL string for shadcn variables (e.g. "221.2 83.2% 53.3%")
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function isDark(hex: string): boolean {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}
