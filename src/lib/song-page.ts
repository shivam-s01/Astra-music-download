// ─────────────────────────────────────────────────────────────────────────
// Astra song share page  →  https://astra.mmusic.workers.dev/s/<sv|yt>/<id>?d=<token>
//
// The app puts the title, artist and artwork into a small compressed token
// (`d`), so this page needs no database and no outside API. Chat apps read the
// Open Graph tags below to draw the preview card (artwork + title + artist).
// One tap opens the song inside Astra; without the app the download button is
// the main action. Plain server-rendered HTML, same as the Jam invite page.
// ─────────────────────────────────────────────────────────────────────────
export const SITE = "https://astra.mmusic.workers.dev";
const ANDROID_PACKAGE = "com.aurum.music";
export const ART_HOSTS = /(^|\.)(saavncdn\.com|jiosaavn\.com|ytimg\.com|ggpht\.com|googleusercontent\.com)$/i;

export type Meta = { title: string; artist: string; art: string };

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

export function cleanToken(raw: string | null): string {
  return (raw || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 1500);
}

export async function decodeToken(token: string): Promise<Meta | null> {
  try {
    if (!token) return null;
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
    const text = await new Response(stream).text();
    if (text.length > 1200) return null;
    const p = text.split("\n");
    let art = "";
    try {
      const u = new URL(p[2] ? "https://" + p[2] : "");
      if (u.protocol === "https:" && ART_HOSTS.test(u.hostname)) art = u.toString();
    } catch {
      /* no artwork */
    }
    return { title: (p[0] || "").slice(0, 140), artist: (p[1] || "").slice(0, 140), art };
  } catch {
    return null;
  }
}

const ICON_OPEN =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5l8 7-8 7"/></svg>';
const ICON_DOWNLOAD =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></svg>';


const CSS = `
:root{--bg:#fff6e2;--fg:#1e1734;--brand:#f95100;--brand-dk:#b23a00;--sun:#ffc921;--lilac:#9a79fe;--aqua:#00caac;
  --muted:#5c5b71;--card:#fff;--soft:#ffe8ba;--line:rgba(30,23,52,.14);
  --display:"Fredoka",ui-rounded,"Segoe UI",system-ui,sans-serif;--body:"DM Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html{-webkit-text-size-adjust:100%;overflow-x:clip}
body{margin:0;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;background:var(--bg);color:var(--fg);
  font-family:var(--body);-webkit-font-smoothing:antialiased;overflow-x:hidden;
  padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
a{color:inherit;text-decoration:none}
:focus-visible{outline:3px solid var(--brand);outline-offset:3px;border-radius:10px}
::selection{background:rgba(255,201,33,.65)}
header{width:min(520px,calc(100% - 40px));margin:0 auto;padding:20px 0 4px;position:relative;z-index:2}
.brand{display:inline-flex;align-items:center;gap:10px;font:700 22px/1 var(--display)}
.brand img{width:38px;height:38px;border-radius:11px;box-shadow:0 4px 0 rgba(30,23,52,.35)}
main{flex:1;width:min(520px,calc(100% - 40px));margin:0 auto;display:flex;align-items:center;justify-content:center;
  padding:18px 0 36px;position:relative}
.blob{position:absolute;border-radius:50%;z-index:0;pointer-events:none}
.b1{width:170px;height:170px;background:var(--sun);right:-20px;top:-6px}
.b2{width:96px;height:96px;background:var(--aqua);left:-20px;bottom:70px}
.b3{width:62px;height:62px;background:var(--lilac);right:6px;bottom:12px}
.card{position:relative;z-index:1;width:100%;background:var(--card);border:2px solid var(--fg);border-radius:30px;
  padding:30px 22px 24px;box-shadow:8px 8px 0 var(--fg);text-align:center;animation:rise .5s cubic-bezier(.2,.8,.2,1) both}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.note{position:absolute;top:-24px;right:20px;width:56px;height:56px;display:grid;place-items:center;border-radius:18px;
  background:var(--brand);color:#fff;font:700 29px/1 var(--display);transform:rotate(9deg);
  box-shadow:0 6px 0 var(--brand-dk);border:2px solid var(--fg)}
.pill{display:inline-flex;align-items:center;gap:9px;padding:7px 13px;border-radius:999px;background:rgba(255,201,33,.38);
  font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.eq{display:inline-flex;align-items:flex-end;gap:3px;height:14px}
.eq i{width:3px;border-radius:3px;background:var(--lilac);animation:eq 1s ease-in-out infinite alternate}
.eq i:nth-child(1){height:70%}.eq i:nth-child(2){height:100%;animation-delay:-.4s}.eq i:nth-child(3){height:55%;animation-delay:-.7s}
@keyframes eq{to{transform:scaleY(.4)}}
h1{margin:16px 0 10px;font:700 clamp(38px,11vw,52px)/.98 var(--display)}
h1 em{font-style:normal;color:var(--brand);text-shadow:3px 3px 0 var(--sun)}
.lead{margin:0 auto 22px;max-width:360px;color:var(--muted);font-size:16px;line-height:1.55}
.ticket{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 18px;padding:12px 12px 12px 18px;min-width:0;
  background:var(--soft);border:2px dashed rgba(30,23,52,.35);border-radius:18px;text-align:left}
.ticket small{display:block;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:3px}
.ticket strong{display:block;font:700 clamp(20px,6vw,27px)/1 var(--display);letter-spacing:.05em;user-select:all;-webkit-user-select:all;white-space:nowrap}
.copy{flex:none;display:grid;place-items:center;width:46px;height:46px;border:2px solid var(--fg);background:var(--card);color:var(--fg);
  border-radius:14px;padding:0;cursor:pointer;box-shadow:0 3px 0 var(--fg);transition:transform .12s,box-shadow .12s}
.copy .ic-ok,.copy.done .ic-copy{display:none}
.copy.done .ic-ok{display:block}
.copy svg{display:block}
.copy:active{transform:translateY(3px);box-shadow:0 0 0 var(--fg)}
.copy.done{background:var(--aqua)}
.btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:58px;padding:0 22px;margin:0 0 14px;
  border:0;border-radius:16px;cursor:pointer;font:600 19px var(--display);transition:transform .15s,box-shadow .15s}
.btn.primary{background:var(--brand);color:#fff;box-shadow:0 7px 0 var(--brand-dk)}
.btn.primary:active{transform:translateY(5px);box-shadow:0 2px 0 var(--brand-dk)}
.btn.outline{background:transparent;color:var(--fg);border:2px solid var(--fg);min-height:52px;font-size:17px}
.btn.outline:active{background:var(--soft)}
@media (hover:hover){.btn.primary:hover{transform:translateY(-2px);box-shadow:0 9px 0 var(--brand-dk)}.copy:hover{background:var(--soft)}}
.only-other,.tip{display:none}
html.not-android .only-android{display:none}
html.not-android .only-other{display:block}
html.is-webview .tip{display:block}
.note-box{margin:0 0 14px;padding:12px 14px;border-radius:14px;background:var(--soft);font-size:14px;line-height:1.5;text-align:left;color:var(--fg)}
.note-box b{font-weight:700}
.alert{display:flex;gap:10px;align-items:flex-start;margin:0 0 18px;padding:12px 14px;border-radius:14px;background:rgba(154,121,254,.14);
  font-size:14px;line-height:1.5;text-align:left}
.steps{list-style:none;margin:6px 0 0;padding:16px 0 0;border-top:1px solid var(--line);display:grid;gap:10px;text-align:left}
.steps li{text-wrap:pretty;display:flex;align-items:center;gap:12px;font-size:14.5px;color:var(--muted);line-height:1.4}
.steps li b{flex:none;width:26px;height:26px;display:grid;place-items:center;border-radius:50%;background:var(--sun);color:var(--fg);font:700 13px var(--display)}
.foot{margin:18px 0 0;font-size:12.5px;color:var(--muted)}
.foot a{border-bottom:1.5px solid var(--line)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
@media (max-width:360px){.card{padding:28px 16px 20px}.ticket{padding:10px 10px 10px 14px}.ticket strong{font-size:18px;letter-spacing:.02em}.copy{width:42px;height:42px}}

.cover{width:min(100%,264px);aspect-ratio:1;margin:0 auto 22px;border:2px solid var(--fg);border-radius:22px;overflow:hidden;background:var(--soft);
  box-shadow:6px 6px 0 var(--fg);display:grid;place-items:center;font:700 64px/1 var(--display);color:var(--brand)}
.cover img{width:100%;height:100%;object-fit:cover;display:block}
h1.song{font-size:clamp(28px,8.5vw,38px);line-height:1.04;margin:16px 0 8px;overflow-wrap:anywhere;text-wrap:balance}
.artist{margin:0 auto 22px;max-width:380px;color:var(--muted);font-size:17px;font-weight:500;overflow-wrap:anywhere}
`;

const SCRIPT = `
(function(){
  var ua=navigator.userAgent||'';
  var root=document.documentElement;
  root.classList.add(/Android/i.test(ua)?'is-android':'not-android');
  if(/; wv\\)|FBAN|FBAV|Instagram|Snapchat|Line\\/|MicroMessenger/i.test(ua))root.classList.add('is-webview');
})();
`;

function head(title: string, desc: string, canonical: string, art: string): string {
  const img = art ? `<meta property="og:image" content="${esc(art)}">
<meta name="twitter:image" content="${esc(art)}">` : `<meta property="og:image" content="${SITE}/astra-share-cover.jpg">
<meta name="twitter:image" content="${SITE}/astra-share-cover.jpg">`;
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#fff6e2">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
<link rel="icon" href="/astra-icon-v2.png" type="image/png">
<link rel="apple-touch-icon" href="/astra-icon-v2.png">
<meta property="og:site_name" content="Astra Music">
<meta property="og:type" content="music.song">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
<meta name="twitter:card" content="${art ? "summary" : "summary_large_image"}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
${img}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Fredoka:wght@500;600;700&display=swap">
<style>${CSS}</style>`;
}

const HEADER = `<header><a class="brand" href="/" aria-label="Astra Music home"><img src="/favicon.png" alt="" width="38" height="38">Astra</a></header>`;
const BLOBS = `<span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span>`;

export type PageOpts = {
  src: string;
  id: string;
  meta: Meta | null;
  /** token passed to the app inside the intent (title/artist/art) */
  intentToken: string;
  /** path of this page, e.g. /s/Ab3dE9xK */
  selfPath: string;
  noApp: boolean;
};

export function songPage(o: PageOpts): string {
  const { src, id, meta, intentToken, selfPath, noApp } = o;
  const title = meta?.title || "A song on Astra";
  const artist = meta?.artist || "";
  const self = `${SITE}${selfPath}`;
  const fallback = encodeURIComponent(`${self}${selfPath.includes("?") ? "&" : "?"}noapp=1`);
  const intent = `intent://song/${src}/${id}${intentToken ? `?d=${intentToken}` : ""}#Intent;scheme=astra;package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`;
  const download = "/api/public/download";

  const openBtn = (cls: string) =>
    `<a class="btn ${cls} only-android" id="open" href="${intent}">Play in Astra ${ICON_OPEN}</a>`;
  const dlBtn = (cls: string, label: string) =>
    `<a class="btn ${cls}" id="dl" href="${download}" rel="nofollow">${ICON_DOWNLOAD} ${label}</a>`;

  const actions = noApp
    ? `<div class="alert"><span aria-hidden="true">📲</span><span><b>Astra isn’t installed on this phone yet.</b> Download it, open it, and this song is one tap away.</span></div>
  ${dlBtn("primary", "Download Astra")}
  ${openBtn("outline")}`
    : `${openBtn("primary")}
  <div class="only-other note-box"><b>Open this link on your Android phone</b> with Astra installed to play the song.</div>
  ${dlBtn("outline", "Get the Astra app")}
  <p class="tip note-box">Button not working? You’re in an in-app browser. Tap <b>⋮</b> → <b>Open in Chrome</b>, then try again.</p>`;

  const cover = meta?.art
    ? `<div class="cover"><img src="${esc(meta.art)}" alt="" width="264" height="264" referrerpolicy="no-referrer"></div>`
    : `<div class="cover" aria-hidden="true">♪</div>`;

  const desc = artist ? `${artist} on Astra` : "Listen on Astra";
  return `<!doctype html>
<html lang="en"><head>
${head(title, desc, self, meta?.art || "")}
</head>
<body>
${HEADER}
<main>
${BLOBS}
<section class="card" aria-labelledby="t">
  ${cover}
  <h1 class="song" id="t">${esc(title)}</h1>
  ${artist ? `<p class="artist">${esc(artist)}</p>` : ""}
  ${actions}
  <p class="foot">Free for Android · <a href="/">astra.mmusic.workers.dev</a></p>
</section>
</main>
<script>${SCRIPT}</script>
</body></html>`;
}


export async function encodeToken(meta: { title: string; artist: string; art: string }): Promise<string> {
  try {
    const art = meta.art.replace(/^https:\/\//, "");
    const raw = new TextEncoder().encode(`${meta.title}\n${meta.artist}\n${art}`);
    const stream = new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate"));
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return "";
  }
}

export function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=3600",
      "x-robots-tag": "noindex, nofollow",
      "referrer-policy": "no-referrer",
    },
  });
}

export function isAllowedArt(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && ART_HOSTS.test(u.hostname);
  } catch {
    return false;
  }
}
