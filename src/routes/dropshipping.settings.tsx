import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getMyDropshipper, updateMyDropshipper, type Dropshipper } from "@/lib/dropshipper";
import { toast } from "sonner";
import { uploadAndGetUrl } from "@/lib/storage";
import { Image, Upload, Trash2, Store, Layout, User, Globe, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { verifyDomainDns } from "@/lib/marketing-pro.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/dropshipping/settings")({
  head: () => ({ meta: [{ title: "Settings — Dropshipping" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [ds, setDs] = useState<Dropshipper | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [method, setMethod] = useState("bkash");
  const [account, setAccount] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [fbPixel, setFbPixel] = useState("");
  const [gaId, setGaId] = useState("");
  const [domain, setDomain] = useState("");
  const [waOrder, setWaOrder] = useState(false);
  const [popups, setPopups] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [layoutStyle, setLayoutStyle] = useState("grid");
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "banner" | "profile" | null>(null);
  const verifyDns = useServerFn(verifyDomainDns);


  useEffect(() => {
    getMyDropshipper().then(d => {
      if (!d) return;
      setDs(d); setName(d.store_name); setBio(d.bio ?? ""); setPhone(d.phone);
      setWhatsapp(d.whatsapp ?? ""); setMethod(d.payout_method); setAccount(d.payout_number);
      setLogoUrl(d.logo_url); setBannerUrl(d.banner_url); setProfileImageUrl(d.profile_image_url);
      setFbPixel((d as any).facebook_pixel_id ?? "");
      setGaId((d as any).google_analytics_id ?? "");
      setDomain((d as any).custom_domain ?? "");
      setWaOrder(!!d.whatsapp_order_enabled);
      setPopups(!!d.real_time_popups_enabled);
      setPrimaryColor(d.theme_color_primary || "#3B82F6");
      setBgColor(d.theme_color_background || "#FFFFFF");
      setLayoutStyle(d.theme_layout_style || "grid");
    });

  }, []);

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner" | "profile") => {
    const file = e.target.files?.[0];
    if (!file || !ds) return;

    // Validation
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error("File size must be less than 2MB");
      return;
    }

    // Immediate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (type === "logo") setLogoUrl(result);
      else if (type === "banner") setBannerUrl(result);
      else setProfileImageUrl(result);
    };
    reader.readAsDataURL(file);

    setUploading(type);
    try {
      const ext = file.name.split(".").pop();
      const path = `${ds.id}/${type}_${Date.now()}.${ext}`;
      const { url } = await uploadAndGetUrl("public", path, file);
      if (type === "logo") setLogoUrl(url);
      else if (type === "banner") setBannerUrl(url);
      else setProfileImageUrl(url);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(null);
    }
  };

  const removeFile = (type: "logo" | "banner" | "profile") => {
    if (type === "logo") setLogoUrl(null);
    else if (type === "banner") setBannerUrl(null);
    else setProfileImageUrl(null);
  };

  if (!ds) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const save = async () => {
    setBusy(true);
    try {
      await updateMyDropshipper({ 
        store_name: name, bio, phone, whatsapp, 
        payout_method: method, payout_number: account,
        logo_url: logoUrl, banner_url: bannerUrl, profile_image_url: profileImageUrl,
        facebook_pixel_id: fbPixel || null,
        google_analytics_id: gaId || null,
        custom_domain: domain || null,
        whatsapp_order_enabled: waOrder,
        real_time_popups_enabled: popups,
        theme_color_primary: primaryColor,
        theme_color_background: bgColor,
        theme_layout_style: layoutStyle
      } as any);

      toast.success("Saved");
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const handleVerifyDomain = async () => {
    if (!domain) return;
    setVerifying(true);
    try {
      const res = await verifyDns({ data: { domain } });
      if (res.active) {
        toast.success("Domain verified and active!");
        getMyDropshipper().then(d => {
          if (d) setDs(d);
        });
      } else {
        toast.error("Verification failed. Please check your DNS settings.");
      }
    } catch (e: any) {
      toast.error(e.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold">
          <Layout className="size-4 text-primary" /> Branding & Appearance
        </h3>
        
        <div className="mb-6 grid gap-6 sm:grid-cols-3">
          {/* Profile Image Upload */}
          <div className="space-y-2">
            <span className="text-xs font-semibold">Profile Image</span>
            <div className="relative flex h-32 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition hover:bg-muted/50">
              {profileImageUrl ? (
                <>
                  <img src={profileImageUrl} alt="Profile" className="h-24 w-24 rounded-full object-cover shadow-md" />
                  <button 
                    onClick={() => removeFile("profile")}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-background p-3 shadow-sm">
                    <User className="size-6 text-muted-foreground" />
                  </div>
                  <label className="mt-2 cursor-pointer text-[10px] font-bold uppercase tracking-wider text-primary hover:underline">
                    {uploading === "profile" ? "Uploading..." : "Upload Profile"}
                    <input type="file" className="hidden" accept="image/*" onChange={e => uploadFile(e, "profile")} disabled={!!uploading} />
                  </label>
                </>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">Square image (200x200px)</p>
          </div>
          {/* Logo Upload */}
          <div className="space-y-2">
            <span className="text-xs font-semibold">Store Logo</span>
            <div className="relative flex h-32 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition hover:bg-muted/50">
              {logoUrl ? (
                <>
                  <img src={logoUrl} alt="Logo" className="h-24 w-24 rounded-full object-cover shadow-md" />
                  <button 
                    onClick={() => removeFile("logo")}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-background p-3 shadow-sm">
                    <Store className="size-6 text-muted-foreground" />
                  </div>
                  <label className="mt-2 cursor-pointer text-[10px] font-bold uppercase tracking-wider text-primary hover:underline">
                    {uploading === "logo" ? "Uploading..." : "Upload Logo"}
                    <input type="file" className="hidden" accept="image/*" onChange={e => uploadFile(e, "logo")} disabled={!!uploading} />
                  </label>
                </>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">Square image recommended (200x200px)</p>
          </div>

          {/* Banner Upload */}
          <div className="space-y-2">
            <span className="text-xs font-semibold">Store Banner</span>
            <div className="relative flex h-32 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition hover:bg-muted/50">
              {bannerUrl ? (
                <>
                  <img src={bannerUrl} alt="Banner" className="h-full w-full rounded-lg object-cover opacity-80" />
                  <button 
                    onClick={() => removeFile("banner")}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-background p-3 shadow-sm">
                    <Image className="size-6 text-muted-foreground" />
                  </div>
                  <label className="mt-2 cursor-pointer text-[10px] font-bold uppercase tracking-wider text-primary hover:underline">
                    {uploading === "banner" ? "Uploading..." : "Upload Banner"}
                    <input type="file" className="hidden" accept="image/*" onChange={e => uploadFile(e, "banner")} disabled={!!uploading} />
                  </label>
                </>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">Landscape image recommended (800x200px)</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold">Store settings</h3>
        <div className="grid gap-3">
          <Field label="Store name"><input value={name} onChange={e => setName(e.target.value)} className="input" /></Field>
          <Field label="Bio"><textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="input" placeholder="Tell customers about your store..." /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Phone"><input value={phone} onChange={e => setPhone(e.target.value)} className="input" /></Field>
            <Field label="WhatsApp"><input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="input" /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Payout method">
              <select value={method} onChange={e => setMethod(e.target.value)} className="input">
                <option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option><option value="bank">Bank</option>
              </select>
            </Field>
            <Field label="Account / number"><input value={account} onChange={e => setAccount(e.target.value)} className="input" /></Field>
          </div>
          
          <div className="mt-4 space-y-4 rounded-lg bg-primary/5 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Marketing & Tracking</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Facebook Pixel ID">
                <input value={fbPixel} onChange={e => setFbPixel(e.target.value)} className="input" placeholder="e.g. 123456789" />
              </Field>
              <Field label="Google Analytics ID">
                <input value={gaId} onChange={e => setGaId(e.target.value)} className="input" placeholder="e.g. G-XXXXXXX" />
              </Field>
            </div>
            <Field label="Custom Domain">
              <div className="flex gap-2">
                <input value={domain} onChange={e => setDomain(e.target.value)} className="input" placeholder="myshop.com" />
                <div className={`flex items-center rounded-lg px-3 text-[10px] font-bold uppercase ${ds.domain_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {ds.domain_status === 'active' ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <AlertCircle className="mr-1 h-3 w-3" />}
                  {ds.domain_status || 'Pending'}
                </div>
              </div>
              
              <div className="mt-2 space-y-2">
                <div className="rounded-lg border bg-white p-3 text-[11px] shadow-sm">
                  <div className="mb-1 font-bold text-slate-700">DNS Configuration</div>
                  <p className="text-muted-foreground">Point your domain's <span className="font-mono font-bold">A Record</span> to:</p>
                  <div className="mt-1 flex items-center justify-between rounded bg-muted/50 p-1.5 font-mono text-primary">
                    76.76.21.21
                    <button onClick={() => { navigator.clipboard.writeText("76.76.21.21"); toast.success("IP Copied"); }} className="text-xs hover:underline">Copy</button>
                  </div>
                  <p className="mt-2 italic opacity-70">Note: DNS changes can take up to 24 hours to propagate.</p>
                </div>
                
                <button 
                  onClick={handleVerifyDomain} 
                  disabled={verifying || !domain}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 py-2 text-xs font-bold text-primary transition-all hover:bg-primary/10 disabled:opacity-50"
                >
                  {verifying ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
                  Verify & Connect Domain
                </button>
              </div>
            </Field>

            <div className="mt-4 space-y-4 rounded-lg bg-green-50/50 p-4 border border-green-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-green-700">Public Store Features</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-medium">WhatsApp Order Button</span>
                  <input type="checkbox" checked={waOrder} onChange={e => setWaOrder(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-medium">Real-time Sales Popups</span>
                  <input type="checkbox" checked={popups} onChange={e => setPopups(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                </label>
              </div>
            </div>

            <div className="mt-4 space-y-4 rounded-lg bg-indigo-50/50 p-4 border border-indigo-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700">Custom Theme</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Primary Color">
                  <div className="flex gap-2">
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="h-9 w-12 rounded border p-1" />
                    <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="input" placeholder="#000000" />
                  </div>
                </Field>
                <Field label="Background Color">
                  <div className="flex gap-2">
                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="h-9 w-12 rounded border p-1" />
                    <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="input" placeholder="#FFFFFF" />
                  </div>
                </Field>
              </div>
              <Field label="Layout Style">
                <select value={layoutStyle} onChange={e => setLayoutStyle(e.target.value)} className="input">
                  <option value="grid">Grid (Recommended)</option>
                  <option value="list">List View</option>
                </select>
              </Field>
            </div>
          </div>

          <button 

            onClick={save} 
            disabled={busy || !!uploading} 
            className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save all changes"}
          </button>
          </div>
        </div>
      </div>

      {/* Live Preview Sticky Sidebar */}
      <div className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3 w-3" /> Live Store Preview
          </h4>
          <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl transition-all duration-300" 
               style={{ backgroundColor: bgColor }}>
            <div className="h-20 w-full bg-cover bg-center opacity-60" style={{ backgroundImage: bannerUrl ? `url(${bannerUrl})` : 'none', backgroundColor: primaryColor }} />
            <div className="px-4 pb-6 -mt-8">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full border-4 border-white bg-white shadow-md overflow-hidden mb-3">
                  {logoUrl ? <img src={logoUrl} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-muted flex items-center justify-center"><Store className="h-6 w-6 text-muted-foreground" /></div>}
                </div>
                <h5 className="font-black text-sm text-slate-900 leading-none">{name || "Your Store"}</h5>
                <p className="text-[9px] text-muted-foreground mt-1 line-clamp-1">{bio || "Store bio preview..."}</p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2">
                {[1, 2].map(i => (
                  <div key={i} className="rounded-xl border bg-white p-2 shadow-sm">
                    <div className="aspect-square rounded-lg bg-muted mb-2 overflow-hidden">
                      <div className="h-full w-full bg-slate-100 flex items-center justify-center opacity-40"><Image className="h-4 w-4" /></div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded mb-1" />
                    <div className="h-2 w-2/3 bg-slate-50 rounded mb-2" />
                    <div className="h-6 w-full rounded-lg" style={{ backgroundColor: primaryColor }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-slate-900 p-4 text-white text-[10px]">
            <p className="font-bold opacity-70 mb-1">Preview Note:</p>
            <p>This shows how your store elements will look with the current colors and layout. Save to apply globally.</p>
          </div>
        </div>
      </div>
    </div>
    <style dangerouslySetInnerHTML={{ __html: `.input{width:100%;border:1px solid hsl(var(--border));border-radius:0.5rem;padding:0.625rem 0.875rem;font-size:0.875rem;background:hsl(var(--background));transition:all 0.2s;}.input:focus{outline:none;border-color:hsl(var(--primary)/0.5);box-shadow:0 0 0 2px hsl(var(--primary)/0.1)}` }} />
  </div>
);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
