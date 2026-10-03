import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  const empty = { downloads: 0, ratingCount: 0, ratingSum: 0 };
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("public_stats");
    if (error) { console.error(error); return empty; }
    const r = Array.isArray(data) ? data[0] : data;
    if (!r) return empty;
    return { downloads: Number(r.downloads), ratingCount: Number(r.rating_count), ratingSum: Number(r.rating_sum) };
  } catch (e) {
    console.error(e);
    return empty;
  }
});

export const recordDownload = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ visitorId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // same visitor: count at most one download per 10 minutes
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recent } = await supabaseAdmin
      .from("site_downloads").select("id").eq("visitor_id", data.visitorId).gte("created_at", since).limit(1);
    if (recent && recent.length) return { ok: true };
    const { error } = await supabaseAdmin.from("site_downloads").insert({ visitor_id: data.visitorId });
    if (error) console.error(error);
    return { ok: !error };
  });
