import { useEffect, useState } from "react";

export function isImageIcon(value?: string) {
  const v = (value || "").trim();
  if (!v) return false;
  if (/^(https?:)?\/\//i.test(v)) return true;
  if (/^(data:image|blob:)/i.test(v)) return true;
  if (v.startsWith("/")) return true;
  // bare domain style: example.com/icon.png, www.site.com/a.jpg
  if (/^[\w-]+(\.[\w-]+)+\//.test(v)) return true;
  if (/\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(\?.*)?$/i.test(v)) return true;
  return false;
}

export function normalizeIconSrc(value?: string) {
  const v = (value || "").trim();
  if (v.startsWith("//")) return `https:${v}`;
  if (/^[\w-]+(\.[\w-]+)+\//.test(v)) return `https://${v}`;
  return v;
}

export function AssistantIcon({
  icon,
  alt = "Assistant",
  className = "size-full object-cover",
  fallbackClassName,
}: {
  icon?: string;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const value = (icon || "").trim();
  const [failed, setFailed] = useState(false);
  const [resolved, setResolved] = useState<string | null>(null);

  useEffect(() => {
    setFailed(false);
    setResolved(null);
  }, [value]);

  // If the URL is not a direct image file (e.g. a share/page link),
  // resolve it server-side to its underlying image (og:image).
  useEffect(() => {
    let cancelled = false;
    const src = normalizeIconSrc(value);
    if (!isImageIcon(value) || !/^https?:\/\//i.test(src)) return;
    if (/\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(\?.*)?$/i.test(src)) return;

    (async () => {
      try {
        const { resolveIconImage } = await import("@/lib/icon-resolve.functions");
        const out = await resolveIconImage({ data: { url: src } });
        if (!cancelled && out?.url) {
          setResolved(out.url);
          setFailed(false);
        }
      } catch {
        /* keep direct src */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [value]);

  if (isImageIcon(value) && !failed) {
    return (
      <img
        src={resolved || normalizeIconSrc(value)}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  return <span className={fallbackClassName}>{failed || !value ? "🤖" : value}</span>;
}

