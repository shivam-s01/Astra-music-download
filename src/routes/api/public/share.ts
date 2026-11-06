import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { isAllowedArt } from "@/lib/song-page";

const Body = z.object({
  src: z.enum(["sv", "yt"]),
  id: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
  t: z.string().min(1).max(200),
  a: z.string().max(200).default(""),
  i: z.string().max(600).default(""),
});

const B62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Same song always gets the same code, so sharing it twice never makes a new row.
async function codeFor(src: string, id: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${src}:${id}`)));
  let out = "";
  for (let i = 0; i < 8; i++) out += B62[digest[i] % 62];
  return out;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", "access-control-allow-origin": "*" },
  });

export const Route = createFileRoute("/api/public/share")({
  server: {
    handlers: {
      // Create (or refresh) a short code for a song.
      POST: async ({ request }) => {
        let parsed;
        try {
          parsed = Body.safeParse(JSON.parse(await request.text()));
        } catch {
          return json({ error: "bad request" }, 400);
        }
        if (!parsed.success) return json({ error: "bad request" }, 400);
        const { src, id, t, a, i } = parsed.data;
        try {
          const code = await codeFor(src, id);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error } = await (supabaseAdmin as any)
            .from("song_shares")
            .upsert({ code, src, song_id: id, title: t.trim(), artist: a.trim(), art: isAllowedArt(i) ? i : "" }, { onConflict: "code" });
          if (error) {
            console.error("[share] upsert", error);
            return json({ error: "error" }, 500);
          }
          return json({ code });
        } catch (e) {
          console.error("[share]", e);
          return json({ error: "error" }, 500);
        }
      },
      // Look a code up: /api/public/share?code=Ab3dE9xK
      GET: async ({ request }) => {
        const code = (new URL(request.url).searchParams.get("code") || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
        if (code.length < 6) return json({ error: "bad request" }, 400);
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await (supabaseAdmin as any)
            .from("song_shares")
            .select("src,song_id,title,artist,art")
            .eq("code", code)
            .maybeSingle();
          if (!data) return json({ error: "not found" }, 404);
          return json({ src: data.src, id: data.song_id, t: data.title, a: data.artist, i: data.art });
        } catch (e) {
          console.error("[share get]", e);
          return json({ error: "error" }, 500);
        }
      },
    },
  },
});
