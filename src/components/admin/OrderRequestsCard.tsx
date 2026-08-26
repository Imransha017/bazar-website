import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Check, X, Eye, MessageCircle } from "lucide-react";
import { Surface, PrimaryButton, GhostButton, Badge } from "@/lib/admin-ui";
import { buildRequestStatusMessage, buildWhatsAppLinkForPhone, REQUEST_STATUS_LABELS } from "@/lib/whatsapp";

type Req = {
  id: string;
  type: string;
  reason: string | null;
  details: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
  customer_name: string | null;
  customer_phone: string;
};

export function OrderRequestsCard({ orderNumber }: { orderNumber: string }) {
  const [rows, setRows] = useState<Req[]>([]);
  const [note, setNote] = useState("");

  const load = () =>
    supabase
      .from("order_requests")
      .select("id,type,reason,details,status,admin_note,created_at,resolved_at,customer_name,customer_phone")
      .eq("order_number", orderNumber)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data as any) ?? []));

  useEffect(() => { load(); }, [orderNumber]);

  const notifyWhatsApp = (r: Req, status: string, adminNote: string) => {
    const msg = buildRequestStatusMessage({
      orderNumber,
      customerName: r.customer_name,
      type: r.type,
      status,
      note: adminNote,
      trackUrl: typeof window !== "undefined" ? `${window.location.origin}/orders` : null,
    });
    const link = buildWhatsAppLinkForPhone(r.customer_phone, msg);
    if (!link) return toast.error("কাস্টমারের ফোন নম্বর সঠিক নয় — WhatsApp পাঠানো যায়নি");
    window.open(link, "_blank", "noopener");
  };

  const setStatus = async (r: Req, status: "reviewed" | "approved" | "rejected") => {
    const adminNote = note;
    const { error } = await supabase
      .from("order_requests")
      .update({
        status,
        admin_note: adminNote || r.admin_note || null,
        resolved_at: status === "reviewed" ? null : new Date().toISOString(),
      } as any)
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    setNote("");
    toast.success(`স্ট্যাটাস আপডেট: ${REQUEST_STATUS_LABELS[status] ?? status}`);
    await load();
    notifyWhatsApp(r, status, adminNote);
  };

  if (rows.length === 0) return null;

  return (
    <Surface>
      <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <AlertTriangle className="h-4 w-4 text-amber-600" /> কাস্টমার অনুরোধ ({rows.length})
      </div>
      <div className="mt-3 space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <Badge tone={r.type === "cancel" ? "rose" : "sky"}>
                {r.type === "cancel" ? "বাতিলের অনুরোধ" : "পরিবর্তনের অনুরোধ"}
              </Badge>
              <Badge tone={r.status === "pending" ? "pink" : r.status === "approved" ? "sky" : "slate"}>
                {REQUEST_STATUS_LABELS[r.status] ?? r.status}
              </Badge>
            </div>
            {r.reason && <div className="mt-2 text-sm font-semibold text-slate-800">{r.reason}</div>}
            {r.details && <div className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{r.details}</div>}
            <div className="mt-1 text-[10px] text-slate-400">{new Date(r.created_at).toLocaleString()}</div>
            {r.admin_note && <div className="mt-1 text-[11px] text-slate-500">অ্যাডমিন নোট: {r.admin_note}</div>}
            <div className="mt-2 space-y-2">
              {r.status !== "approved" && r.status !== "rejected" && (
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="অ্যাডমিন নোট (ঐচ্ছিক)"
                  className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
                />
              )}
              <div className="flex flex-wrap gap-2">
                {r.status === "pending" && (
                  <GhostButton onClick={() => setStatus(r, "reviewed")}><Eye className="h-3 w-3" /> রিভিউ করা হয়েছে</GhostButton>
                )}
                {r.status !== "approved" && r.status !== "rejected" && (
                  <>
                    <PrimaryButton onClick={() => setStatus(r, "approved")}><Check className="h-3 w-3" /> অনুমোদন</PrimaryButton>
                    <GhostButton onClick={() => setStatus(r, "rejected")}><X className="h-3 w-3" /> বাতিল</GhostButton>
                  </>
                )}
                <GhostButton onClick={() => notifyWhatsApp(r, r.status, r.admin_note ?? "")}>
                  <MessageCircle className="h-3 w-3" /> WhatsApp জানান
                </GhostButton>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}
