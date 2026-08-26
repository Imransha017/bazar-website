import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, FolderTree, ChevronDown, ChevronRight, Edit2, X, Save } from "lucide-react";
import { slugify, type DBCategory } from "@/lib/admin-api";
import { PageHeader, Surface, PrimaryButton, TextInput, SelectInput, DangerButton, GhostButton } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sys-x7k9-control/categories")({
  component: CategoriesAdmin,
});

function CategoriesAdmin() {
  const [items, setItems] = useState<DBCategory[]>([]);
  const [name, setName] = useState("");
  const [parent, setParent] = useState("");
  const [subParent, setSubParent] = useState("");
  const [icon, setIcon] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [addMode, setAddMode] = useState<{ parentId: string | null } | null>(null);

  async function load() {
    const { data } = await supabase.from("categories").select("*").order("sort_order").order("name");
    setItems((data as DBCategory[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add(specificParentId?: string | null) {
    const val = name.trim();
    if (!val) return;
    const parentId = specificParentId !== undefined ? specificParentId : (subParent || parent || null);
    const { error } = await supabase.from("categories").insert({
      name: val,
      slug: slugify(val),
      icon: icon || null,
      parent_id: parentId,
      sort_order: items.length + 1
    });
    if (error) return toast.error(error.message);
    setName(""); setIcon(""); setSubParent(""); setAddMode(null);
    toast.success("Added");
    load();
  }

  async function del(id: string) {
    const descendants = collectDescendants(items, id);
    const msg = descendants.length
      ? `Delete this and ${descendants.length} nested item(s)?`
      : "Delete?";
    if (!confirm(msg)) return;
    const ids = [id, ...descendants];
    const { error } = await supabase.from("categories").delete().in("id", ids);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  }

  async function startEdit(item: DBCategory) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditIcon(item.icon || "");
  }

  async function saveEdit() {
    if (!editingId || !editName.trim()) return;
    const { error } = await supabase
      .from("categories")
      .update({
        name: editName.trim(),
        slug: slugify(editName),
        icon: editIcon || null,
      })
      .eq("id", editingId);
    
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setEditingId(null);
    load();
  }

  const roots = useMemo(() => items.filter((c) => !c.parent_id), [items]);
  const childrenOf = (id: string) => items.filter((c) => c.parent_id === id);
  const subsOfSelectedParent = parent ? childrenOf(parent) : [];

  return (
    <div className="space-y-5 pb-20">
      <PageHeader icon={FolderTree} title="Categories" subtitle={`${items.length} items · Category → Subcategory → Option`} />

      <Surface className="border-2 border-purple-100 bg-purple-50/20 shadow-none">
        <h2 className="mb-4 text-sm font-bold flex items-center gap-2 text-purple-900">
          <Plus className="h-4 w-4 bg-purple-600 text-white rounded-full p-0.5" /> 
          Quick Add Top-Level Category
        </h2>
        <div className="flex gap-2">
          <TextInput 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Category Name (e.g. Electronics)" 
            className="bg-white border-purple-200 focus:ring-purple-500"
            onKeyDown={(e) => e.key === 'Enter' && add(null)}
          />
          <TextInput 
            value={icon} 
            onChange={(e) => setIcon(e.target.value)} 
            placeholder="Emoji/Icon URL" 
            className="w-32 bg-white border-purple-200 focus:ring-purple-500"
          />
          <PrimaryButton onClick={() => add(null)} className="whitespace-nowrap bg-purple-600 hover:bg-purple-700">
            Create Category
          </PrimaryButton>
        </div>
      </Surface>

      <Surface>
        {roots.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No categories found</p>
        ) : (
          <ul className="space-y-4">
            {roots.map((r) => {
              const subs = childrenOf(r.id);
              const isOpen = expanded[r.id] ?? true;
              const isEditing = editingId === r.id;

              return (
                <li key={r.id} className="group">
                  <div className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3 transition-colors",
                    isEditing ? "bg-amber-50 border border-amber-200" : "bg-purple-50/60 hover:bg-purple-50"
                  )}>
                    <div className="flex flex-1 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpanded({ ...expanded, [r.id]: !isOpen })}
                        className="flex items-center gap-2"
                      >
                        {subs.length > 0 ? (
                          isOpen ? <ChevronDown className="h-5 w-5 text-purple-700" /> : <ChevronRight className="h-5 w-5 text-purple-700" />
                        ) : <div className="w-5" />}
                      </button>

                      {isEditing ? (
                        <div className="flex flex-1 items-center gap-2">
                          <TextInput value={editIcon} onChange={(e) => setEditIcon(e.target.value)} placeholder="Icon" className="w-20" />
                          <TextInput value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" className="flex-1" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {r.icon && (
                            <span className="text-xl">
                              {r.icon.startsWith("http") ? <img src={r.icon} className="h-6 w-6 object-contain" alt="" /> : r.icon}
                            </span>
                          )}
                          <span className="text-lg font-bold text-purple-950">{r.name}</span>
                          <span className="font-mono text-xs text-slate-400">/{r.slug}</span>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-purple-700 shadow-sm">{subs.length} subs</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <PrimaryButton onClick={saveEdit} className="px-2 py-1 h-8"><Save className="h-3.5 w-3.5 mr-1" /> Save</PrimaryButton>
                          <GhostButton onClick={() => setEditingId(null)} className="px-2 py-1 h-8"><X className="h-3.5 w-3.5" /></GhostButton>
                        </>
                      ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GhostButton 
                            onClick={() => { setAddMode({ parentId: r.id }); setName(""); setExpanded({ ...expanded, [r.id]: true }); }} 
                            className="px-2 py-1 h-8 text-purple-600 hover:bg-purple-100"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Sub
                          </GhostButton>
                          <GhostButton onClick={() => startEdit(r)} className="px-2 py-1 h-8"><Edit2 className="h-3.5 w-3.5" /></GhostButton>
                          <DangerButton onClick={() => del(r.id)} className="h-8 px-2"><Trash2 className="h-3.5 w-3.5" /></DangerButton>
                        </div>
                      )}
                    </div>
                  </div>

                  {addMode?.parentId === r.id && (
                    <div className="ml-10 mt-2 flex gap-2 items-center bg-white p-2 rounded-lg border border-purple-200 shadow-sm">
                      <TextInput 
                        autoFocus
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Subcategory Name..." 
                        className="flex-1 h-9"
                        onKeyDown={(e) => e.key === 'Enter' && add(r.id)}
                      />
                      <PrimaryButton onClick={() => add(r.id)} className="h-9 px-3 bg-purple-600 text-xs">Add Subcategory</PrimaryButton>
                      <GhostButton onClick={() => setAddMode(null)} className="h-9 px-2"><X className="h-4 w-4" /></GhostButton>
                    </div>
                  )}

                  {isOpen && subs.length > 0 && (
                    <ul className="ml-6 mt-2 space-y-2 border-l-2 border-purple-100 pl-4">
                      {subs.map((s) => {
                        const opts = childrenOf(s.id);
                        const subOpen = expanded[s.id] ?? true;
                        const isSubEditing = editingId === s.id;

                        return (
                          <li key={s.id} className="group/sub">
                            <div className={cn(
                              "flex items-center justify-between rounded-lg border px-3 py-2 transition-colors",
                              isSubEditing ? "bg-amber-50 border-amber-200" : "bg-white border-slate-100 hover:border-purple-200"
                            )}>
                              <div className="flex flex-1 items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setExpanded({ ...expanded, [s.id]: !subOpen })}
                                  className="flex items-center"
                                >
                                  {opts.length > 0 ? (
                                    subOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />
                                  ) : <div className="w-4" />}
                                </button>
                                
                                {isSubEditing ? (
                                  <TextInput value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Subcategory Name" />
                                ) : (
                                  <>
                                    <span className="font-medium text-slate-700">{s.name}</span>
                                    <span className="font-mono text-[10px] text-slate-400">/{s.slug}</span>
                                    {opts.length > 0 && (
                                      <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 rounded">{opts.length} options</span>
                                    )}
                                  </>
                                )}
                              </div>

                                <div className="flex items-center gap-1">
                                  {isSubEditing ? (
                                    <>
                                      <PrimaryButton onClick={saveEdit} className="p-1 h-7"><Save className="h-3 w-3" /></PrimaryButton>
                                      <GhostButton onClick={() => setEditingId(null)} className="p-1 h-7"><X className="h-3 w-3" /></GhostButton>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                      <GhostButton 
                                        onClick={() => { setAddMode({ parentId: s.id }); setName(""); setExpanded({ ...expanded, [s.id]: true }); }}
                                        className="h-7 px-2 text-blue-600 hover:bg-blue-50 py-0"
                                      >
                                        <Plus className="h-3 w-3 mr-1" /> Option
                                      </GhostButton>
                                      <GhostButton onClick={() => startEdit(s)} className="p-1 h-7 text-slate-400 hover:text-purple-600"><Edit2 className="h-3 w-3" /></GhostButton>
                                      <DangerButton onClick={() => del(s.id)} className="h-7 p-1"><Trash2 className="h-3 w-3" /></DangerButton>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {addMode?.parentId === s.id && (
                                <div className="ml-6 mt-2 flex gap-2 items-center bg-slate-50 p-1.5 rounded border border-slate-200">
                                  <TextInput 
                                    autoFocus
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    placeholder="Option Name (e.g. M, L, XL)..." 
                                    className="flex-1 h-8 text-xs"
                                    onKeyDown={(e) => e.key === 'Enter' && add(s.id)}
                                  />
                                  <PrimaryButton onClick={() => add(s.id)} className="h-8 px-2 bg-blue-600 text-[10px] uppercase font-bold">Add Option</PrimaryButton>
                                  <GhostButton onClick={() => setAddMode(null)} className="h-8 px-1.5"><X className="h-3.5 w-3.5" /></GhostButton>
                                </div>
                              )}

                            {subOpen && opts.length > 0 && (
                              <ul className="ml-4 mt-2 flex flex-wrap gap-2 border-l border-slate-100 pl-4">
                                {opts.map((o) => {
                                  const isOptEditing = editingId === o.id;
                                  return (
                                    <li key={o.id} className={cn(
                                      "flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors",
                                      isOptEditing ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200 hover:border-purple-200"
                                    )}>
                                      {isOptEditing ? (
                                        <div className="flex items-center gap-1">
                                          <TextInput value={editName} onChange={(e) => setEditName(e.target.value)} className="h-6 w-32 px-2 text-xs" />
                                          <button onClick={saveEdit} className="text-emerald-600 hover:text-emerald-700"><Save className="h-3 w-3" /></button>
                                          <button onClick={() => setEditingId(null)} className="text-rose-500 hover:text-rose-600"><X className="h-3 w-3" /></button>
                                        </div>
                                      ) : (
                                        <>
                                          <span className="text-slate-600 font-medium">{o.name}</span>
                                          <div className="flex items-center gap-1 border-l border-slate-200 ml-1 pl-1">
                                            <button onClick={() => startEdit(o)} className="text-slate-400 hover:text-purple-600 transition-colors">
                                              <Edit2 className="h-3 w-3" />
                                            </button>
                                            <button onClick={() => del(o.id)} className="text-slate-400 hover:text-rose-600 transition-colors">
                                              <Trash2 className="h-3 w-3" />
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Surface>
    </div>
  );
}

function collectDescendants(all: DBCategory[], parentId: string): string[] {
  const out: string[] = [];
  const stack = [parentId];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const c of all) {
      if (c.parent_id === cur) {
        out.push(c.id);
        stack.push(c.id);
      }
    }
  }
  return out;
}

