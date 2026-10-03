import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({ visitorId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/) });

export const Route = createFileRoute("/api/public/track-download")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed;
        try {
          parsed = Body.safeParse(JSON.parse(await request.text()));
        } catch {
          return new Response("bad request", { status: 400 });
        }
        if (!parsed.success) return new Response("bad request", { status: 400 });
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          // same visitor: count at most one download per 10 minutes
          const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
          const { data: recent, error: readErr } = await supabaseAdmin
            .from("site_downloads").select("id").eq("visitor_id", parsed.data.visitorId).gte("created_at", since).limit(1);
          if (readErr) { console.error("[track-download] read", readErr); return new Response("error", { status: 500 }); }
          if (recent && recent.length) return Response.json({ ok: true, counted: false });
          const { error } = await supabaseAdmin.from("site_downloads").insert({ visitor_id: parsed.data.visitorId });
          if (error) { console.error("[track-download] insert", error); return new Response("error", { status: 500 }); }
          return Response.json({ ok: true, counted: true });
        } catch (e) {
          console.error("[track-download]", e);
          return new Response("error", { status: 500 });
        }
      },
    },
  },
});
