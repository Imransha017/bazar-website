/** Server-only helper that verifies an AI model configuration actually answers. */
export async function probeModel(cfg: {
  provider?: string;
  model?: string;
  base_url?: string;
  api_key?: string;
}): Promise<{ ok: boolean; message: string }> {
  const customKey = String(cfg.api_key || "").trim();
  const useCustom = cfg.provider === "custom" && customKey.length > 0;
  if (cfg.provider === "custom" && !customKey) {
    return { ok: false, message: "নিজস্ব provider বেছেছেন কিন্তু কোনো API key সেভ করা নেই।" };
  }
  const apiKey = useCustom ? customKey : process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { ok: false, message: "কোনো API key পাওয়া যায়নি।" };
  const baseUrl = useCustom
    ? String(cfg.base_url || "https://api.openai.com/v1").replace(/\/+$/, "")
    : "https://ai.gateway.lovable.dev/v1";
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        ...(useCustom
          ? { Authorization: `Bearer ${apiKey}` }
          : { "Lovable-API-Key": String(apiKey) }),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.model || "google/gemini-2.5-flash",
        messages: [{ role: "user", content: "Reply with the single word: OK" }],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      let detail = t.slice(0, 300);
      try {
        const j = JSON.parse(t);
        detail = j?.error?.message || j?.message || detail;
      } catch {
        /* keep raw text */
      }
      const hint =
        res.status === 404
          ? " — মডেল আইডি ভুল বা এই key দিয়ে মডেলটি চালানো যাচ্ছে না। সঠিক chat model slug দিন (যেমন openai/gpt-4o-mini)।"
          : res.status === 401 || res.status === 403
            ? " — API key ভুল বা অনুমতি নেই।"
            : "";
      return { ok: false, message: `HTTP ${res.status}: ${detail}${hint}` };
    }
    const json: any = await res.json();
    const content = json?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return {
        ok: false,
        message: "মডেল কোনো টেক্সট উত্তর দেয়নি — এটি সম্ভবত chat model নয় (যেমন audio/image মডেল)।",
      };
    }
    return { ok: true, message: content };
  } catch (e: any) {
    return { ok: false, message: e?.message || "Request failed" };
  }
}
