import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({ url: z.string().min(1).max(2000) });

function isBlockedHost(host: string) {
  const h = host.toLowerCase();
  return (
    h === "localhost" ||
    h === "0.0.0.0" ||
    h.endsWith(".local") ||
    /^127\./.test(h) ||
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h)
  );
}

/**
 * Resolves an arbitrary URL to a directly renderable image URL.
 * If the URL already serves an image, it is returned as-is.
 * If it serves an HTML page, the og:image / twitter:image is extracted.
 */
export const resolveIconImage = createServerFn({ method: "GET" })
  .validator((data: unknown) => schema.parse(data))

  .handler(async ({ data }) => {
    let target: URL;
    try {
      target = new URL(data.url.trim());
    } catch {
      return { url: null as string | null };
    }
    if (!/^https?:$/.test(target.protocol) || isBlockedHost(target.hostname)) {
      return { url: null as string | null };
    }

    try {
      const res = await fetch(target.toString(), {
        redirect: "follow",
        headers: { "user-agent": "Mozilla/5.0 (compatible; IconResolver/1.0)" },
      });
      if (!res.ok) return { url: null as string | null };
      const type = res.headers.get("content-type") || "";
      if (type.startsWith("image/")) return { url: target.toString() };
      if (!type.includes("html")) return { url: null as string | null };

      const html = (await res.text()).slice(0, 300_000);
      const patterns = [
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
        /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
        /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
      ];
      for (const re of patterns) {
        const m = html.match(re);
        if (m?.[1]) {
          try {
            return { url: new URL(m[1], target).toString() };
          } catch {
            /* ignore */
          }
        }
      }
      return { url: null as string | null };
    } catch {
      return { url: null as string | null };
    }
  });
