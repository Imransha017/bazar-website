import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageSquare, Plus, Send, Clock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dropshipping/support")({
  component: DropshipperSupport,
});

type Ticket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  created_at: string | null;
  updated_at: string | null;
};

type Message = {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_admin_reply: boolean | null;
  created_at: string | null;
};

function DropshipperSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", category: "general", priority: "medium" });
  const [loading, setLoading] = useState(true);

  const loadTickets = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTickets(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadTickets();
  }, [user]);

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

  const createTicket = async () => {
    if (!user || !newTicket.subject.trim()) return;
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        subject: newTicket.subject.trim(),
        category: newTicket.category,
        priority: newTicket.priority,
      })
      .select()
      .single();
    
    if (error) toast.error(error.message);
    else {
      toast.success("Ticket created");
      setIsCreating(false);
      setNewTicket({ subject: "", category: "general", priority: "medium" });
      loadTickets();
      setSelectedTicket(data);
    }
  };

  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim() || !user) return;
    const { error } = await supabase.from("support_messages").insert({
      ticket_id: selectedTicket.id,
      sender_id: user.id,
      message: newMessage.trim(),
      is_admin_reply: false,
    });
    if (error) toast.error(error.message);
    else setNewMessage("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Support Center</h1>
          <p className="text-sm text-slate-500">Need help? Open a ticket or chat with us.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" /> New Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="bg-slate-50 p-4 border-b">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">My Tickets</h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto divide-y">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">No tickets yet</div>
              ) : (
                tickets.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`w-full text-left p-4 hover:bg-[#FDF8E7]/50 transition-colors ${selectedTicket?.id === t.id ? 'bg-[#FDF8E7] border-r-4 border-r-primary' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-mono text-slate-400">#{t.id.slice(0, 8)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        t.status === 'open' ? 'bg-sky-100 text-sky-700' : 
                        t.status === 'in-progress' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 truncate">{t.subject}</div>
                    <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                      <span>{t.category}</span>
                      <span>{t.created_at ? new Date(t.created_at).toLocaleDateString() : ""}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          {selectedTicket ? (
            <div className="bg-white rounded-2xl border shadow-sm flex flex-col h-[600px] overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-none">{selectedTicket.subject}</h3>
                  <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">
                    Status: {selectedTicket.status} | Updated: {selectedTicket.updated_at ? new Date(selectedTicket.updated_at).toLocaleString() : ""}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.is_admin_reply ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
                      m.is_admin_reply ? 'bg-white text-slate-900 border border-slate-200 rounded-tl-none' : 'bg-primary text-white rounded-tr-none'
                    }`}>
                      <div className="text-sm">{m.message}</div>
                      <div className={`text-[9px] mt-1 ${m.is_admin_reply ? 'text-slate-400' : 'text-white/70'}`}>
                        {m.created_at ? new Date(m.created_at).toLocaleString() : 'Just now'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t">
                {selectedTicket.status === 'closed' ? (
                  <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest py-2">This ticket is closed</p>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1 rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-primary text-white h-10 w-10 flex items-center justify-center rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed h-[600px] flex flex-col items-center justify-center text-slate-400">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm font-bold">Select a ticket or create a new one</p>
            </div>
          )}
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-black text-slate-900 mb-4">Open New Ticket</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black uppercase text-slate-500 mb-1 block">Subject</label>
                  <input
                    type="text"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    className="w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Briefly describe your issue"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase text-slate-500 mb-1 block">Category</label>
                    <select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                      className="w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                    >
                      <option value="order">Order Issue</option>
                      <option value="payment">Payment/Payout</option>
                      <option value="technical">Technical Error</option>
                      <option value="account">Account Settings</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase text-slate-500 mb-1 block">Priority</label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                      className="w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 flex gap-3">
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createTicket}
                className="flex-1 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Open Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
