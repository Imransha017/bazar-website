/**
 * Ensures the caller is an authenticated admin before allowing
 * AI memory management (upload / edit / delete).
 */
export async function assertAdmin(context: any) {
  const supabase = context?.supabase;
  const userId = context?.userId;
  if (!supabase || !userId) throw new Error("Unauthorized: sign in required");

  // Read the role row directly: the has_role() RPC has overloaded signatures
  // (text / app_role) which makes the PostgREST call ambiguous.
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !data) throw new Error("Forbidden: admin access required");
  return userId as string;
}


/** Best-effort plain-text extraction with status reporting. */
export function extractText(bytes: Uint8Array, fileName: string, mimeType?: string) {
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  const binaryOnly = ["pdf", "docx", "doc", "xlsx", "xls", "pptx", "zip", "png", "jpg", "jpeg", "webp", "gif", "mp4"];

  let text = "";
  try {
    const raw = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    const replacements = (raw.match(/\uFFFD/g) || []).length;
    text = raw
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
      .replace(/\uFFFD+/g, " ")
      .replace(/[ \t]{3,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (text.length > 200000) text = text.slice(0, 200000);

    const garbled = raw.length > 0 && replacements / raw.length > 0.05;

    if (text.length === 0) {
      return {
        text: "",
        status: "failed",
        error: binaryOnly.includes(ext)
          ? `এই ফাইল টাইপ (.${ext}) থেকে স্বয়ংক্রিয়ভাবে টেক্সট বের করা যায়নি। ফাইলটি .txt/.md/.csv/.json এ রূপান্তর করে আপলোড করুন অথবা Edit করে টেক্সট পেস্ট করুন।`
          : "ফাইল থেকে কোনো পাঠযোগ্য টেক্সট পাওয়া যায়নি।",
      };
    }

    if (garbled || binaryOnly.includes(ext)) {
      return {
        text,
        status: "partial",
        error: `ফাইলটি (.${ext || mimeType || "unknown"}) সম্পূর্ণভাবে পড়া যায়নি — কিছু অংশ অস্পষ্ট। Edit করে টেক্সট ঠিক করে নিন।`,
      };
    }

    return { text, status: "success", error: null as string | null };
  } catch (e: any) {
    return { text: "", status: "failed", error: String(e?.message || e) };
  }
}
