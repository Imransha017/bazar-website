import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Settings, Star, Info, Save, Truck } from "lucide-react";
import { PageHeader } from "@/lib/admin-ui";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/sys-x7k9-control/settings")({
  component: SiteSettings,
});

type TopVendorCriteria = {
  min_orders: number;
  min_rating: number;
  days_window: number;
};

type CourierConfig = {
  steadfast?: { api_key: string; secret_key: string; enabled: boolean };
  pathao?: { client_id: string; client_secret: string; merchant_id: string; store_id: string; enabled: boolean };
};

function SiteSettings() {
  const [criteria, setCriteria] = useState<TopVendorCriteria>({
    min_orders: 50,
    min_rating: 4.5,
    days_window: 30,
  });
  const [courierConfig, setCourierConfig] = useState<CourierConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      // Use any to bypass temporary type mismatch until generator runs
      const { data } = await (supabase.from("app_settings" as any) as any).select("*").eq("key", "top_vendor_criteria").maybeSingle();
      if (data) {
        setCriteria(data.value as TopVendorCriteria);
      }
      
      const { data: courierData } = await (supabase.from("app_settings" as any) as any).select("*").eq("key", "courier_config").maybeSingle();
      if (courierData) {
        setCourierConfig(courierData.value as CourierConfig);
      }
      
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase.from("app_settings" as any) as any).upsert({
      key: "top_vendor_criteria",
      value: criteria as any,
      updated_at: new Date().toISOString(),
    });

    const { error: courierError } = await (supabase.from("app_settings" as any) as any).upsert({
      key: "courier_config",
      value: courierConfig as any,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    if (error || courierError) toast.error(error?.message || courierError?.message);
    else toast.success("Settings saved successfully");
  };

  if (loading) return <div className="p-8 text-center text-sm text-slate-500">Loading settings...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <PageHeader icon={Settings} title="Site Settings" subtitle="Global configuration and automation rules" />
        <button 
          onClick={save} 
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card title="Top Vendor Badge Criteria" icon={Star} description="Set the thresholds for automatically awarding the Top Vendor badge to high-performing sellers.">
            <div className="space-y-4">
              <InputField 
                label="Minimum Orders" 
                description="Number of completed orders required within the window."
                value={criteria.min_orders} 
                type="number"
                onChange={v => setCriteria({ ...criteria, min_orders: Number(v) })} 
              />
              <InputField 
                label="Minimum Rating" 
                description="Average store rating required (e.g. 4.5)."
                value={criteria.min_rating} 
                type="number"
                step="0.1"
                onChange={v => setCriteria({ ...criteria, min_rating: Number(v) })} 
              />
              <InputField 
                label="Time Window (Days)" 
                description="The look-back period for order and rating calculation."
                value={criteria.days_window} 
                type="number"
                onChange={v => setCriteria({ ...criteria, days_window: Number(v) })} 
              />
            </div>
          </Card>
          
          <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div>
              <p className="font-bold">Automation Logic</p>
              <p className="mt-1 text-blue-800/80 leading-relaxed">
                When a vendor meets these criteria, the system grants the "Top Vendor" badge. 
                If their performance falls below these levels, the badge is automatically removed during the next sync.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card title="Courier Service Integration" icon={Truck} description="Configure API keys for Steadfast and Pathao courier services.">
            <div className="space-y-6">
              <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/30 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Steadfast Courier</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Enable</span>
                    <input 
                      type="checkbox" 
                      checked={courierConfig.steadfast?.enabled || false} 
                      onChange={e => setCourierConfig({
                        ...courierConfig,
                        steadfast: { ...(courierConfig.steadfast || { api_key: '', secret_key: '' }), enabled: e.target.checked }
                      })}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                  </label>
                </div>
                <div className="space-y-3">
                  <InputField 
                    label="API Key" 
                    value={courierConfig.steadfast?.api_key || ''} 
                    onChange={v => setCourierConfig({
                      ...courierConfig,
                      steadfast: { ...(courierConfig.steadfast || { secret_key: '', enabled: false }), api_key: v }
                    })} 
                  />
                  <InputField 
                    label="Secret Key" 
                    value={courierConfig.steadfast?.secret_key || ''} 
                    type="password"
                    onChange={v => setCourierConfig({
                      ...courierConfig,
                      steadfast: { ...(courierConfig.steadfast || { api_key: '', enabled: false }), secret_key: v }
                    })} 
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/30 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Pathao Courier</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Enable</span>
                    <input 
                      type="checkbox" 
                      checked={courierConfig.pathao?.enabled || false} 
                      onChange={e => setCourierConfig({
                        ...courierConfig,
                        pathao: { ...(courierConfig.pathao || { client_id: '', client_secret: '', merchant_id: '', store_id: '' }), enabled: e.target.checked }
                      })}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InputField 
                    label="Client ID" 
                    value={courierConfig.pathao?.client_id || ''} 
                    onChange={v => setCourierConfig({
                      ...courierConfig,
                      pathao: { ...(courierConfig.pathao || { client_secret: '', merchant_id: '', store_id: '', enabled: false }), client_id: v }
                    })} 
                  />
                  <InputField 
                    label="Client Secret" 
                    value={courierConfig.pathao?.client_secret || ''} 
                    type="password"
                    onChange={v => setCourierConfig({
                      ...courierConfig,
                      pathao: { ...(courierConfig.pathao || { client_id: '', merchant_id: '', store_id: '', enabled: false }), client_secret: v }
                    })} 
                  />
                  <InputField 
                    label="Merchant ID" 
                    value={courierConfig.pathao?.merchant_id || ''} 
                    onChange={v => setCourierConfig({
                      ...courierConfig,
                      pathao: { ...(courierConfig.pathao || { client_id: '', client_secret: '', store_id: '', enabled: false }), merchant_id: v }
                    })} 
                  />
                  <InputField 
                    label="Store ID" 
                    value={courierConfig.pathao?.store_id || ''} 
                    onChange={v => setCourierConfig({
                      ...courierConfig,
                      pathao: { ...(courierConfig.pathao || { client_id: '', client_secret: '', merchant_id: '', enabled: false }), store_id: v }
                    })} 
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card title="General Info" icon={Settings}>
            <div className="space-y-4 opacity-50 grayscale pointer-events-none">
              <InputField label="Store Name" value="Bazar BD" readOnly />
              <InputField label="Support Email" value="support@bazar-bd.com" readOnly />
              <InputField label="Currency Symbol" value="৳" readOnly />
            </div>
            <p className="mt-4 text-[10px] font-bold text-slate-400 italic text-center">More global settings will be available in a future update.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, description, children }: { title: string; icon: any; description?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b bg-slate-50/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <Icon className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-slate-900">{title}</h2>
            {description && <p className="text-[10px] font-medium text-slate-500 mt-0.5">{description}</p>}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", description, step, readOnly }: { label: string; value: any; onChange?: (v: string) => void; type?: string; description?: string; step?: string; readOnly?: boolean }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>
      </div>
      <input 
        type={type} 
        value={value} 
        step={step}
        readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)} 
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none transition-all"
      />
      {description && <p className="text-[10px] text-slate-400">{description}</p>}
    </div>
  );
}
