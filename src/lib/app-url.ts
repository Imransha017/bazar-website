/**
 * Canonical public URL of this deployment.
 *
 * Set VITE_APP_URL (e.g. https://shop.example.com) when self-hosting so that
 * generated feed / share links point at your own domain. Falls back to the
 * origin the app is currently served from, so nothing is hardcoded.
 */
const CONFIGURED = String(import.meta.env["VITE_APP_URL"] ?? "").replace(/\/+$/, "");

export function appUrl(path = ""): string {
  const base =
    CONFIGURED || (typeof window !== "undefined" ? window.location.origin : "");
  const suffix = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base}${suffix}`;
}
