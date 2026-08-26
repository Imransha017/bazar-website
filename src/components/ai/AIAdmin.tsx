import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useServerFn } from "@tanstack/react-start";
import {
  getAIConfig,
  updateAIConfig,
  getAIAnalytics,
  getAssistantSettings,
  setAssistantSettings,
  listMemoryFiles,
  uploadMemoryFile,
  updateMemoryFile,
  deleteMemoryFile,
  getMemoryFileContent,
  getAIModelSettings,
  setAIModelSettings,
  testAIModel,
} from "@/lib/ai-assistant.functions";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  BarChart3, 
  MessageSquare, 
  Settings, 
  HelpCircle, 
  ShieldAlert,
  Save,
  Loader2,
  TrendingUp,
  UserCheck,
  Search,
  ShoppingCart,
  X,
  Brain,
  Upload,
  Trash2,
  Power,
  Cpu,
  KeyRound,
  Zap,
  Phone,
  RefreshCw,
  Palette,
  Layout,
  Type
} from "lucide-react";
import { AssistantIcon } from "./AssistantIcon";
import { 
  BarChart, 

  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

export function AIAssistantAdmin() {
  const [activeTab, setActiveTab] = useState("analytics");
  const [configs, setConfigs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [togglingBot, setTogglingBot] = useState(false);

  const fetchSettings = useServerFn(getAssistantSettings);
  const saveSettings = useServerFn(setAssistantSettings);

  const fetchConfigs = useServerFn(getAIConfig);
  const fetchAnalytics = useServerFn(getAIAnalytics);
  const saveConfig = useServerFn(updateAIConfig);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cData, aData, sData] = await Promise.all([
        fetchConfigs(),
        fetchAnalytics(),
        fetchSettings()
      ]);
      setConfigs(cData || []);
      setAnalytics(aData || []);
      setEnabled((sData as any)?.enabled !== false);
    } catch (err) {
      toast.error("Failed to load AI data");
    } finally {
      setLoading(false);
    }
  };

  const toggleBot = async (next: boolean) => {
    setTogglingBot(true);
    try {
      await saveSettings({ data: { enabled: next, memory_only: true } });
      setEnabled(next);
      toast.success(next ? "AI Assistant চালু করা হয়েছে" : "AI Assistant বন্ধ করা হয়েছে");
    } catch {
      toast.error("সেটিংস আপডেট করা যায়নি");
    } finally {
      setTogglingBot(false);
    }
  };

  const getConfig = (id: string) => configs.find(c => c.id === id)?.content || {};

  const handleUpdateConfig = async (id: string, newContent: any) => {
    setSaving(true);
    try {
      await saveConfig({ data: { id, content: newContent } });
      toast.success(`${id.toUpperCase()} settings updated`);
      await loadData();
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // Analytics Processing
  const eventCounts = analytics.reduce((acc: any, curr: any) => {
    acc[curr.event_type] = (acc[curr.event_type] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    { label: "Total Messages", value: eventCounts.message_sent || 0, icon: MessageSquare, color: "text-blue-500" },
    { label: "Product Searches", value: eventCounts.product_search || 0, icon: Search, color: "text-purple-500" },
    { label: "Order Lookups", value: eventCounts.order_lookup || 0, icon: UserCheck, color: "text-green-500" },
    { label: "Fallback (AI Ignored)", value: eventCounts.fallback || 0, icon: ShieldAlert, color: "text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Assistant Management</h1>

        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-lg border px-4 py-2">
            <Power className={`size-4 ${enabled ? "text-green-500" : "text-muted-foreground"}`} />
            <div className="text-sm">
              <p className="font-medium">Assistant {enabled ? "ON" : "OFF"}</p>
              <p className="text-xs text-muted-foreground">চালু / বন্ধ করুন</p>
            </div>
            <Switch checked={enabled} onCheckedChange={toggleBot} disabled={togglingBot} />
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            Refresh Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {stats.map((s, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-full bg-muted p-3 ${s.color}`}>
                <s.icon className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 md:grid-cols-9 lg:grid-cols-9 h-auto gap-1">
          <TabsTrigger value="analytics" className="gap-2"><BarChart3 className="size-4" /> Analytics</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2"><Palette className="size-4" /> Appearance</TabsTrigger>
          <TabsTrigger value="model" className="gap-2"><Cpu className="size-4" /> AI Model</TabsTrigger>
          <TabsTrigger value="faq" className="gap-2"><HelpCircle className="size-4" /> FAQs</TabsTrigger>
          <TabsTrigger value="policies" className="gap-2"><Settings className="size-4" /> Policies</TabsTrigger>
          <TabsTrigger value="rules" className="gap-2"><ShieldAlert className="size-4" /> AI Rules</TabsTrigger>
          <TabsTrigger value="memory" className="gap-2"><Brain className="size-4" /> Memory</TabsTrigger>
          <TabsTrigger value="contact" className="gap-2"><Phone className="size-4" /> Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Assistant Appearance</CardTitle>
              <CardDescription>
                Assistant-এর নাম এবং আইকন ইমেজ সেট করুন।
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AppearanceSettings 
                data={getConfig('appearance')}
                onSave={(data) => handleUpdateConfig('appearance', data)}
                saving={saving}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="model" className="mt-6">
          <ModelSettings />
        </TabsContent>


        <TabsContent value="analytics" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Trend</CardTitle>
              <CardDescription>Event distribution over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(eventCounts).map(([name, value]) => ({ name, value }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Product & Service FAQs</CardTitle>
              <CardDescription>The AI uses these to answer common customer questions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FAQManager 
                initialData={getConfig('faq')} 
                onSave={(data) => handleUpdateConfig('faq', data)} 
                saving={saving}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery & Return Policies</CardTitle>
              <CardDescription>Define terms for shipping and returns mentioned by the AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <PolicyForm 
                data={getConfig('policies')}
                onSave={(data) => handleUpdateConfig('policies', data)}
                saving={saving}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Behavior Rules</CardTitle>
              <CardDescription>Control recommendation limits and fallback responses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RulesForm 
                data={getConfig('rules')}
                onSave={(data) => handleUpdateConfig('rules', data)}
                saving={saving}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="memory" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Memory (Knowledge Files)</CardTitle>
              <CardDescription>
                টেক্সট/ডকুমেন্ট ফাইল আপলোড করুন। Assistant শুধুমাত্র এই ফাইলগুলোর তথ্য ও আপনার প্রোডাক্ট ক্যাটালগ থেকেই উত্তর দেবে — বাইরের কোনো তথ্য দেবে না।
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemoryManager />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="contact" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin Contact Info</CardTitle>
              <CardDescription>
                অ্যাডমিন এর হোয়াটসঅ্যাপ নাম্বার, ইমু নাম্বার, মোবাইল নাম্বার, ফেসবুক এবং মেসেঞ্জার লিংক সেট করুন।
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactSettings 
                data={getConfig('contact')}
                onSave={(data) => handleUpdateConfig('contact', data)}
                saving={saving}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AppearanceSettings({ data, onSave, saving }: { data: any, onSave: (d: any) => void, saving: boolean }) {
  const defaultAppearance = {
    name: "Bazar AI Assistant",
    icon: "🤖",
    welcome: "হ্যালো! 👋\nআমি আপনার AI Shopping Assistant।\nআপনি যেকোনো প্রোডাক্ট সম্পর্কে জানতে পারেন, প্রোডাক্টের দাম/স্টক/বৈশিষ্ট্য জানতে পারেন অথবা অর্ডার করতে পারেন।\nআমি কীভাবে সাহায্য করতে পারি?",
    primaryColor: "#5200FF",
    accentColor: "#FFD600",
  };

  const [formData, setFormData] = useState({
    ...defaultAppearance,
    ...data
  });

  useEffect(() => {
    setFormData({
      ...defaultAppearance,
      ...data
    });
  }, [data]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    if (confirm("আপনি কি ডিফল্ট সেটিংস রিসেট করতে চান?")) {
      setFormData(defaultAppearance);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2"><Layout className="size-4" /> Branding</label>
            <div className="grid gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Assistant Name</label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Bazar AI Assistant"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Icon URL / Emoji</label>
                <div className="flex gap-2">
                  <Input 
                    value={formData.icon} 
                    onChange={(e) => handleChange('icon', e.target.value)}
                    placeholder="🤖 or https://example.com/icon.png"
                    className="flex-1"
                  />
                  <div className="size-10 shrink-0 flex items-center justify-center rounded-lg border bg-muted overflow-hidden">
                    <AssistantIcon icon={formData.icon} alt="Preview" fallbackClassName="text-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2"><Palette className="size-4" /> Theme Colors</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Primary (BG)</label>
                <div className="flex gap-2">
                  <input 
                    type="color"
                    value={formData.primaryColor || "#5200FF"}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="size-10 rounded cursor-pointer border-0 p-0"
                  />
                  <Input 
                    value={formData.primaryColor || "#5200FF"}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="flex-1 h-10"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Accent</label>
                <div className="flex gap-2">
                  <input 
                    type="color"
                    value={formData.accentColor || "#FFD600"}
                    onChange={(e) => handleChange('accentColor', e.target.value)}
                    className="size-10 rounded cursor-pointer border-0 p-0"
                  />
                  <Input 
                    value={formData.accentColor || "#FFD600"}
                    onChange={(e) => handleChange('accentColor', e.target.value)}
                    className="flex-1 h-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2"><Type className="size-4" /> Welcome Message</label>
            <Textarea 
              rows={6}
              value={formData.welcome} 
              onChange={(e) => handleChange('welcome', e.target.value)}
              placeholder="Welcome message for customers..."
            />
            <p className="text-[10px] text-muted-foreground">এই টেক্সটটি কাস্টমার চ্যাট ওপেন করলেই দেখতে পাবেন।</p>
          </div>

          <div className="rounded-xl border bg-slate-50 p-4 dark:bg-slate-900">
             <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Live Preview</label>
             <div className="overflow-hidden rounded-lg shadow-sm border bg-white dark:bg-card">
                <div 
                  className="p-3 text-white flex items-center gap-2"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  <div className="size-6 flex items-center justify-center rounded-full bg-white/20 text-xs overflow-hidden">
                    <AssistantIcon icon={formData.icon} alt="Preview" />
                  </div>
                  <span className="text-xs font-bold">{formData.name}</span>
                </div>
                <div className="p-4 space-y-2">
                  <div className="max-w-[80%] rounded-2xl bg-slate-100 p-2.5 text-[10px] dark:bg-slate-800">
                    {formData.welcome}
                  </div>
                  <div 
                    className="inline-block rounded-full px-3 py-1 text-[9px] font-bold"
                    style={{ backgroundColor: formData.accentColor, color: '#000' }}
                  >
                    Action Button
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-4 border-t">
        <Button 
          onClick={() => onSave(formData)} 
          disabled={saving}
          className="flex-1 md:flex-none"
        >
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          সেটিংস সংরক্ষণ করুন
        </Button>
        <Button 
          variant="outline" 
          onClick={handleReset}
          disabled={saving}
          className="flex-1 md:flex-none"
        >
          <RefreshCw className="mr-2 size-4" /> রিসেট করুন
        </Button>
      </div>
    </div>
  );
}

function ContactSettings({ data, onSave, saving }: { data: any, onSave: (d: any) => void, saving: boolean }) {
  const [formData, setFormData] = useState({
    whatsapp: "",
    imo: "",
    mobile: "",
    facebook: "",
    messenger: "",
    ...data
  });

  useEffect(() => {
    setFormData({
      whatsapp: "",
      imo: "",
      mobile: "",
      facebook: "",
      messenger: "",
      ...data
    });
  }, [data]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">WhatsApp Number (e.g. 88017...)</label>
          <Input 
            value={formData.whatsapp} 
            onChange={(e) => handleChange('whatsapp', e.target.value)}
            placeholder="8801759968476"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Imo Number</label>
          <Input 
            value={formData.imo} 
            onChange={(e) => handleChange('imo', e.target.value)}
            placeholder="01759968476"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Mobile Number</label>
          <Input 
            value={formData.mobile} 
            onChange={(e) => handleChange('mobile', e.target.value)}
            placeholder="01759968476"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Facebook Profile URL</label>
          <Input 
            value={formData.facebook} 
            onChange={(e) => handleChange('facebook', e.target.value)}
            placeholder="https://facebook.com/username"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Messenger Link</label>
          <Input 
            value={formData.messenger} 
            onChange={(e) => handleChange('messenger', e.target.value)}
            placeholder="https://m.me/username"
          />
        </div>
      </div>
      <Button 
        onClick={() => onSave(formData)} 
        disabled={saving}
        className="w-full md:w-auto"
      >
        {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
        সেটিংস সংরক্ষণ করুন
      </Button>
    </div>
  );
}

function MemoryManager() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const listFn = useServerFn(listMemoryFiles);
  const uploadFn = useServerFn(uploadMemoryFile);
  const updateFn = useServerFn(updateMemoryFile);
  const deleteFn = useServerFn(deleteMemoryFile);
  const contentFn = useServerFn(getMemoryFileContent);

  const load = async () => {
    setLoading(true);
    try {
      setFiles(((await listFn()) as any[]) || []);
    } catch {
      toast.error("Memory ফাইল লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    setUploading(true);
    try {
      for (const file of list) {
        const base64 = await toBase64(file);
        const res: any = await uploadFn({
          data: {
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            base64,
          },
        });
        if (res?.status === "failed") {
          toast.error(`${file.name}: টেক্সট এক্সট্র্যাকশন ব্যর্থ — ${res?.error || "অজানা কারণ"}`);
        } else if (res?.status === "partial") {
          toast.warning(`${file.name}: আংশিক এক্সট্র্যাকশন (${res.chars} অক্ষর) — ${res?.error || ""}`);
        } else {
          toast.success(`${file.name} আপলোড হয়েছে (${res.chars} অক্ষর)`);
        }
      }
      await load();
    } catch (err: any) {
      toast.error(err?.message || "আপলোড ব্যর্থ");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const startEdit = async (id: string) => {
    try {
      const res: any = await contentFn({ data: { id } });
      setEditText(res?.content || "");
      setEditingId(id);
    } catch {
      toast.error("কনটেন্ট লোড করা যায়নি");
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateFn({ data: { id: editingId, content: editText } });
      toast.success("সংরক্ষণ হয়েছে");
      setEditingId(null);
      await load();
    } catch {
      toast.error("সংরক্ষণ ব্যর্থ");
    }
  };

  const toggleActive = async (id: string, next: boolean) => {
    try {
      await updateFn({ data: { id, is_active: next } });
      await load();
    } catch {
      toast.error("আপডেট ব্যর্থ");
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteFn({ data: { id } });
      toast.success("ফাইল মুছে ফেলা হয়েছে");
      await load();
    } catch {
      toast.error("ডিলিট ব্যর্থ");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-4">
        <Upload className="size-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">ফাইল আপলোড করুন</p>
          <p className="text-xs text-muted-foreground">.txt, .md, .csv, .json, .pdf, .docx ইত্যাদি (সর্বোচ্চ 8MB)</p>
        </div>
        <Input type="file" multiple onChange={handleUpload} disabled={uploading} className="max-w-xs" />
        {uploading && <Loader2 className="size-4 animate-spin" />}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : files.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">কোনো মেমোরি ফাইল নেই।</p>
      ) : (
        <div className="space-y-3">
          {files.map((f) => (
            <div key={f.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{f.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(Number(f.size_bytes || 0) / 1024).toFixed(1)} KB · {f.chars} অক্ষর ·{" "}
                    {new Date(f.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      f.extraction_status === "failed"
                        ? "destructive"
                        : f.extraction_status === "partial"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {f.extraction_status === "failed"
                      ? "Extraction ব্যর্থ"
                      : f.extraction_status === "partial"
                        ? "আংশিক Extraction"
                        : "Extraction সফল"}
                  </Badge>
                  <Badge variant={f.is_active ? "default" : "secondary"}>{f.is_active ? "Active" : "Off"}</Badge>
                  <Switch checked={!!f.is_active} onCheckedChange={(v) => toggleActive(f.id, v)} />
                  <Button variant="outline" size="sm" onClick={() => startEdit(f.id)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(f.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {f.extraction_error && (
                <p
                  className={`mt-2 rounded-md px-3 py-2 text-xs ${
                    f.extraction_status === "failed"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  ⚠️ {f.extraction_error}
                </p>
              )}


              {editingId === f.id ? (
                <div className="mt-3 space-y-2">
                  <Textarea rows={10} value={editText} onChange={(e) => setEditText(e.target.value)} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit}>
                      <Save className="mr-2 size-4" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                f.preview && (
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">{f.preview}</p>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FAQManager({ initialData, onSave, saving }: { initialData: any, onSave: (data: any) => void, saving: boolean }) {
  const [faqs, setFaqs] = useState<any[]>(Array.isArray(initialData) ? initialData : []);

  const addFAQ = () => setFaqs([...faqs, { question: "", answer: "" }]);
  const removeFAQ = (idx: number) => setFaqs(faqs.filter((_, i) => i !== idx));
  const updateFAQ = (idx: number, field: string, val: string) => {
    const newFaqs = [...faqs];
    newFaqs[idx][field] = val;
    setFaqs(newFaqs);
  };

  return (
    <div className="space-y-4">
      {faqs.map((faq, idx) => (
        <div key={idx} className="flex gap-4 items-start border-b pb-4">
          <div className="flex-1 space-y-2">
            <Input 
              placeholder="Question" 
              value={faq.question} 
              onChange={(e) => updateFAQ(idx, 'question', e.target.value)} 
            />
            <Textarea 
              placeholder="Answer" 
              value={faq.answer} 
              onChange={(e) => updateFAQ(idx, 'answer', e.target.value)} 
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => removeFAQ(idx)} className="text-destructive">
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={addFAQ}>Add FAQ Row</Button>
        <Button onClick={() => onSave(faqs)} disabled={saving}>
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          Save FAQs
        </Button>
      </div>
    </div>
  );
}

function PolicyForm({ data, onSave, saving }: { data: any, onSave: (data: any) => void, saving: boolean }) {
  const [policies, setPolicies] = useState(data || { delivery: "", returns: "", shipping_cost: "" });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Delivery Information</label>
        <Textarea 
          placeholder="Detailed delivery policy..." 
          value={policies.delivery} 
          onChange={(e) => setPolicies({ ...policies, delivery: e.target.value })} 
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Return Policy</label>
        <Textarea 
          placeholder="Terms for returns and refunds..." 
          value={policies.returns} 
          onChange={(e) => setPolicies({ ...policies, returns: e.target.value })} 
        />
      </div>
      <Button onClick={() => onSave(policies)} disabled={saving}>
        {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
        Save Policies
      </Button>
    </div>
  );
}

function RulesForm({ data, onSave, saving }: { data: any, onSave: (data: any) => void, saving: boolean }) {
  const [rules, setRules] = useState(data || { product_recommendation_limit: 5, fallback_message: "" });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Product Recommendation Limit</label>
        <Input 
          type="number" 
          value={rules.product_recommendation_limit} 
          onChange={(e) => setRules({ ...rules, product_recommendation_limit: parseInt(e.target.value) })} 
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Global Fallback Message</label>
        <Textarea 
          placeholder="What AI says when it doesn't understand..." 
          value={rules.fallback_message} 
          onChange={(e) => setRules({ ...rules, fallback_message: e.target.value })} 
        />
      </div>
      <Button onClick={() => onSave(rules)} disabled={saving}>
        {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
        Save Rules
      </Button>
    </div>
  );
}

const MODEL_PRESETS = [
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (দ্রুত, ডিফল্ট)" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (সবচেয়ে শক্তিশালী)" },
  { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite (সবচেয়ে সস্তা)" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini (ব্যালান্সড)" },
  { value: "openai/gpt-5", label: "GPT-5 (উন্নত রিজনিং)" },
];

function ModelSettings() {
  const load = useServerFn(getAIModelSettings);
  const save = useServerFn(setAIModelSettings);
  const test = useServerFn(testAIModel);

  const [cfg, setCfg] = useState<any>(null);
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => { load().then(setCfg).catch(() => setCfg({})); }, []);

  if (!cfg) return <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin" /></div>;

  const custom = cfg.provider === "custom";

  const onSave = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res: any = await save({
        data: {
          provider: cfg.provider || "lovable",
          model: cfg.model || "google/gemini-2.5-flash",
          base_url: cfg.base_url || "",
          temperature: Number(cfg.temperature ?? 0.3),
          api_key: apiKey || "",
        },
      });
      setApiKey("");
      setCfg(await load());
      if (res?.test) setResult(res.test);
      if (res?.test && res.test.ok === false) {
        toast.error(`সেভ হয়েছে, কিন্তু মডেল কাজ করছে না: ${res.test.message}`);
      } else {
        toast.success("AI model সেটিংস সেভ ও যাচাই হয়েছে");
      }
    } catch (e: any) {
      toast.error(e?.message || "সেভ করা যায়নি");
    } finally { setBusy(false); }
  };


  const onClearKey = async () => {
    setBusy(true);
    try {
      await save({
        data: {
          provider: cfg.provider || "lovable",
          model: cfg.model,
          base_url: cfg.base_url || "",
          temperature: Number(cfg.temperature ?? 0.3),
          clear_api_key: true,
        },
      });
      setCfg(await load());
      toast.success("API key মুছে ফেলা হয়েছে");
    } finally { setBusy(false); }
  };

  const onTest = async () => {
    setTesting(true);
    setResult(null);
    try { setResult(await test()); } finally { setTesting(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Cpu className="size-5" /> AI Model &amp; API Key</CardTitle>
        <CardDescription>
          Bazar AI Assistant কোন মডেল ব্যবহার করবে তা এখান থেকে নিয়ন্ত্রণ করুন। ডিফল্টভাবে Lovable AI Gateway ব্যবহার হয় — আলাদা কোনো API key লাগে না।
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="font-medium">বর্তমান অবস্থা</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>• Provider: <b>{custom ? "নিজস্ব (OpenAI-compatible)" : "Lovable AI Gateway (বিল্ট-ইন)"}</b></li>
            <li>• Model: <b>{cfg.model}</b></li>
            <li>• Lovable API key: <b>{cfg.lovable_key_present ? "✅ সেট করা আছে" : "❌ নেই"}</b></li>
            {custom && <li>• নিজস্ব key: <b>{cfg.has_api_key ? cfg.api_key_masked : "সেট করা নেই"}</b></li>}
          </ul>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Provider</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={cfg.provider || "lovable"}
              onChange={(e) => setCfg({ ...cfg, provider: e.target.value })}
            >
              <option value="lovable">Lovable AI Gateway (সুপারিশকৃত — key লাগে না)</option>
              <option value="custom">নিজস্ব API (OpenAI-compatible)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Model</label>
            {custom ? (
              <>
                <Input
                  list="custom-model-presets"
                  value={cfg.model || ""}
                  onChange={(e) => setCfg({ ...cfg, model: e.target.value })}
                  placeholder="openai/gpt-4o-mini"
                />
                <datalist id="custom-model-presets">
                  <option value="openai/gpt-4o-mini" />
                  <option value="openai/gpt-4.1-mini" />
                  <option value="google/gemini-2.5-flash" />
                  <option value="anthropic/claude-3.5-haiku" />
                  <option value="deepseek/deepseek-chat" />
                </datalist>
                <p className="mt-1 text-xs text-muted-foreground">
                  অবশ্যই একটি <b>chat</b> মডেলের slug দিন। audio/image/TTS মডেল (যেমন <code>fish-audio/...</code>) দিলে অ্যাসিস্ট্যান্ট কাজ করবে না।
                </p>
              </>
            ) : (
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={cfg.model}
                onChange={(e) => setCfg({ ...cfg, model: e.target.value })}
              >
                {MODEL_PRESETS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            )}
          </div>
        </div>

        {custom && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Base URL</label>
              <Input
                value={cfg.base_url || ""}
                onChange={(e) => setCfg({ ...cfg, base_url: e.target.value })}
                placeholder="https://openrouter.ai/api/v1"
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-sm font-medium"><KeyRound className="size-3.5" /> API Key</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={cfg.has_api_key ? cfg.api_key_masked : "sk-..."}
                />
                {cfg.has_api_key && (
                  <Button variant="outline" onClick={onClearKey} disabled={busy}><Trash2 className="size-4" /></Button>
                )}
              </div>
              <p className="mt-1 text-xs">
                {cfg.has_api_key ? (
                  <span className="text-emerald-600">✅ Key সেভ করা আছে ({cfg.api_key_masked}) — ফাঁকা রাখলে অপরিবর্তিত থাকবে।</span>
                ) : (
                  <span className="text-muted-foreground">এখনো কোনো key সেভ করা নেই।</span>
                )}
              </p>
            </div>
          </div>
        )}


        <div>
          <label className="mb-1 block text-sm font-medium">Temperature ({Number(cfg.temperature ?? 0.3).toFixed(1)})</label>
          <input
            type="range" min={0} max={1} step={0.1}
            value={Number(cfg.temperature ?? 0.3)}
            onChange={(e) => setCfg({ ...cfg, temperature: Number(e.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">কম = নির্ভুল/তথ্যভিত্তিক, বেশি = সৃজনশীল। সুপারিশ: 0.3</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={onSave} disabled={busy}>
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} সেভ করুন
          </Button>
          <Button variant="outline" onClick={onTest} disabled={testing}>
            {testing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Zap className="mr-2 size-4" />} কানেকশন টেস্ট
          </Button>
          {result && (
            <div
              className={`w-full rounded-md border p-3 text-sm ${result.ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700" : "border-destructive/40 bg-destructive/10 text-destructive"}`}
            >
              {result.ok ? `✅ কাজ করছে — ${result.message}` : `❌ ${result.message}`}
            </div>
          )}

        </div>
      </CardContent>
    </Card>
  );
}
