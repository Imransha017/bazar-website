import { useI18n } from "@/lib/i18n";
import { useSiteSettings } from "@/lib/site-settings";
import { Facebook, Instagram, Youtube, Twitter, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  useI18n();
  const s = useSiteSettings();
  const columns = s.footer.columns.length ? s.footer.columns : [
    { title: "Customer Care", links: [{ label: "Help Center", href: "#" }, { label: "How to Buy", href: "#" }, { label: "Returns & Refunds", href: "#" }, { label: "Contact Us", href: "#" }] },
    { title: "Bazar", links: [{ label: "About", href: "#" }, { label: "Careers", href: "#" }, { label: "Blog", href: "#" }, { label: "Press", href: "#" }] },
  ];

  const socials: [string, any][] = [
    [s.footer.social.facebook, Facebook],
    [s.footer.social.instagram, Instagram],
    [s.footer.social.youtube, Youtube],
    [s.footer.social.twitter, Twitter],
  ];

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-none px-4 pb-6 pt-4">
        <div className="grid grid-cols-3 gap-x-2 gap-y-4 text-[10px] md:grid-cols-4 md:text-sm">
          {columns.slice(0, 2).map((col, i) => (
            <div key={i}>
              <h4 className="mb-2 font-bold whitespace-nowrap">{col.title}</h4>
              <ul className="space-y-1 text-muted-foreground">
                {col.links.map((l, j) => (
                  <li key={j}><a href={l.href} className="hover:text-foreground">{l.label}</a></li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="mb-2 font-bold whitespace-nowrap">Payment</h4>
            <div className="flex flex-wrap gap-1">
              {s.footer.payment_badges.map(({ label, bg, fg }) => (
                <span key={label} style={{ background: bg, color: fg }}
                  className="inline-flex h-5 min-w-[32px] items-center justify-center rounded border border-border px-1 text-[8px] font-extrabold italic tracking-tighter shadow-sm">
                  {label}
                </span>
              ))}
            </div>
          </div>

          {columns.length > 2 && columns.slice(2, 3).map((col, i) => (
            <div key={i} className="hidden md:block">
              <h4 className="mb-2 font-bold">{col.title}</h4>
              <ul className="space-y-1 text-muted-foreground">
                {col.links.map((l, j) => (
                  <li key={j}><a href={l.href} className="hover:text-foreground">{l.label}</a></li>
                ))}
              </ul>
            </div>
          ))}

          {(s.footer.contact.email || s.footer.contact.phone || s.footer.contact.address) && (
            <div className="hidden md:block">
              <h4 className="mb-2 font-bold">Contact</h4>
              <ul className="space-y-1 text-muted-foreground text-xs">
                {s.footer.contact.email && <li className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{s.footer.contact.email}</li>}
                {s.footer.contact.phone && <li className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{s.footer.contact.phone}</li>}
                {s.footer.contact.address && <li className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{s.footer.contact.address}</li>}
              </ul>
            </div>
          )}
        </div>

        {socials.some(([u]) => !!u) && (
          <div className="mt-4 flex gap-2">
            {socials.map(([url, Icon], i) => url ? (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground">
                <Icon className="h-4 w-4" />
              </a>
            ) : null)}
          </div>
        )}

        <p className="mt-6 border-t pt-4 text-center text-xs text-muted-foreground">
          {s.footer.copyright_text.replace("{year}", "2026")}
        </p>
      </div>
    </footer>
  );
}
