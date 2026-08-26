import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, Save, AlertTriangle } from "lucide-react";
import { PageHeader, Surface, PrimaryButton, Badge } from "@/lib/admin-ui";
import { DEFAULT_TEMPLATES, TEMPLATE_VARS } from "@/lib/whatsapp";

export const Route = createFileRoute("/sys-x7k9-control/whatsapp")({
  component: WhatsAppTemplatesPage,
});

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

type Row = { status: string; message: string; is_active: boolean };

function WhatsAppTemplatesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from("whatsapp_templates").select("status,message,is_active");
    const map: Record<string, Row> = {};
    (data ?? []).forEach((r: any) => (map[r.status] = r));
    setRows(
      STATUSES.map((s) => map[s] ?? { status: s, message: DEFAULT_TEMPLATES[s] ?? "", is_active: true }),
    );
    const { data: reqs } = await supabase
      .from("order_requests")
      .select("id,order_number,type,reason,status,created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20);
    setRequests((reqs as any) ?? []);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("whatsapp_templates")
      .upsert(rows.map((r) => ({ ...r, updated_at: new Date().toISOString() })) as any);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("টেমপ্লেট সেভ হয়েছে");
  };

  const patch = (status: string, p: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.status === status ? { ...r, ...p } : r)));

  return (
    <div className="space-y-5">
      <PageHeader
        icon={MessageCircle}
        title="WhatsApp Notifications"
        subtitle="অর্ডার স্ট্যাটাস বদলালে গ্রাহককে পাঠানো বার্তার টেমপ্লেট"
        actions={<PrimaryButton onClick={save} disabled={saving}><Save className="h-3 w-3" /> {saving ? "সেভ হচ্ছে…" : "সেভ করুন"}</PrimaryButton>}
      />

      <Surface>
        <div className="text-xs text-slate-500">
          ব্যবহারযোগ্য ভেরিয়েবল: <span className="font-mono">{TEMPLATE_VARS.join("  ")}</span>
        </div>
      </Surface>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rows.map((r) => (
          <Surface key={r.status}>
            <div className="flex items-center justify-between">
              <Badge tone="sky">{r.status}</Badge>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={r.is_active}
                  onChange={(e) => patch(r.status, { is_active: e.target.checked })}
                />
                সক্রিয়
              </label>
            </div>
            <textarea
              rows={5}
              value={r.message}
              onChange={(e) => patch(r.status, { message: e.target.value })}
              className="mt-2 w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
            />
          </Surface>
        ))}
      </div>

      <Surface>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" /> অপেক্ষমাণ কাস্টমার অনুরোধ ({requests.length})
        </div>
        {requests.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">কোনো অপেক্ষমাণ অনুরোধ নেই।</p>
        ) : (
          <div className="mt-3 space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 px-3 py-2 text-xs">
                <span className="font-mono font-bold text-purple-800">{r.order_number}</span>
                <span>{r.type === "cancel" ? "বাতিলের অনুরোধ" : "পরিবর্তনের অনুরোধ"}</span>
                <span className="text-slate-500">{r.reason}</span>
                <span className="text-slate-400">{new Date(r.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Surface>
    </div>
  );
}
