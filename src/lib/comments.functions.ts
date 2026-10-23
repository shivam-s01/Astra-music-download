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
  .inputValidator((d) =>
    z.object({
      message: z.string().trim().min(3).max(400),
      rating: z.number().int().min(1).max(5).optional(),
      // honeypot: real people never fill this hidden field, bots usually do
      website: z.string().max(200).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    if (data.website) return { ok: true, error: null }; // silently drop bot posts
    if (/https?:\/\/|www\./i.test(data.message)) return { ok: false, error: "Links are not allowed." };
    if (data.message.startsWith("[rating:")) return { ok: false, error: "Please write a normal message." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Same text already received in the last 24h (double tap / resend): treat as success, store only once.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: dupe } = await supabaseAdmin
      .from("astra_comments").select("id").eq("message", data.message).gte("created_at", since).limit(1);
    if (dupe && dupe.length) return { ok: true, error: null };
    const { error } = await supabaseAdmin.from("astra_comments").insert({ message: data.message, rating: data.rating ?? null, status: "pending" });
    if (error) {
      console.error(error);
      return { ok: false, error: "Could not send right now. Please try again." };
    }
    return { ok: true, error: null };
  });

// One-tap star rating: no message and no review needed.
// One rating per visitor: tapping again simply CHANGES that visitor's rating (so nobody can inflate the count and
// nobody is locked out). Stored as a rating-only row whose message is "[rating:<visitorId>]"; these rows are
// hidden from the comment list and the admin list.
export const submitRating = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ rating: z.number().int().min(1).max(5), visitorId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tag = `[rating:${data.visitorId}]`;
    const fail = { ok: false, error: "Could not save your rating. Please try again." };
    const { data: last, error: readErr } = await supabaseAdmin
      .from("astra_comments").select("id").eq("message", tag).order("created_at", { ascending: false }).limit(1);
    if (readErr) { console.error(readErr); return fail; }
    const row = last && last[0];
    const { error } = row
      ? await supabaseAdmin.from("astra_comments").update({ rating: data.rating }).eq("id", row.id)
      : await supabaseAdmin.from("astra_comments").insert({ message: tag, rating: data.rating, status: "approved" });
    if (error) { console.error(error); return fail; }
    return { ok: true, error: null };
  });
