import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, Send } from "lucide-react";
import { Surface, PrimaryButton, GhostButton } from "@/lib/admin-ui";
import {
  DEFAULT_TEMPLATES, TEMPLATE_VARS, buildWhatsAppLink, renderTemplate, toWhatsAppNumber,
  type OrderLike,
} from "@/lib/whatsapp";

type Props = { order: OrderLike & { id: string }; statusJustChangedTo?: string | null };

export function OrderWhatsAppNotify({ order }: Props) {
  const [templates, setTemplates] = useState<Record<string, { message: string; is_active: boolean }>>({});
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from("whatsapp_templates").select("status,message,is_active").then(({ data }) => {
      const map: Record<string, { message: string; is_active: boolean }> = {};
      (data ?? []).forEach((t: any) => (map[t.status] = { message: t.message, is_active: t.is_active }));
      setTemplates(map);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const tpl = templates[order.status]?.message ?? DEFAULT_TEMPLATES[order.status] ?? DEFAULT_TEMPLATES["processing"]!;
    setText(renderTemplate(tpl, order));
  }, [loaded, order.status, order.tracking_number, order.courier_name]);

  const num = toWhatsAppNumber(order.customer_phone);
  const link = buildWhatsAppLink(order, text);

  const send = async () => {
    if (!link) return toast.error("গ্রাহকের ফোন নম্বর নেই");
    window.open(link, "_blank", "noopener");
    await supabase.rpc("log_order_event", {
      _order_id: order.id,
      _event_type: "whatsapp_notified",
      _description: `WhatsApp update sent for status "${order.status}"`,
      _metadata: { status: order.status, message: text } as any,
    });
    toast.success("WhatsApp খোলা হয়েছে — Send চাপুন");
  };

  return (
    <Surface>
      <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <MessageCircle className="h-4 w-4 text-green-600" /> WhatsApp আপডেট
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        স্ট্যাটাস বদলালে বার্তাটি স্বয়ংক্রিয়ভাবে তৈরি হয়। {num ? `গ্রাহক: +${num}` : "এই অর্ডারে ফোন নম্বর নেই"}
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        className="mt-2 w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
      />
      <div className="mt-1 text-[10px] text-slate-400">ভেরিয়েবল: {TEMPLATE_VARS.join(" ")}</div>
      <div className="mt-2 flex gap-2">
        <PrimaryButton onClick={send} disabled={!num}>
          <Send className="h-3 w-3" /> WhatsApp-এ পাঠান
        </PrimaryButton>
        <GhostButton onClick={() => { navigator.clipboard.writeText(text); toast.success("কপি হয়েছে"); }}>
          কপি
        </GhostButton>
      </div>
    </Surface>
  );
}
