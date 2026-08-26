import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, Mail, Settings2, KeyRound, Lock, Unlock } from "lucide-react";
import { PageHeader, Surface, TextInput, SelectInput, PrimaryButton, GhostButton, Modal, Badge } from "@/lib/admin-ui";
import { adminGetUser, adminUpdateUserProfile, adminSetUserPassword } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/sys-x7k9-control/customers")({
  component: Customers,
});

type Profile = { id: string; full_name: string | null; phone: string | null; email?: string | null; created_at: string; is_locked?: boolean };

function Customers() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Profile | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, phone, created_at, is_locked")
      .order("created_at", { ascending: false })
      .limit(500);
    setRows((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (r.full_name ?? "").toLowerCase().includes(s) || (r.phone ?? "").includes(s);
  });

  return (
    <div className="space-y-5">
      <PageHeader icon={Users} title="Customers" subtitle={`${rows.length} registered customers`} />

      <Surface className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <TextInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or phone…"
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No customers found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-widest text-slate-400">
                <tr className="border-b border-slate-100">
                  <th className="py-2 text-left font-semibold">Name</th>
                  <th className="text-left font-semibold">Phone</th>
                  <th className="text-left font-semibold">Info</th>
                  <th className="text-left font-semibold">Joined</th>
                  <th className="text-right font-semibold">Manage</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-purple-50/30">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-purple-900 text-xs font-bold text-amber-300">
                          {(r.full_name ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{r.full_name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="text-slate-600">
                      {r.phone ? (
                        <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3 text-slate-400" /> {r.phone}</span>
                      ) : "—"}
                    </td>
                    <td>
                      {r.is_locked
                        ? <Badge tone="pink"><span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> Locked</span></Badge>
                        : <Badge tone="slate">Editable</Badge>}
                    </td>
                    <td className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="text-right">
                      <GhostButton onClick={() => setEditing(r)} className="inline-flex items-center gap-1">
                        <Settings2 className="h-3.5 w-3.5" /> Manage
                      </GhostButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>

      {editing && (
        <ManageCustomer
          userId={editing.id}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function ManageCustomer({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", date_of_birth: "", gender: "", is_locked: false });
  const [pwd, setPwd] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    adminGetUser({ data: { userId } })
      .then((res: any) => {
        const p = res.profile ?? {};
        setEmail(res.email ?? null);
        setForm({
          full_name: p.full_name ?? "",
          phone: p.phone ?? "",
          date_of_birth: p.date_of_birth ?? "",
          gender: p.gender ?? "",
          is_locked: Boolean(p.is_locked),
        });
        setLoaded(true);
      })
      .catch((e: any) => { toast.error(e?.message ?? "Failed to load"); onClose(); });
  }, [userId]);

  const saveProfile = async () => {
    setBusy(true);
    try {
      await adminUpdateUserProfile({ data: { userId, ...form } });
      toast.success("Customer information updated");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    if (pwd.length < 8) return toast.error("Password must be 8+ characters");
    setBusy(true);
    try {
      await adminSetUserPassword({ data: { userId, newPassword: pwd } });
      setPwd("");
      toast.success("Password changed");
    } catch (e: any) {
      toast.error(e?.message ?? "Password change failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-black text-purple-950">Manage Customer</h3>
      <p className="mb-4 text-xs text-slate-500">{email ?? userId}</p>

      {!loaded ? (
        <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
      ) : (
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Personal Information</p>
            <TextInput value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" />
            <TextInput value={form.phone} maxLength={11} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} placeholder="01XXXXXXXXX" />
            <TextInput type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            <SelectInput value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Gender…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </SelectInput>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_locked: !form.is_locked })}
              className="inline-flex items-center gap-2 rounded-lg border border-purple-900/10 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50"
            >
              {form.is_locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              {form.is_locked ? "Locked (customer cannot edit)" : "Unlocked (customer can edit once)"}
            </button>
            <PrimaryButton disabled={busy} onClick={saveProfile} className="w-full">
              {busy ? "Saving…" : "Save Information"}
            </PrimaryButton>
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-4">
            <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-slate-400">
              <KeyRound className="h-3.5 w-3.5" /> Change Password
            </p>
            <TextInput type="text" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="New password (8+ chars)" />
            <PrimaryButton disabled={busy} onClick={savePassword} className="w-full">
              {busy ? "Please wait…" : "Set New Password"}
            </PrimaryButton>
          </div>

          <GhostButton onClick={onClose} className="w-full">Close</GhostButton>
        </div>
      )}
    </Modal>
  );
}
