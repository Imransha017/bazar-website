import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ShoppingCart, Info, Truck, ClipboardList, Headset, Search, ArrowRight, History, ImagePlus, Loader2, Mic, MicOff, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/lib/cart';
import { askAssistant, getChatHistory, getOrCreateThread , getAssistantSettings, askAssistantWithImage } from '@/lib/ai-assistant.functions';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { AssistantIcon } from "./AssistantIcon";

type Message = {
  role: 'assistant' | 'user';
  content: string;
  buttons?: { label: string; action: string; icon?: any }[];
  products?: any[];
  whatsapp?: string;
  links?: { label: string; url: string; variant?: 'primary' | 'outline' | 'success' }[];
  actions?: { label: string; send: string }[];
};

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [enabled, setEnabled] = useState(true);
  const [appearance, setAppearance] = useState({ 
    name: "Bazar AI Assistant", 
    icon: "🤖",
    welcome: "হ্যালো! 👋\nআমি আপনার AI Shopping Assistant।\nআপনি যেকোনো প্রোডাক্ট সম্পর্কে জানতে পারেন, প্রোডাক্টের দাম/স্টক/বৈশিষ্ট্য জানতে পারেন অথবা অর্ডার করতে পারেন।\nআমি কীভাবে সাহায্য করতে পারি?",
    primaryColor: "#5200FF",
    accentColor: "#FFD600"
  });
  const [activeConfig, setActiveConfig] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showHelpBubble, setShowHelpBubble] = useState(false);
  const recognitionRef = useRef<any>(null);

  
  const scrollRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<HTMLDivElement>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const { add } = useCart();
  const { user } = useAuth();
  
  const assistantFn = useServerFn(askAssistant);
  const historyFn = useServerFn(getChatHistory);
  const threadFn = useServerFn(getOrCreateThread);
  const settingsFn = useServerFn(getAssistantSettings);
  const imageFn = useServerFn(askAssistantWithImage);
  const configFn = useServerFn(useServerFn(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("ai_assistant_configs")
      .select("*")
      .in("id", ["appearance"]);
    return data || [];
  }));

  useEffect(() => {
    settingsFn()
      .then((s: any) => setEnabled(s?.enabled !== false))
      .catch(() => setEnabled(true));
    
    // Fetch appearance settings
    const fetchAppearance = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase.from("ai_assistant_configs").select("content").eq("id", "appearance").maybeSingle();
        if (data?.content) {
          const content = data.content as any;
          setAppearance({
            name: content.name || "Bazar AI Assistant",
            icon: content.icon || "🤖",
            welcome: content.welcome || "হ্যালো! 👋\nআমি আপনার AI Shopping Assistant।\nআপনি যেকোনো প্রোডাক্ট সম্পর্কে জানতে পারেন, প্রোডাক্টের দাম/স্টক/বৈশিষ্ট্য জানতে পারেন অথবা অর্ডার করতে পারেন।\nআমি কীভাবে সাহায্য করতে পারি?",
            primaryColor: content.primaryColor || "#5200FF",
            accentColor: content.accentColor || "#FFD600"
          });
        }
      } catch (err) {
        console.error("Failed to load appearance:", err);
      }
    };
    fetchAppearance();

    // Show help bubble periodically
    const helpTimer = setInterval(() => {
      setShowHelpBubble(true);
      setTimeout(() => setShowHelpBubble(false), 5000);
    }, 45000);

    const initialTimer = setTimeout(() => {
      setShowHelpBubble(true);
      setTimeout(() => setShowHelpBubble(false), 5000);
    }, 5000);

    // Initialize Speech Recognition
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'bn-BD';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
        handleSend(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      clearInterval(helpTimer);
      clearTimeout(initialTimer);
    };
  }, []);


  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('আপনার ব্রাউজার ভয়েস সাপোর্ট করে না');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('টেক্সট কপি করা হয়েছে');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const welcomeMessage: Message = {
    role: 'assistant',
    content: appearance.welcome,
    buttons: [
      { label: "🔎 প্রোডাক্ট খুঁজুন", action: "search", icon: Search },
      { label: "📦 প্রোডাক্ট সম্পর্কে জানুন", action: "info", icon: Info },
      { label: "🛒 অর্ডার করতে চাই", action: "order", icon: ShoppingCart },
      { label: "🚚 ডেলিভারি সম্পর্কে জানুন", action: "delivery", icon: Truck },
      { label: "📋 আমার অর্ডার জানতে চাই", action: "track", icon: ClipboardList },
      { label: "💬 Admin-এর সাথে যোগাযোগ", action: "admin", icon: Headset },
    ]
  };

  // Initialize Thread & History
  useEffect(() => {
    const initChat = async () => {
      try {
        const tid = await threadFn({ data: { userId: user?.id } });
        setThreadId(tid);
        
        const history = await historyFn({ data: { threadId: tid } });
        if (history && history.length > 0) {
          setMessages(history.map((m: any) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
            products: m.metadata?.products || []
          })));
        } else {
          setMessages([welcomeMessage]);
        }
      } catch (err) {
        console.error("Chat init error:", err);
        setMessages([welcomeMessage]);
      }
    };

    if (isOpen && !threadId) {
      initChat();
    }
  }, [isOpen, user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await assistantFn({ 
        data: { 
          message: text, 
          threadId: threadId || undefined,
          sessionId,
          userId: user?.id
        } 
      });
      
      const assistantMsg: Message = {
        role: 'assistant',
        content: response.answer,
        products: (response as any).products || [],
        whatsapp: (response as any).whatsapp || undefined,
        links: (response as any).links || [],
        actions: (response as any).actions || [],
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "দুঃখিত, বর্তমানে আমার সিস্টেমে কিছু সমস্যা হচ্ছে। জরুরি প্রয়োজনে সরাসরি এডমিনের সাথে যোগাযোগ করুন।",
        links: [{ label: "যোগাযোগ করুন", url: "https://wa.me/8801759968476", variant: "success" }]
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read failed'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('decode failed'));
        img.onload = () => {
          const max = 1024;
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('no canvas'));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });

  const handleImageSend = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('অনুগ্রহ করে একটি ছবি নির্বাচন করুন');
      return;
    }
    setIsLoading(true);
    const note = inputValue.trim();
    setInputValue('');
    try {
      const dataUrl = await compressImage(file);
      setMessages(prev => [...prev, { role: 'user', content: `🖼️ ছবি পাঠানো হয়েছে${note ? ' — ' + note : ''}` }]);
      const response: any = await imageFn({
        data: { image: dataUrl, note: note || undefined, threadId: threadId || undefined, sessionId, userId: user?.id },
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.answer,
        products: response.products || [],
        whatsapp: response.whatsapp || undefined,
        links: response.links || [],
        actions: response.actions || [],
      }]);
    } catch {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'দুঃখিত, ছবিটি প্রসেস করা যাচ্ছে না। দয়া করে এডমিনের সাথে যোগাযোগ করুন।',
        links: [{ label: "যোগাযোগ করুন", url: "https://wa.me/8801759968476", variant: "success" }]
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product: any) => {
    add(product, 1);
    toast.success(`${product.name} কার্টে যোগ করা হয়েছে`);
  };

  const handleButtonAction = (action: string, label: string) => {
    handleSend(label);
  };

  if (!enabled) return null;

  return (
    <div ref={boundsRef} className="fixed inset-0 pointer-events-none z-[9999]">
      <motion.div 
        drag 
        dragConstraints={boundsRef}
        dragMomentum={false}
        dragElastic={0}
        className="absolute bottom-20 right-4 pointer-events-auto md:bottom-6 md:right-6"
      >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-3"
          >
            <Card className="flex h-[420px] w-[260px] flex-col overflow-hidden shadow-2xl md:h-[550px] md:w-[360px]">

              {/* Header */}
              <div className="flex items-center justify-between p-2 md:p-4 text-primary-foreground shadow-md" style={{ backgroundColor: appearance.primaryColor }}>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex size-7 md:size-10 items-center justify-center rounded-full bg-white/20 text-sm md:text-xl shadow-inner overflow-hidden shrink-0">
                    <AssistantIcon icon={appearance.icon} alt={appearance.name} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[11px] md:text-sm font-bold leading-none truncate">{appearance.name}</h3>
                    <p className="mt-0.5 text-[8px] md:text-[10px] opacity-90 flex items-center gap-1">
                      <span className="size-1 rounded-full bg-green-400 animate-pulse"></span>
                      <span className="truncate">{user ? "Personalized" : "Guest"}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5 md:gap-1 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                        setMessages([welcomeMessage]);
                        setThreadId(null);
                    }}
                    title="New Chat"
                    className="size-7 md:size-8 text-primary-foreground hover:bg-white/10"
                  >
                    <History className="size-3.5 md:size-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsOpen(false)} 
                    className="size-7 md:size-8 text-primary-foreground hover:bg-white/10"
                  >
                    <X className="size-4 md:size-5" />
                  </Button>
                </div>
              </div>

              {/* Chat Content */}
              <ScrollArea className="flex-1 bg-slate-50/50 p-4 dark:bg-slate-900/50">
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[92%] rounded-2xl px-2.5 py-1.5 text-[10px] md:text-[12px] shadow-sm ring-1 ${
                        msg.role === 'user' 
                          ? `text-white ring-white/20` 
                          : 'bg-white text-foreground ring-black/5 dark:bg-card dark:ring-white/10'
                      }`}
                      style={msg.role === 'user' ? { backgroundColor: appearance.primaryColor } : {}}
                      >
                        <div className="relative group/msg">
                          <div className="whitespace-pre-wrap leading-relaxed pr-6">{msg.content}</div>
                          <button
                            onClick={() => handleCopy(msg.content, idx)}
                            className={`absolute top-0 right-0 p-1 opacity-0 group-hover/msg:opacity-100 transition-opacity rounded hover:bg-black/5 dark:hover:bg-white/5 ${msg.role === 'user' ? 'text-white/70' : 'text-slate-400'}`}
                            title="Copy message"
                          >
                            {copiedId === idx ? <Check className="size-3" /> : <Copy className="size-3" />}
                          </button>
                        </div>

                        {msg.whatsapp && (
                          <a
                            href={msg.whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#128C7E]"
                          >
                            <Headset className="size-3.5" /> যোগাযোগ করুন
                          </a>
                        )}

                        {msg.links && msg.links.length > 0 && (
                          <div className="mt-3 grid grid-cols-1 gap-2">
                            {msg.links.map((lnk, lIdx) => {
                              const external = /^https?:/i.test(lnk.url);
                              const cls =
                                lnk.variant === 'outline'
                                  ? 'border border-primary/30 bg-transparent text-primary hover:bg-primary/10'
                                  : lnk.variant === 'success'
                                    ? `bg-green-600 text-white hover:bg-green-700`
                                    : 'text-white hover:opacity-90';
                              return (
                                <a
                                  key={lIdx}
                                  href={lnk.url}
                                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12px] font-bold transition-all ${cls}`}
                                  style={lnk.variant !== 'outline' && lnk.variant !== 'success' ? { backgroundColor: appearance.primaryColor } : {}}
                                >
                                  {lnk.label}
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {msg.actions && msg.actions.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {msg.actions.map((act, aIdx) => (
                              <button
                                key={aIdx}
                                disabled={isLoading}
                                onClick={() => handleSend(act.send)}
                                className="rounded-full border bg-slate-50 px-3 py-1.5 text-[11px] font-semibold transition-all disabled:opacity-50 dark:bg-slate-800"
                                style={{ color: appearance.primaryColor, borderColor: `${appearance.primaryColor}33` }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = appearance.primaryColor;
                                  e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '';
                                  e.currentTarget.style.color = appearance.primaryColor;
                                }}
                              >
                                {act.label}
                              </button>
                            ))}
                          </div>
                        )}

                        
                        {msg.buttons && (
                          <div className="mt-2 grid grid-cols-1 gap-1.5 md:gap-2">
                            {msg.buttons.map((btn, bIdx) => (
                              <button
                                key={bIdx}
                                onClick={() => handleButtonAction(btn.action, btn.label)}
                                className="flex items-center justify-between rounded-lg border bg-slate-50 px-2 py-1.5 text-[9.5px] font-semibold transition-all dark:bg-slate-800 md:px-3 md:py-2 md:text-[12px]"
                                style={{ color: appearance.primaryColor, borderColor: `${appearance.primaryColor}1a` }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = appearance.primaryColor;
                                  e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '';
                                  e.currentTarget.style.color = appearance.primaryColor;
                                }}
                              >
                                <span className="flex items-center gap-1.5 md:gap-2">
                                  {btn.icon && <btn.icon className="size-3 md:size-3.5 shrink-0" />}
                                  <span>{btn.label}</span>
                                </span>
                                <ArrowRight className="size-2.5 opacity-50 shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}

                        {msg.products && msg.products.length > 0 && (
                          <div className="mt-4 space-y-3">
                            {msg.products.map((p, pIdx) => (
                              <div key={pIdx} className="group relative overflow-hidden rounded-xl bg-white border border-border shadow-sm transition-all hover:shadow-md dark:bg-slate-800">
                                <div className="flex items-center gap-3 p-2">
                                  <div 
                                    className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted cursor-pointer relative flex items-center justify-center"
                                    onClick={() => window.location.href = p.link || `/product/${p.id}`}
                                  >
                                    {!p.image && <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400 text-[10px] text-center p-1">No Image</div>}
                                    <img 
                                      src={p.image || '/placeholder.svg'} 
                                      alt={p.name} 
                                      className={`size-full object-cover transition-transform group-hover:scale-110 ${!p.image ? 'opacity-0' : 'opacity-100'}`}
                                      loading="lazy"
                                      onLoad={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.parentElement?.querySelector('.loader-overlay')?.classList.add('hidden');
                                      }}
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/placeholder.svg';
                                        target.classList.add('opacity-50');
                                        target.parentElement?.querySelector('.loader-overlay')?.classList.add('hidden');
                                      }}
                                    />
                                    <div className="loader-overlay absolute inset-0 flex items-center justify-center bg-slate-100/50">
                                      <Loader2 className="size-4 animate-spin" style={{ color: `${appearance.primaryColor}4d` }} />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="truncate text-[12px] font-bold leading-tight text-foreground">{p.name}</p>
                                    <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                                      <span className="text-[14px] font-extrabold" style={{ color: appearance.primaryColor }}>৳{p.price.toLocaleString("en-BD")}</span>
                                      {p.original_price && p.original_price > p.price && (
                                        <span className="text-[10px] text-muted-foreground line-through opacity-70">৳{p.original_price.toLocaleString("en-BD")}</span>
                                      )}
                                      {p.discount_percent && (
                                        <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1 rounded dark:bg-green-900/30">-{p.discount_percent}%</span>
                                      )}
                                    </div>
                                    {p.description && (
                                      <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground italic">{p.description}</p>
                                    )}
                                    <div className="mt-2.5 flex gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="default"
                                        className="h-8 flex-1 text-[10px] font-bold rounded-lg shadow-sm hover:opacity-90 text-white" 
                                        style={{ backgroundColor: appearance.primaryColor }}
                                        onClick={() => handleAddToCart(p)}
                                      >
                                        🛒 কার্টে দিন
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                          style={{ borderColor: `${appearance.primaryColor}33`, color: appearance.primaryColor }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = `${appearance.primaryColor}0d`;
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '';
                                          }}
                                          onClick={() => {
                                            const link = p.slug ? `/p/${p.slug}` : (p.link || `/product/${p.id}`);
                                            window.location.href = link;
                                          }}
                                      >
                                        বিস্তারিত
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl px-4 py-3 shadow-sm ring-1 ring-black/5 dark:bg-card flex gap-1.5 items-center">
                        <span className="size-1.5 animate-bounce rounded-full" style={{ backgroundColor: appearance.primaryColor, opacity: 0.4 }}></span>
                        <span className="size-1.5 animate-bounce rounded-full [animation-delay:0.2s]" style={{ backgroundColor: appearance.primaryColor, opacity: 0.4 }}></span>
                        <span className="size-1.5 animate-bounce rounded-full [animation-delay:0.4s]" style={{ backgroundColor: appearance.primaryColor, opacity: 0.4 }}></span>
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} className="h-2" />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="bg-white border-t p-2 md:p-4 dark:bg-card">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }}
                  className="relative flex items-center gap-1.5 md:gap-2"
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (f) handleImageSend(f);
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    title="ছবি দিয়ে প্রোডাক্ট খুঁজুন"
                    disabled={isLoading}
                    onClick={() => fileRef.current?.click()}
                    className="size-9 md:size-11 shrink-0 rounded-lg md:rounded-xl"
                  >
                    <ImagePlus className="size-4 md:size-4" />
                  </Button>
                  <div className="relative flex-1 flex items-center gap-1.5 md:gap-2">
                    <div className="relative flex-1">
                      <Input 
                        placeholder={isListening ? "শুনছি..." : "প্রশ্ন করুন বা ছবি দিন"} 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className={`pr-9 h-9 md:h-11 md:pr-12 rounded-lg md:rounded-xl bg-slate-50 border-slate-200 text-[12px] md:text-sm px-2 md:px-3 focus:ring-primary/20 dark:bg-slate-900 ${isListening ? 'ring-2 ring-primary border-transparent' : ''}`}
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        disabled={isLoading || !inputValue.trim()}
                        className="absolute right-1 top-1 size-7 md:right-1.5 md:top-1.5 md:size-8 rounded-md md:rounded-lg shadow-sm"
                      >
                        <Send className="size-3.5 md:size-4" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant={isListening ? "default" : "outline"}
                      onClick={toggleListening}
                      disabled={isLoading}
                      className={`size-9 md:size-11 shrink-0 rounded-lg md:rounded-xl transition-all ${isListening ? 'animate-pulse' : ''}`}
                      style={isListening ? { backgroundColor: appearance.primaryColor } : {}}
                    >
                      {isListening ? <MicOff className="size-4 md:size-4" /> : <Mic className="size-4 md:size-4" />}
                    </Button>
                  </div>
                </form>
                <p className="mt-2 text-center text-[9px] text-muted-foreground opacity-70">
                  AI responses can be limited. Please verify product details.
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex size-9 md:size-14 items-center justify-center rounded-full text-white shadow-2xl transition-all duration-300 ${
            isOpen ? 'bg-destructive rotate-90' : ''
          }`}
          style={!isOpen ? { backgroundColor: appearance.primaryColor } : {}}
        >
          {isOpen ? <X className="size-4 md:size-7" /> : (
            <AssistantIcon
              icon={appearance.icon}
              alt={appearance.name}
              className="size-7 md:size-12 rounded-full object-cover"
              fallbackClassName="text-base md:text-3xl"
            />
          )}

        </motion.button>
        
        <AnimatePresence>
          {!isOpen && showHelpBubble && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              className="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-lg bg-black/80 px-2 py-1 text-[8px] font-bold text-white shadow-xl backdrop-blur-sm after:absolute after:right-4 after:top-full after:border-4 after:border-transparent after:border-t-black/80"
            >
              Need help? 👋
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      </motion.div>
    </div>
  );
}
