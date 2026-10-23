import { createFileRoute } from "@tanstack/react-router";

const REPO = "shivam-s01/Aurum-app";
const FALLBACK = `https://github.com/${REPO}/releases/latest/download/astra-music-arm64-v8a-release.apk`;

// Astra TV. By default its APK is looked up in the SAME GitHub release as the phone app (any .apk with "tv" in
// its name). If the TV app is released from a different repo, set the ASTRA_TV_REPO env var (e.g. "shivam-s01/AstraTV")
// in Cloudflare, or change the default below.
const TV_REPO_DEFAULT = REPO;

type Asset = { name: string; browser_download_url: string };
const cache = new Map<string, { url: string; at: number }>();

// Finds the newest release's APK for the device, whatever the file is called, so the
// download buttons keep working after every new build.
async function latestApkUrl(repo: string, device: "phone" | "tv"): Promise<string | null> {
  const key = `${repo}:${device}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 5 * 60 * 1000) return hit.url;
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "astra-music-site" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { assets?: Asset[] };
  const apks = (data.assets ?? []).filter((a) => /\.apk$/i.test(a.name));
  let pick: Asset | undefined;
  if (device === "tv") {
    pick = apks.find((a) => /tv/i.test(a.name));
  } else {
    // the phone button must never hand out the TV build
    const phone = apks.filter((a) => !/tv/i.test(a.name));
    const pool = phone.length ? phone : apks;
    pick = pool.find((a) => /arm64/i.test(a.name)) ?? pool[0];
  }
  if (!pick) return null;
  cache.set(key, { url: pick.browser_download_url, at: Date.now() });
  return pick.browser_download_url;
}

export const Route = createFileRoute("/api/public/download")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const device = new URL(request.url).searchParams.get("device") === "tv" ? "tv" : "phone";
        const tvRepo = (typeof process !== "undefined" && process.env?.["ASTRA_TV_REPO"]) || TV_REPO_DEFAULT;
        const repo = device === "tv" ? tvRepo : REPO;
        let target: string | null = null;
        try { target = await latestApkUrl(repo, device); } catch (e) { console.error("[download]", e); }
        // phone: known direct file; TV: the releases page if no TV APK is found yet (never a dead link)
        const fallback = device === "tv" ? `https://github.com/${repo}/releases/latest` : FALLBACK;
        return new Response(null, {
          status: 302,
          headers: { Location: target ?? fallback, "Cache-Control": "no-store" },
        });
      },
    },
  },
});
