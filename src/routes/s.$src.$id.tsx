import { createFileRoute } from "@tanstack/react-router";
import { cleanToken, decodeToken, htmlResponse, songPage } from "@/lib/song-page";

// Old long-form share links: /s/<sv|yt>/<id>?d=<token>
export const Route = createFileRoute("/s/$src/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const p = params as { src: string; id: string };
        const src = p.src === "yt" ? "yt" : p.src === "sv" ? "sv" : "";
        const id = (p.id || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
        if (!src || !id) return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
        const url = new URL(request.url);
        const token = cleanToken(url.searchParams.get("d"));
        const meta = await decodeToken(token);
        return htmlResponse(
          songPage({
            src,
            id,
            meta,
            intentToken: token,
            selfPath: `/s/${src}/${id}${token ? `?d=${token}` : ""}`,
            noApp: url.searchParams.get("noapp") === "1",
          }),
        );
      },
    },
  },
});
