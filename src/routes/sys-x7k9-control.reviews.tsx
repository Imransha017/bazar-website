import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, Trash2, MessageSquare, Eye, EyeOff, Video, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Surface, GhostButton, DangerButton, Badge, PrimaryButton } from "@/lib/admin-ui";
import { useServerFn } from "@tanstack/react-start";
import { getPendingVideoReviews, moderateVideoReview } from "@/lib/marketing-pro.functions";

export const Route = createFileRoute("/sys-x7k9-control/reviews")({
  component: ReviewsAdmin,
});

type Row = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
};

function ReviewsAdmin() {
  const [list, setList] = useState<Row[]>([]);
  const [videoList, setVideoList] = useState<any[]>([]);
  const [filter, setFilter] = useState<"text" | "video">("text");
  const [textFilter, setTextFilter] = useState<"all" | "approved" | "pending">("all");
  
  const fetchVideos = useServerFn(getPendingVideoReviews);
  const moderateVideo = useServerFn(moderateVideoReview);

  const load = async () => {
    const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(200);
    setList(data ?? []);
    fetchVideos().then(setVideoList).catch(console.error);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (r: Row) => {
    const { error } = await supabase.from("reviews").update({ is_approved: !r.is_approved }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(r.is_approved ? "Hidden" : "Approved");
    load();
  };
  const del = async (id: string) => {
    if (!confirm("Delete review?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    load();
  };

  const filtered = list.filter((r) =>
    textFilter === "all" ? true : textFilter === "approved" ? r.is_approved : !r.is_approved,
  );

  return (
    <div className="space-y-5">
      <PageHeader
        icon={MessageSquare}
        title="Reviews"
        subtitle={`${list.length} text reviews · ${videoList.length} video reviews pending`}
        actions={
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {(["text", "video"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-4 py-1.5 text-xs font-bold capitalize transition ${filter === f ? "bg-white text-purple-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                {f} Reviews
              </button>
            ))}
          </div>
        }
      />

      {filter === "text" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
             <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {(["all", "approved", "pending"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTextFilter(f)}
                  className={`rounded-md px-3 py-1 text-[10px] font-bold capitalize transition ${textFilter === f ? "bg-white text-purple-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3">
            {filtered.map((r) => (
              <Surface key={r.id} className="p-4">
                <div className="flex gap-3">
                  <div className="flex shrink-0 items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">
                      Product {r.product_id.slice(0, 8)} · User {r.user_id.slice(0, 6)} · {new Date(r.created_at).toLocaleString()}
                    </p>
                    <p className="mt-1.5 text-sm text-slate-800">{r.comment ?? <span className="italic text-slate-400">No comment</span>}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge tone={r.is_approved ? "sky" : "pink"}>{r.is_approved ? "Approved" : "Pending"}</Badge>
                    <div className="flex gap-1">
                      <GhostButton onClick={() => toggle(r)}>
                        {r.is_approved ? <><EyeOff className="h-3 w-3" /> Hide</> : <><Eye className="h-3 w-3" /> Approve</>}
                      </GhostButton>
                      <DangerButton onClick={() => del(r.id)}><Trash2 className="h-3 w-3" /></DangerButton>
                    </div>
                  </div>
                </div>
              </Surface>
            ))}
            {filtered.length === 0 && (
              <Surface className="py-12 text-center text-sm text-slate-400">No text reviews to show</Surface>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videoList.map((v) => (
            <Surface key={v.id} className="overflow-hidden p-0">
               <div className="aspect-video bg-black relative flex items-center justify-center">
                 <Video className="h-8 w-8 text-white/20" />
                 <a href={v.video_url} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                    <Eye className="h-8 w-8 text-white" />
                 </a>
               </div>
               <div className="p-4">
                 <div className="mb-2 flex items-center justify-between">
                    <Badge tone="pink" className="uppercase text-[9px]">Pending Moderation</Badge>
                    <span className="text-[10px] text-slate-400">{v.platform}</span>
                 </div>
                 <h4 className="text-xs font-bold text-slate-800 truncate mb-1">{v.products?.title?.en || "Unnamed Product"}</h4>
                 <p className="text-[10px] text-slate-500 mb-4 truncate">{v.video_url}</p>
                 
                 <div className="flex gap-2">
                   <PrimaryButton 
                    className="flex-1 bg-green-600 hover:bg-green-700 h-9" 
                    onClick={async () => {
                      await moderateVideo({ data: { reviewId: v.id, status: 'approved' } });
                      toast.success("Review approved");
                      load();
                    }}
                   >
                     <CheckCircle className="h-4 w-4 mr-1.5" /> Approve
                   </PrimaryButton>
                   <DangerButton 
                    className="flex-1 h-9"
                    onClick={async () => {
                      if (!confirm("Reject this video review?")) return;
                      await moderateVideo({ data: { reviewId: v.id, status: 'rejected' } });
                      toast.error("Review rejected");
                      load();
                    }}
                   >
                     <XCircle className="h-4 w-4 mr-1.5" /> Reject
                   </DangerButton>
                 </div>
               </div>
            </Surface>
          ))}
          {videoList.length === 0 && (
            <Surface className="col-span-full py-12 text-center text-sm text-slate-400">No pending video reviews</Surface>
          )}
        </div>
      )}
    </div>
  );
}
