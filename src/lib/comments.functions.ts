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
    .select("id, message, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) {
    console.error(error);
    return { comments: [] as { id: string; message: string; created_at: string }[] };
  }
  return { comments: data ?? [] };
});

export const submitComment = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ message: z.string().trim().min(3).max(400) }).parse(d))
  .handler(async ({ data }) => {
    if (/https?:\/\/|www\./i.test(data.message)) return { ok: false, error: "Links are not allowed." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("astra_comments").insert({ message: data.message, status: "pending" });
    if (error) {
      console.error(error);
      return { ok: false, error: "Could not send right now. Please try again." };
    }
    return { ok: true, error: null };
  });
