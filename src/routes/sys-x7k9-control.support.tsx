import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageSquare, Plus, Search, Clock, CheckCircle, AlertCircle, Send, User, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Surface, PrimaryButton, GhostButton, TextInput, SelectInput, Badge, Modal } from "@/lib/admin-ui";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/sys-x7k9-control/support")({
  component: AdminSupport,
});

type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
  user?: { email: string };
};

type Message = {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_admin_reply: boolean | null;
  created_at: string | null;
};

function AdminSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("support_tickets")
      .select("*, user:profiles(email)")
      .order("created_at", { ascending: false });
    setTickets((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const loadMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);
  };

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
      const sub = supabase
        .channel(`ticket-${selectedTicket.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${selectedTicket.id}` }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        })
        .subscribe();
      return () => { supabase.removeChannel(sub); };
    }
  }, [selectedTicket]);

  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("support_messages").insert({
      ticket_id: selectedTicket.id,
      sender_id: user.id,
      message: newMessage.trim(),
      is_admin_reply: true,
    });
    if (error) toast.error(error.message);
    else setNewMessage("");
    setSending(false);
  };

  const updateStatus = async (status: string) => {
    if (!selectedTicket) return;
    const { error } = await supabase
      .from("support_tickets")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", selectedTicket.id);
    if (error) toast.error(error.message);
    else {
      setSelectedTicket({ ...selectedTicket, status });
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status } : t));
      toast.success("Status updated");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MessageSquare}
        title="Support Center"
        subtitle="Manage user support requests and inquiries"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Surface className="p-0 overflow-hidden">
            <div className="bg-slate-50 p-3 border-b">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Tickets</h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-400">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">No tickets found</div>
              ) : (
                tickets.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`w-full text-left p-4 hover:bg-purple-50 transition-colors ${selectedTicket?.id === t.id ? 'bg-purple-50 border-r-4 border-r-purple-600' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-mono text-slate-400">#{t.id.slice(0, 8)}</span>
                      <Badge tone={t.status === 'open' ? 'sky' : t.status === 'in-progress' ? 'indigo' : 'slate'} className="text-[9px]">
                        {t.status}
                      </Badge>
                    </div>
                    <div className="text-sm font-bold text-slate-900 truncate">{t.subject}</div>
                    <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                      <span>{t.user?.email || "User"}</span>
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Surface>
        </div>

        <div className="md:col-span-2">
          {selectedTicket ? (
            <Surface className="flex flex-col h-[600px] p-0 overflow-hidden relative">
              <div className="p-4 border-b bg-white flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-black text-slate-900 leading-none">{selectedTicket.subject}</h3>
                    <Badge tone={selectedTicket.priority === 'high' ? 'rose' : selectedTicket.priority === 'medium' ? 'indigo' : 'slate'} className="text-[9px] uppercase">
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-2">
                    <span>Category: {selectedTicket.category}</span>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1 text-rose-600">
                      <Clock className="h-3 w-3" />
                      SLA: {new Date(new Date(selectedTicket.created_at).getTime() + (selectedTicket.priority === 'high' ? 4 : selectedTicket.priority === 'medium' ? 12 : 24) * 60 * 60 * 1000).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => updateStatus(e.target.value)}
                    className="text-xs rounded border border-slate-200 px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-purple-500/20 font-bold"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.is_admin_reply ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${m.is_admin_reply ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'}`}>
                      <div className="text-sm">{m.message}</div>
                      <div className={`text-[9px] mt-1 ${m.is_admin_reply ? 'text-purple-100' : 'text-slate-400'}`}>
                        {m.created_at ? new Date(m.created_at).toLocaleString() : 'Just now'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <TextInput
                    placeholder="Type your reply..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1"
                  />
                  <PrimaryButton
                    disabled={sending || !newMessage.trim()}
                    onClick={sendMessage}
                    className="h-10 w-10 p-0 flex items-center justify-center rounded-lg"
                  >
                    <Send className="h-4 w-4" />
                  </PrimaryButton>
                </div>
              </div>
            </Surface>
          ) : (
            <Surface className="h-[600px] flex flex-col items-center justify-center text-slate-400 border-dashed">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm font-bold">Select a ticket to start chatting</p>
            </Surface>
          )}
        </div>
      </div>
    </div>
  );
}
