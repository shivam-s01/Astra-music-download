import { createFileRoute } from "@tanstack/react-router";

const REPO = "shivam-s01/Aurum-app";
const FALLBACK = `https://github.com/${REPO}/releases/latest/download/astra-music-arm64-v8a-release.apk`;

type Asset = { name: string; browser_download_url: string };
let cache: { url: string; at: number } | null = null;

// Finds the newest release's Android APK, whatever the file is called, so the
// download button keeps working after every new build.
async function latestApkUrl(): Promise<string | null> {
  if (cache && Date.now() - cache.at < 5 * 60 * 1000) return cache.url;
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "astra-music-site" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { assets?: Asset[] };
  const apks = (data.assets ?? []).filter((a) => /\.apk$/i.test(a.name));
  const pick = apks.find((a) => /arm64/i.test(a.name)) ?? apks[0];
  if (!pick) return null;
  cache = { url: pick.browser_download_url, at: Date.now() };
  return pick.browser_download_url;
}

export const Route = createFileRoute("/api/public/download")({
  server: {
    handlers: {
      GET: async () => {
        let target: string | null = null;
        try { target = await latestApkUrl(); } catch (e) { console.error("[download]", e); }
        return new Response(null, {
          status: 302,
          headers: { Location: target ?? FALLBACK, "Cache-Control": "no-store" },
        });
      },
    },
  },
});
