import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listComments = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("astra_comments")
    .select("id, message, rating, created_at")
    .eq("status", "approved")
    .not("message", "like", "[rating:%")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) {
    console.error(error);
    return { comments: [] as { id: string; message: string; rating: number | null; created_at: string }[] };
  }
  return { comments: data ?? [] };
});

export const submitComment = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ message: z.string().trim().min(3).max(400), rating: z.number().int().min(1).max(5).optional() }).parse(d))
  .handler(async ({ data }) => {
    if (/https?:\/\/|www\./i.test(data.message)) return { ok: false, error: "Links are not allowed." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("astra_comments").insert({ message: data.message, rating: data.rating ?? null, status: "pending" });
    if (error) {
      console.error(error);
      return { ok: false, error: "Could not send right now. Please try again." };
    }
    return { ok: true, error: null };
  });

// One-tap star rating: no message and no review needed.
// Spam guard only (nobody is locked out): a visitor's rating within 10 minutes of their last one just updates that
// rating; after 10 minutes a new tap counts as a new rating. Stored as a rating-only row whose message is
// "[rating:<visitorId>]"; these rows are hidden from the comment list and the admin list.
const RATING_GAP_MS = 10 * 60 * 1000;
export const submitRating = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ rating: z.number().int().min(1).max(5), visitorId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tag = `[rating:${data.visitorId}]`;
    const fail = { ok: false, error: "Could not save your rating. Please try again." };
    const { data: last, error: readErr } = await supabaseAdmin
      .from("astra_comments").select("id, created_at").eq("message", tag).order("created_at", { ascending: false }).limit(1);
    if (readErr) { console.error(readErr); return fail; }
    const row = last && last[0];
    const recent = !!row && Date.now() - new Date(row.created_at).getTime() < RATING_GAP_MS;
    const { error } = recent
      ? await supabaseAdmin.from("astra_comments").update({ rating: data.rating }).eq("id", row!.id)
      : await supabaseAdmin.from("astra_comments").insert({ message: tag, rating: data.rating, status: "approved" });
    if (error) { console.error(error); return fail; }
    return { ok: true, error: null };
  });
