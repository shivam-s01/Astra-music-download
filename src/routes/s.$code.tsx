import { createFileRoute } from "@tanstack/react-router";
import { encodeToken, htmlResponse, songPage } from "@/lib/song-page";

// Short share links: /s/<code>  (details live in the song_shares table)
export const Route = createFileRoute("/s/$code")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const code = ((params as { code: string }).code || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
        const noApp = new URL(request.url).searchParams.get("noapp") === "1";
        try {
          if (code.length >= 6) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data } = await (supabaseAdmin as any)
              .from("song_shares")
              .select("src,song_id,title,artist,art")
              .eq("code", code)
              .maybeSingle();
            if (data) {
              const meta = { title: data.title as string, artist: data.artist as string, art: data.art as string };
              return htmlResponse(
                songPage({
                  src: data.src,
                  id: data.song_id,
                  meta,
                  intentToken: await encodeToken(meta),
                  selfPath: `/s/${code}`,
                  noApp,
                }),
              );
            }
          }
        } catch (e) {
          console.error("[s/code]", e);
        }
        return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
      },
    },
  },
});
