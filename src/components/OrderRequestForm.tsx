import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Send, CheckCircle2, Loader2 } from "lucide-react";

type Props = { orderNumber: string; phone: string; status: string };

const CANCEL_REASONS = [
  "ভুল করে অর্ডার করেছি",
  "অন্য জায়গা থেকে কিনে ফেলেছি",
  "দাম বেশি মনে হচ্ছে",
  "ডেলিভারিতে দেরি হচ্ছে",
  "অন্য কারণ",
];
const REVISION_REASONS = [
  "ঠিকানা পরিবর্তন করতে চাই",
  "ফোন নম্বর পরিবর্তন",
  "পরিমাণ (quantity) পরিবর্তন",
  "সাইজ / কালার পরিবর্তন",
  "অন্য পরিবর্তন",
];

export function OrderRequestForm({ orderNumber, phone, status }: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"cancel" | "revision">("cancel");
  const [reason, setReason] = useState(CANCEL_REASONS[0]!);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [existing, setExisting] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [justUpdated, setJustUpdated] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.rpc("list_order_requests", { _order_number: orderNumber, _phone: phone });
    const rows = ((data as any) ?? []) as any[];
    setExisting((prev) => {
      for (const r of rows) {
        const old = prev.find((p) => p.id === r.id);
        if (old && old.status !== r.status) {
          setJustUpdated(r.id);
          setTimeout(() => setJustUpdated((c: string | null) => (c === r.id ? null : c)), 8000);
        }
      }
      return rows;
    });
  };

  // Auto-refresh: poll while the page is visible + refresh on tab focus,
  // so status changes (pending → reviewed → approved/rejected) appear on their own.
  useEffect(() => {
    load();
    const tick = () => { if (document.visibilityState === "visible") load(); };
    const timer = window.setInterval(tick, 10000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [orderNumber, phone]);

  useEffect(() => {
    setReason(type === "cancel" ? CANCEL_REASONS[0]! : REVISION_REASONS[0]!);
  }, [type]);

  const locked = ["delivered", "cancelled"].includes(String(status).toLowerCase());
  const pending = existing.find((r) => r.status === "pending" || r.status === "reviewed");

  const submit = async () => {
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.rpc("submit_order_request", {
      _order_number: orderNumber,
      _phone: phone,
      _type: type,
      _reason: reason,
      _details: details || undefined,
    });
    setBusy(false);
    const res = data as any;
    if (err) return setError(err.message);
    if (!res?.ok) return setError(res?.error || "অনুরোধ পাঠানো যায়নি");
    setDetails("");
    setOpen(false);
    load();
  };

  return (
    <section className="rounded-lg border-2 border-amber-200 bg-white p-4 shadow-card print:hidden">
      <div className="mb-3 flex items-center gap-2 border-b border-amber-100 pb-2 text-sm font-bold uppercase tracking-wider text-amber-700">
        <AlertTriangle className="size-4" /> অর্ডার বাতিল / পরিবর্তনের অনুরোধ
      </div>

      {existing.length > 0 && (
        <div className="mb-3 space-y-2">
          {existing.map((r) => (
            <div key={r.id} className="rounded border border-amber-100 bg-amber-50/50 p-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold">{r.type === "cancel" ? "বাতিলের অনুরোধ" : "পরিবর্তনের অনুরোধ"}</span>
                <span className={`rounded-full px-2 py-0.5 font-semibold ${r.status === "pending" ? "bg-amber-200 text-amber-900" : r.status === "reviewed" ? "bg-sky-100 text-sky-700" : r.status === "approved" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                  {r.status === "pending" ? "অপেক্ষমাণ" : r.status === "reviewed" ? "রিভিউ করা হয়েছে" : r.status === "approved" ? "অনুমোদিত" : "বাতিল"}
                  {justUpdated === r.id && <span className="ml-1 animate-pulse">• আপডেট</span>}
                </span>
              </div>
              {r.reason && <div className="mt-1 text-muted-foreground">{r.reason}</div>}
              {r.admin_note && <div className="mt-1">অ্যাডমিন: {r.admin_note}</div>}
            </div>
          ))}
        </div>
      )}

      {locked ? (
        <p className="text-xs text-muted-foreground">এই অর্ডারটি {status} — এখন আর পরিবর্তন করা যাবে না।</p>
      ) : pending ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-success" /> আপনার অনুরোধটি জমা হয়েছে, আমরা শীঘ্রই যোগাযোগ করব।
        </p>
      ) : !open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg border-2 border-amber-400 px-4 py-2 text-sm font-bold text-amber-700 hover:bg-amber-50"
        >
          অর্ডার বাতিল / পরিবর্তনের অনুরোধ করুন
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["cancel", "revision"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-lg border-2 px-3 py-1.5 text-xs font-bold ${type === t ? "border-primary bg-primary/10 text-primary" : "border-muted text-muted-foreground"}`}
              >
                {t === "cancel" ? "বাতিল করতে চাই" : "পরিবর্তন করতে চাই"}
              </button>
            ))}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">কারণ</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border-2 border-muted px-3 py-2 text-sm"
            >
              {(type === "cancel" ? CANCEL_REASONS : REVISION_REASONS).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">বিস্তারিত (ঐচ্ছিক)</label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="যেমন: নতুন ঠিকানা, নতুন সাইজ ইত্যাদি লিখুন"
              className="w-full rounded-lg border-2 border-muted px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} অনুরোধ পাঠান
            </button>
            <button onClick={() => setOpen(false)} className="rounded-lg border-2 border-muted px-4 py-2 text-sm font-bold text-muted-foreground">
              বাতিল
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
