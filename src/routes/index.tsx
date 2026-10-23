import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPublicStats } from "@/lib/stats.functions";
import { Check, Copy, Star, Download, Headphones, Library, Search, ShieldCheck, Smartphone, Sparkles, Tv, Users, Ban } from "lucide-react";
import homeImage from "@/assets/astra-app-home-real.jpg";
import libraryImage from "@/assets/astra-app-library-real.jpg";
import exploreImage from "@/assets/astra-app-explore-real.jpg";
import suggestionsImage from "@/assets/astra-app-suggestions-real.jpg";
import resultsImage from "@/assets/astra-app-results-real.jpg";
import playerImage from "@/assets/astra-app-player-real.jpg";
import lyricsImage from "@/assets/astra-app-lyrics-real.jpg";
import liveVideo from "@/assets/astra-download-live.mp4";
import liveVideoWebm from "@/assets/astra-download-live.webm";
import livePoster from "@/assets/astra-download-live-poster.jpg";

// Starting totals confirmed by the developer; real downloads/ratings from this site are added on top.
// Keep these equal to genuine counts only. Update them as the real totals grow.
const BASE_DOWNLOADS = 20000;
const BASE_RATINGS = 1984;
// Counts up from 0 on every page load and stops exactly on the real number. Later changes glide from the shown value.
function useCountUp(target: number, ms = 1900) {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  const started = useRef(false);
  useEffect(() => {
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { current.current = target; setValue(target); started.current = true; return; }
    const from = started.current ? current.current : 0;
    const dur = started.current ? 700 : ms;
    started.current = true;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (target - from) * eased);
      current.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

const SUPPORT_NOTE = "Hi! If you love Astra Music, consider supporting my work! ☕";
const DOWNLOAD_URL = "https://github.com/shivam-s01/Aurum-app/releases/latest/download/astra-music-arm64-v8a-release.apk";
// Astra TV: resolved server-side to the newest Astra TV APK (see src/routes/api/public/download.ts)
const TV_DOWNLOAD_URL = "/api/public/download?device=tv";
const SITE_URL = "https://astra.mmusic.workers.dev";
const TICKER = ["No ads", "Free forever", "Jam with friends", "Live lyrics", "Now on TV", "Official release"];

// Splits a heading into words that rise out of a mask one after another when the section is revealed.
function Words({ text }: { text: string }) {
  return <>{text.split(" ").map((w, i, a) => (
    <span key={i}><span className="wd" style={{ "--w": i } as React.CSSProperties}><span>{w}</span></span>{i < a.length - 1 ? " " : ""}</span>
  ))}</>;
}

const screenshots = [
  { src: homeImage, alt: "Astra Music home screen with quick picks and recommendations", label: "Discover" },
  { src: libraryImage, alt: "Astra Music library with liked songs and recent plays", label: "Library" },
  { src: exploreImage, alt: "Astra Music search screen with mood and genre collections", label: "Explore" },
  { src: suggestionsImage, alt: "Astra Music personalized song suggestions", label: "Suggestions" },
  { src: resultsImage, alt: "Astra Music artist, album and song search results", label: "Instant search" },
  { src: playerImage, alt: "Astra Music immersive now playing screen", label: "Now playing" },
  { src: lyricsImage, alt: "Astra Music synchronized lyrics screen", label: "Live lyrics" },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Astra Music Download — Free Android Music Player APK" },
      { name: "description", content: "Download Astra Music for Android — free music player app. Get the latest official Astra Music APK, discover songs and build your library. Direct download from the official GitHub release." },
      { name: "keywords", content: "Astra Music, Astra Music download, Astra Music APK, Astra Music app, Astra Music Android, free music player APK" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { name: "theme-color", content: "#0b0b10" },
      { property: "og:site_name", content: "Astra Music" },
      { property: "og:title", content: "Astra Music Download — Free Android Music Player APK" },
      { property: "og:description", content: "Download the latest official Astra Music APK for Android." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://astra.mmusic.workers.dev/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Astra Music Download — Free Android Music Player APK" },
      { name: "twitter:description", content: "Download the latest official Astra Music APK for Android." },
      { property: "og:image", content: "https://astra.mmusic.workers.dev/astra-share-cover.jpg" },
      { name: "twitter:image", content: "https://astra.mmusic.workers.dev/astra-share-cover.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://astra.mmusic.workers.dev/" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify([{"@context": "https://schema.org", "@type": "WebSite", "name": "Astra Music", "alternateName": ["Astra Music Download", "Astra Music APK"], "url": "https://astra.mmusic.workers.dev/"}, {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Astra Music", "operatingSystem": "Android", "applicationCategory": "MusicApplication", "description": "Download Astra Music for Android — a free, focused music player for discovery, playback and your personal library.", "url": "https://astra.mmusic.workers.dev/", "downloadUrl": "https://astra.mmusic.workers.dev/api/public/download", "image": "https://astra.mmusic.workers.dev/astra-share-cover.jpg", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}}, {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "What is Astra Music?", "acceptedAnswer": {"@type": "Answer", "text": "Astra Music is a free Android music player app for discovering songs, playing music and building your personal library."}}, {"@type": "Question", "name": "How do I download Astra Music APK?", "acceptedAnswer": {"@type": "Answer", "text": "Tap any Download APK button on this page. The latest official Astra Music APK for Android (arm64-v8a) downloads directly from the official GitHub release."}}, {"@type": "Question", "name": "Is Astra Music free?", "acceptedAnswer": {"@type": "Answer", "text": "Yes. Astra Music is free to download and use."}}, {"@type": "Question", "name": "Does Astra need an account?", "acceptedAnswer": {"@type": "Answer", "text": "Account requirements depend on the services and features available in the current build."}}, {"@type": "Question", "name": "What is Jam?", "acceptedAnswer": {"@type": "Answer", "text": "Jam lets you listen together with friends. One person starts a Jam and shares a code or link, and everyone who joins plays the same song in sync."}}, {"@type": "Question", "name": "Is there an Astra TV app?", "acceptedAnswer": {"@type": "Answer", "text": "Yes. Astra TV is a separate APK made for the big screen. Use the Astra TV button on this page to download the latest official build."}}, {"@type": "Question", "name": "Is it safe to install?", "acceptedAnswer": {"@type": "Answer", "text": "The APK comes straight from the developer's official GitHub release. Android shows a standard warning for any APK installed outside the Play Store."}}, {"@type": "Question", "name": "Which Android versions are supported?", "acceptedAnswer": {"@type": "Answer", "text": "Check the latest release information before installing to confirm compatibility with your device."}}]}]) }],
  }),
  component: AstraPage,
});

function Heart() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.2S3.2 15.700 2.600 9.600C2.300 6.300 4.500 4 7.300 4c1.900 0 3.700 1 4.700 2.800C13 5 14.800 4 16.700 4c2.800 0 5 2.300 4.700 5.600-.6 6.100-9.400 11.600-9.400 11.600Z" /></svg>;
}

function AstraPage() {
  const navigate = useNavigate();
  const [supportView, setSupportView] = useState<"site" | "loading">("site");
  const [navOn, setNavOn] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const progressRef = useRef<HTMLDivElement>(null);
  const heroArtRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const [coffeeVisible, setCoffeeVisible] = useState(false);
  const fetchStats = useServerFn(getPublicStats);
  const [live, setLive] = useState({ downloads: 0, ratingCount: 0, ratingSum: 0 });
  useEffect(() => {
    let alive = true;
    const load = () => { if (document.visibilityState === "visible") fetchStats().then((s) => { if (alive) setLive(s); }).catch(() => {}); };
    load();
    const t = window.setInterval(load, 30000);
    document.addEventListener("visibilitychange", load);
    return () => { alive = false; window.clearInterval(t); document.removeEventListener("visibilitychange", load); };
  }, [fetchStats]);
  const totalDownloads = BASE_DOWNLOADS + live.downloads;
  const totalRatings = BASE_RATINGS + live.ratingCount;
  const shownDownloads = useCountUp(totalDownloads);
  const shownRatings = useCountUp(totalRatings, 2200);
  const trackDownload = () => {
    try {
      let id = localStorage.getItem("astra_vid");
      if (!id) { id = crypto.randomUUID(); localStorage.setItem("astra_vid", id); }
      const last = Number(localStorage.getItem("astra_last_dl") || 0);
      if (Date.now() - last < 10 * 60 * 1000) return; // already counted recently
      localStorage.setItem("astra_last_dl", String(Date.now()));
      setLive((s) => ({ ...s, downloads: s.downloads + 1 })); // show +1 instantly
      const body = JSON.stringify({ visitorId: id });
      // sendBeacon survives the page starting the APK download / navigating away
      const sent = typeof navigator.sendBeacon === "function" && navigator.sendBeacon("/api/public/track-download", new Blob([body], { type: "text/plain" }));
      if (!sent) fetch("/api/public/track-download", { method: "POST", body, keepalive: true }).catch(() => {});
    } catch { /* storage blocked — skip */ }
  };
  // Hero button: countdown starts when the page opens, then the download starts automatically.
  // The bottom button downloads instantly (and cancels the countdown so nothing downloads twice).
  const WAIT_SECONDS = 25;
  const [wait, setWait] = useState<number | null>(WAIT_SECONDS);
  const [started, setStarted] = useState(false);
  const bottomDownload = () => { setWait(null); trackDownload(); };
  useEffect(() => {
    if (wait === null) return;
    if (wait <= 0) {
      trackDownload();
      window.location.assign(DOWNLOAD_URL);
      setWait(null);
      setStarted(true);
      const t = window.setTimeout(() => setStarted(false), 6000);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setWait((w) => (w === null ? w : w - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);
  const openSupport = () => { setWait(null); setSupportView("loading"); };
  const [meowing, setMeowing] = useState(false);
  type CatMode = "sit" | "walk" | "look" | "catch" | "groove" | "sleep" | "wake";
  const [catMode, setCatMode] = useState<CatMode>("sit");
  const [catPos, setCatPos] = useState(0.1);
  const [catFace, setCatFace] = useState(1);
  const [walkMs, setWalkMs] = useState(1900);

  useEffect(() => {
    const updateCoffee = () => {
      const vh = window.innerHeight;
      const faqTop = document.getElementById("faq")?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      setCoffeeVisible(window.scrollY > 90 && faqTop > vh * 0.4);
    };
    updateCoffee();
    window.addEventListener("scroll", updateCoffee, { passive: true });
    return () => window.removeEventListener("scroll", updateCoffee);
  }, []);

  useEffect(() => {
    if (!coffeeVisible) return;
    const routine: Array<{ mode: CatMode; pos: number; face: number; duration: number }> = [
      { mode: "sit", pos: 0.1, face: 1, duration: 1800 },
      { mode: "walk", pos: 0.86, face: 1, duration: 2000 },
      { mode: "look", pos: 0.86, face: -1, duration: 1500 },
      { mode: "walk", pos: 0.45, face: -1, duration: 1800 },
      { mode: "catch", pos: 0.45, face: 1, duration: 2700 },
      { mode: "groove", pos: 0.45, face: 1, duration: 2600 },
      { mode: "walk", pos: 0.62, face: 1, duration: 1300 },
      { mode: "catch", pos: 0.62, face: -1, duration: 2700 },
      { mode: "walk", pos: 0.1, face: -1, duration: 2000 },
      { mode: "sit", pos: 0.1, face: 1, duration: 1600 },
      { mode: "sleep", pos: 0.1, face: 1, duration: 6500 },
      { mode: "wake", pos: 0.1, face: 1, duration: 900 },
    ];
    let index = 0;
    let timer = 0;
    const advance = () => {
      const moment = routine[index];
      if (!moment) return;
      setWalkMs(moment.mode === "walk" ? moment.duration - 100 : 400);
      setCatPos(moment.pos);
      setCatFace(moment.face);
      setCatMode(moment.mode);
      index = (index + 1) % routine.length;
      timer = window.setTimeout(advance, moment.duration);
    };
    advance();
    return () => window.clearTimeout(timer);
  }, [coffeeVisible]);

  const [typed, setTyped] = useState("");
  useEffect(() => {
    const chars = Array.from(SUPPORT_NOTE);
    if (!coffeeVisible) { setTyped(""); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setTyped(SUPPORT_NOTE); return; }
    let i = 0;
    let timer = 0;
    const tick = () => {
      i += 1;
      setTyped(chars.slice(0, i).join(""));
      if (i < chars.length) timer = window.setTimeout(tick, /[,!]/.test(chars[i - 1]) ? 240 : 46 + Math.round(Math.random() * 26));
    };
    timer = window.setTimeout(tick, 700);
    return () => window.clearTimeout(timer);
  }, [coffeeVisible]);

  // Scroll engine: progress bar, floating nav, hero parallax and ticker skew. One rAF-throttled listener, no layout reads in loops.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ids = ["screens", "features", "tv", "faq"];
    let raf = 0;
    let lastY = window.scrollY;
    let vel = 0;
    let velRaf = 0;
    const applyVel = () => {
      velRaf = 0;
      vel *= 0.86;
      if (Math.abs(vel) < 0.02) vel = 0;
      tickerRef.current?.style.setProperty("--sv", vel.toFixed(3));
      if (vel !== 0) velRaf = window.requestAnimationFrame(applyVel);
    };
    const frame = () => {
      raf = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, y / max)).toFixed(4) : 0})`;
      setNavOn(y > 480);
      if (!reduce) {
        if (y < 1200) heroArtRef.current?.style.setProperty("--sy", String(Math.round(y)));
        const dy = y - lastY;
        vel = Math.max(-1, Math.min(1, vel * 0.5 + dy / 90));
        if (!velRaf) velRaf = window.requestAnimationFrame(applyVel);
      }
      lastY = y;
      let current = "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) current = id;
      }
      setActiveSection((prev) => (prev === current ? prev : current));
    };
    const onScroll = () => { if (!raf) raf = window.requestAnimationFrame(frame); };
    frame();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
      if (velRaf) window.cancelAnimationFrame(velRaf);
    };
  }, []);

  // Cursor-follow tilt + spotlight on the feature cards (mouse only; touch screens keep the simple lift).
  const onCardMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const card = (e.target as HTMLElement).closest<HTMLElement>(".feature-card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    card.style.setProperty("--ry", `${((px - 0.5) * 7).toFixed(2)}deg`);
    card.style.setProperty("--rx", `${((0.5 - py) * 7).toFixed(2)}deg`);
  };
  const onCardLeave = (e: React.PointerEvent<HTMLElement>) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>(".feature-card");
    if (!card) return;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  };

  const [tvCopied, setTvCopied] = useState(false);
  const copyTvLink = async () => {
    try { await navigator.clipboard.writeText(`${SITE_URL}${TV_DOWNLOAD_URL}`); setTvCopied(true); window.setTimeout(() => setTvCopied(false), 1800); } catch { /* clipboard blocked */ }
  };

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const reveal = (el: Element) => el.classList.add("is-revealed");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // reveal when visible OR when it was scrolled past quickly (already above the viewport)
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach((node) => observer.observe(node));
    // safety net: fast scrolling can outrun the observer, so also check on scroll
    let raf = 0;
    const sweep = () => {
      raf = 0;
      const vh = window.innerHeight;
      nodes.forEach((node) => {
        if (!node.classList.contains("is-revealed") && node.getBoundingClientRect().top < vh * 0.92) reveal(node);
      });
    };
    const onScroll = () => { if (!raf) raf = window.requestAnimationFrame(sweep); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    sweep();
    return () => { observer.disconnect(); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) window.cancelAnimationFrame(raf); };
  }, []);

  if (supportView === "loading") {
    return <CoffeeLoading onComplete={() => navigate({ to: "/support" })} />;
  }

  const playMeow = () => {
    setMeowing(true);
    setWalkMs(400);
    setCatMode("catch");
    window.setTimeout(() => setMeowing(false), 1500);
    playSyntheticMeow();
  };

  const playSyntheticMeow = () => {
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(620, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(850, context.currentTime + 0.12);
    oscillator.frequency.exponentialRampToValueAtTime(430, context.currentTime + 0.48);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.52);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.55);
  };

  return (
    <main className="min-h-dvh overflow-hidden bg-background text-foreground">
      <div className="scroll-progress" aria-hidden="true"><div ref={progressRef} /></div>
      <div className={`float-nav ${navOn ? "is-on" : ""}`} aria-hidden={!navOn} inert={!navOn ? true : undefined}>
        <a href="#top" className="float-brand" aria-label="Back to top"><img src="/favicon.png" alt="" /><span>Astra</span></a>
        <nav aria-label="Quick navigation">
          <a href="#screens" className={activeSection === "screens" ? "on" : ""}>Screens</a>
          <a href="#features" className={activeSection === "features" ? "on" : ""}>Features</a>
          <a href="#tv" className={activeSection === "tv" ? "on" : ""}>TV</a>
          <a href="#faq" className={activeSection === "faq" ? "on" : ""}>FAQ</a>
        </nav>
        <a href="#get" className="float-cta"><Download size={15} /> Download</a>
      </div>
      <header className="site-header">
        <a href="#top" className="brand-lockup" aria-label="Astra Music home">
          <img src="/favicon.png" alt="" className="brand-mark" />
          <span>Astra</span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#screens">Screens</a><a href="#features">Features</a><a href="#tv">Astra TV</a><a href="#faq">FAQ</a>
          <Link to="/support" search={{ tab: "feedback" }}>Rate us</Link>
        </nav>
      </header>

      <section id="top" className="hero-section is-revealed" data-reveal>
        <div className="hero-copy">
          <h1>Music that moves you.<br /><em><span className="nowrap">No ads.</span> <span className="nowrap">No limits.</span></em></h1>
          <p>Astra brings discovery, search, playback and your library into one joyful music experience—without the clutter.</p>
          <div className="hero-actions">
            <a className={`primary-download ${wait !== null ? "is-waiting" : ""}`} href={DOWNLOAD_URL} onClick={wait === null ? trackDownload : (e) => e.preventDefault()} aria-live="off">
              {wait !== null
                ? <span className="wait-label" aria-hidden="true">Your download starts automatically in <span className="nowrap"><b key={wait} className="wait-num">{wait}</b> sec</span></span>
                : started ? <><Check size={20} /> Download started</> : <><Download size={20} /> Download APK</>}
              <span className="sr-only" role="status" aria-live="polite">{wait !== null ? `Your download starts automatically in about ${Math.ceil(wait / 5) * 5} seconds` : started ? "Download started" : ""}</span>
              {wait !== null && <span className="wait-bar" aria-hidden="true"><b style={{ width: `${((WAIT_SECONDS - wait) / WAIT_SECONDS) * 100}%`, background: "#fff" }} /></span>}
            </a>
            <a className="secondary-link" href="#screens">See it in action <span>↓</span></a>
          </div>
          <div className="hero-stats" aria-label={`Over ${totalDownloads.toLocaleString("en-US")} downloads and ${totalRatings.toLocaleString("en-US")} ratings`}>
            <div><strong className="count-up"><span className="cu-ghost" aria-hidden="true">{totalDownloads.toLocaleString("en-US")}+</span><span className="cu-live" aria-hidden="true">{shownDownloads.toLocaleString("en-US")}+</span></strong><span>Downloads</span></div>
            <div><strong className="count-up"><span className="cu-ghost" aria-hidden="true">{totalRatings.toLocaleString("en-US")}+</span><span className="cu-live" aria-hidden="true">{shownRatings.toLocaleString("en-US")}+</span></strong><span>Ratings</span></div>
          </div>
          <ul className="trust-chips" aria-label="Why you can trust this download">
            <li><ShieldCheck size={15} /> Official GitHub release</li>
            <li><Download size={15} /> Free, no ads</li>
            <li><Users size={15} /> Jam: listen together</li>
          </ul>
        </div>
        <div className="hero-art" ref={heroArtRef} aria-label="Astra Music app preview">
          <div className="burst burst-one" /><div className="burst burst-two" />
          <span className="note-fly nf1" aria-hidden="true">♪</span><span className="note-fly nf2" aria-hidden="true">♫</span><span className="note-fly nf3" aria-hidden="true">♪</span><span className="note-fly nf4" aria-hidden="true">♫</span>
          <svg className="spin-badge" viewBox="0 0 120 120" aria-hidden="true">
            <defs><path id="badge-circle" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" /></defs>
            <circle cx="60" cy="60" r="58" className="sb-bg" />
            <text className="sb-text"><textPath href="#badge-circle" startOffset="0">FREE ✦ NO ADS ✦ FOREVER ✦ FREE ✦ NO ADS ✦ FOREVER ✦</textPath></text>
            <path className="sb-note" d="M52 78V44l26-6v34" /><circle cx="46" cy="79" r="7" className="sb-dot" /><circle cx="72" cy="73" r="7" className="sb-dot" />
          </svg>
          <div className="hero-phone"><img src={playerImage} alt="Astra Music immersive player showing Dance Again" /></div>
          <div className="floating-note">♪</div>
          <div className="playing-chip"><span className="equalizer"><i /><i /><i /></span><div><small>NOW PLAYING</small><strong>Dance Again</strong></div></div>
        </div>
      </section>


      <div className="ticker" ref={tickerRef} aria-hidden="true">
        <div className="ticker-row ticker-a"><div className="ticker-track">{[0, 1, 2, 3].map((k) => <div key={k}>{TICKER.map((t) => <span key={`${k}${t}`}>{t}<i>✦</i></span>)}</div>)}</div></div>
        <div className="ticker-row ticker-b"><div className="ticker-track">{[0, 1, 2, 3].map((k) => <div key={k}>{[...TICKER].reverse().map((t) => <span key={`${k}${t}`}>{t}<i>✺</i></span>)}</div>)}</div></div>
      </div>

      <section id="screens" className="screens-section" data-reveal>
        <div className="section-title-row">
          <div><span className="section-kicker">Inside Astra</span><h2><Words text="Every screen, in rhythm." /></h2></div>
          <p>From discovery to your daily rotation, everything stays beautifully within reach.</p>
        </div>
        <div className="marquee" aria-label="Astra Music screenshots moving from right to left">
          <div className="marquee-track">
            {[...screenshots, ...screenshots].map((shot, index) => (
              <figure className={`screen-frame screen-${index % 7}`} key={`${shot.alt}-${index}`} aria-hidden={index >= screenshots.length || undefined}>
                <img src={shot.src} alt={index < screenshots.length ? shot.alt : ""} loading="eager" decoding="async" />
                <figcaption><span>{String((index % screenshots.length) + 1).padStart(2, "0")}</span>{shot.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="features-section" data-reveal>
        <div className="section-title-row compact"><div><span className="section-kicker">Made to feel effortless</span><h2><Words text="Just press play." /></h2></div></div>
        <div className="feature-list" onPointerMove={onCardMove} onPointerLeave={onCardLeave}>
          <article className="feature-card dark-card wide-card" data-reveal data-fx="up"><div className="feature-icon"><Sparkles /></div><div><h3>Fresh discovery</h3><p>Playlists and recommendations that make finding your next favorite feel natural.</p></div><span className="feature-number">01</span></article>
          <article className="feature-card aqua-card" data-reveal data-fx="left"><div className="feature-icon"><Search /></div><div><h3>Find it fast</h3><p>Search artists, albums and songs without digging through a crowded interface.</p></div><span className="feature-number">02</span></article>
          <article className="feature-card yellow-card" data-reveal data-fx="right"><div className="feature-icon"><Headphones /></div><div><h3>Immersive player</h3><p>Lyrics, queue and essential controls stay close while the music takes center stage.</p></div><span className="feature-number">03</span></article>
          <article className="feature-card lilac-card" data-reveal data-fx="left"><div className="feature-icon"><Library /></div><div><h3>Your library</h3><p>Liked songs, downloads, playlists and local files—organized around you.</p></div><span className="feature-number">04</span></article>
          <article className="feature-card coral-card" data-reveal data-fx="right"><div className="feature-icon"><Ban /></div><div><h3>Free, no ads</h3><p>Free to use, with no ads getting in the way of your music.</p></div><span className="feature-number">05</span></article>
          <article className="feature-card aqua-card wide-card" data-reveal data-fx="up"><div className="feature-icon"><Users /></div><div><h3>Listen together</h3><p>Start a Jam, share the link, and everyone hears the same song at the same moment.</p></div><span className="feature-number">06</span></article>
          <article className="feature-card dark-card wide-card" data-reveal data-fx="up"><div className="feature-icon"><ShieldCheck /></div><div><h3>Official release</h3><p>The APK comes straight from the official GitHub release.</p></div><span className="feature-number">07</span></article>
        </div>
      </section>

      <section id="tv" className="tv-section" data-reveal>
        <div className="tv-copy">
          <span className="tv-badge"><Tv size={14} /> New · Astra TV</span>
          <h2><Words text="Big screen. Bigger sound." /></h2>
          <p>Astra now has a home on your TV. Put on a song, sit back, and let the whole room hear it, controlled with nothing but your remote.</p>
          <ul className="tv-points">
            <li><Check size={16} /> Made for Android TV</li>
            <li><Check size={16} /> Simple, remote-friendly controls</li>
            <li><Check size={16} /> Free, no ads</li>
          </ul>
          <div className="tv-actions">
            <a className="tv-download" href={TV_DOWNLOAD_URL} onClick={trackDownload} aria-label="Download Astra TV APK">
              <span className="tv-dl-icon"><Tv size={22} /></span>
              <span className="tv-dl-text"><small>Download now</small><strong>Astra TV</strong></span>
              <Download size={20} className="tv-dl-arrow" />
            </a>
            <button type="button" className="tv-copy-link" onClick={copyTvLink}>{tvCopied ? <><Check size={15} /> Link copied</> : <><Copy size={15} /> Copy link for your TV</>}</button>
          </div>
          <p className="tv-hint"><ShieldCheck size={14} /> Official release · Open this page on your TV browser, or paste the copied link into a downloader app.</p>
        </div>
        <div className="tv-stage" aria-hidden="true">
          <div className="tv-glow" />
          <div className="tv-frame">
            <div className="tv-screen">
              <div className="tv-ring tv-ring-a" /><div className="tv-ring tv-ring-b" />
              <img src="/favicon.png" alt="" className="tv-logo" />
              <strong>Astra TV</strong>
              <span className="tv-eq"><i /><i /><i /><i /><i /><i /><i /></span>
            </div>
          </div>
          <div className="tv-stand" />
          <div className="tv-remote"><i /><b /><b /><b /></div>
        </div>
      </section>

      <section id="get" className="download-band" data-reveal>
        <div className="band-live" aria-hidden="true"><video poster={livePoster} autoPlay muted loop playsInline preload="auto"><source src={liveVideoWebm} type="video/webm" /><source src={liveVideo} type="video/mp4" /></video></div>
        <div className="download-copy"><img src="/favicon.png" alt="" /><div><span>ASTRA MUSIC FOR ANDROID</span><h2><Words text="Turn up your everyday." /></h2><p>Pick your screen and start listening: Astra for your phone, Astra TV for the big screen.</p></div></div>
        <div className="download-side">
          <a className="band-download" href={DOWNLOAD_URL} onClick={bottomDownload}><Smartphone size={20} /> Astra for phone</a>
          <a className="band-download band-tv" href={TV_DOWNLOAD_URL} onClick={trackDownload}><Tv size={20} /> Astra TV</a>
          <span><ShieldCheck size={14} /> Latest official release</span>
          <Link className="rate-link" to="/support" search={{ tab: "feedback" }}><Star size={14} /> Loved it? Rate Astra</Link>
        </div>
      </section>

      <section id="faq" className="faq-section" data-reveal>
        <div><span className="section-kicker">Good to know</span><h2><Words text="Quick answers." /></h2></div>
        <div className="faq-list">
          <details><summary>What is Astra Music?<span aria-hidden="true">+</span></summary><p>Astra Music is a free Android music player app for discovering songs, playing music and building your personal library.</p></details>
          <details><summary>How do I download Astra Music APK?<span aria-hidden="true">+</span></summary><p>Tap any Download APK button on this page. The latest official Astra Music APK for Android (arm64-v8a) downloads directly from the official GitHub release.</p></details>
          <details><summary>Is Astra Music free?<span aria-hidden="true">+</span></summary><p>Yes. Astra Music is free to download and use.</p></details>
          <details><summary>Does Astra need an account?<span aria-hidden="true">+</span></summary><p>Account requirements depend on the services and features available in the current build.</p></details>
          <details><summary>What is Jam?<span aria-hidden="true">+</span></summary><p>Jam lets you listen together with friends. One person starts a Jam and shares a 6-character code or link; everyone who joins plays the same song in sync.</p></details>
          <details><summary>Is there an Astra TV app?<span aria-hidden="true">+</span></summary><p>Yes. Astra TV is a separate APK made for the big screen. Use the Astra TV button on this page to download the latest official build.</p></details>
          <details><summary>Is it safe to install?<span aria-hidden="true">+</span></summary><p>The APK comes straight from the developer's official GitHub release. Android shows a standard warning for any APK installed outside the Play Store. You can scan the file with VirusTotal first and read the Privacy Policy and Terms linked in the footer.</p></details>
          <details><summary>Which Android versions are supported?<span aria-hidden="true">+</span></summary><p>Check the latest release information before installing to confirm compatibility with your device.</p></details>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand"><img src="/favicon.png" alt="" /><div><strong>Astra Music</strong><span>Music feels better here.</span></div></div>
        <div className="footer-links"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/support" search={{ tab: "feedback" }}>Rate &amp; Feedback</Link><Link to="/contact">Developer Support</Link></div>
        <span className="copyright">© 2026 Astra Music · Made for Android</span>
      </footer>

      <aside className={`coffee-charm ${coffeeVisible ? "is-visible" : ""}`} aria-hidden={!coffeeVisible} inert={!coffeeVisible ? true : undefined}>
        <div className="cat-stage" style={{ "--k": catPos, "--f": catFace, "--walk": `${walkMs}ms` } as React.CSSProperties} aria-hidden="true">
          <span className="drift-heart d1"><Heart /></span><span className="drift-heart d2"><Heart /></span><span className="drift-heart d3"><Heart /></span><span className="drift-heart d4"><Heart /></span>
          <button type="button" className={`cat-walker cat-${catMode} ${meowing ? "is-meowing" : ""}`} onClick={playMeow} tabIndex={-1}>
            <span className={`meow-bubble ${meowing ? "show" : ""}`}>meow!</span>
            <span className="catch-heart"><Heart /></span>
            <span className="catch-burst"><i><Heart /></i><i><Heart /></i><i><Heart /></i><i><Heart /></i></span>
            <span className="cat-body"><span className="cat-flip">
              <span className="px px-tail"><img src="/astra-cat-tail.png" alt="" draggable={false} /></span>
              <span className="px px-torso">
                <img className="px-body" src="/astra-cat-body.png" alt="" draggable={false} />
                <span className="px px-head"><img src="/astra-cat-head.png" alt="" draggable={false} /><i className="lid lid-l" /><i className="lid lid-r" /><i className="mouth-o" /></span>
              </span>
            </span></span>
            <span className="sleep-mark sleep-mark-one">z</span>
            <span className="sleep-mark sleep-mark-two">z</span>
          </button>
        </div>
        <div className="note-wrap">
        <button type="button" className="coffee-note" onClick={openSupport} aria-label={SUPPORT_NOTE}>
          <span className="note-ghost" aria-hidden="true">{SUPPORT_NOTE}</span>
          <span className="note-typed" aria-hidden="true">{typed}<i className={`note-caret ${typed.length >= Array.from(SUPPORT_NOTE).length ? "done" : ""}`} /></span>
        </button>
        <button type="button" className="support-orb" onClick={openSupport} aria-label="Support the developer with a coffee">
          <img src="/astra-dev.jpg" alt="" width={256} height={256} loading="lazy" />
          <span className="orb-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="15" height="15"><path className="steam-a" d="M8 6c-1-1.2 1-2 0-3.4M12 6c-1-1.2 1-2 0-3.4" /><path d="M5 9h11v5.2A4.8 4.8 0 0 1 11.2 19H9.8A4.8 4.8 0 0 1 5 14.2Z" className="cup" /><path d="M16 10.2h1.300a2.300 2.300 0 0 1 0 4.600H15.800" className="cup-handle" /><path d="M4 21h14" className="cup-handle" /></svg>
          </span>
        </button>
        </div>
      </aside>
    </main>
  );
}

function CoffeeLoading({ onComplete }: { onComplete: () => void }) {
  const [seconds, setSeconds] = useState(4);
  const completed = useRef(false);
  // keep the latest callback in a ref so parent re-renders (countdown, stats polling) never restart the 4s timer
  const done = useRef(onComplete);
  done.current = onComplete;
  const finish = () => { if (completed.current) return; completed.current = true; done.current(); };

  useEffect(() => {
    const startedAt = Date.now();
    const interval = window.setInterval(() => setSeconds(Math.max(0, 4 - Math.floor((Date.now() - startedAt) / 1000))), 200);
    const timeout = window.setTimeout(finish, 4000);
    return () => { window.clearInterval(interval); window.clearTimeout(timeout); };
  }, []);

  return (
    <main className="coffee-loading">
      <div className="steam" aria-hidden="true"><i /><i /><i /></div>
      <div className="loading-cup" aria-hidden="true"><span /></div>
      <p>A little warmth for Astra</p>
      <h1>Brewing your support space…</h1>
      <div className="brew-track"><span /></div>
      <button type="button" className="skip-button" onClick={finish}>Skip <span>{seconds}s</span></button>
    </main>
  );
}

declare global {
  interface Window { webkitAudioContext?: typeof AudioContext }
}
