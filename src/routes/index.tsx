import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPublicStats } from "@/lib/stats.functions";
import { ArrowDownToLine, Check, Download, Headphones, Library, Search, ShieldCheck, Smartphone, Sparkles, Star, Tv, Users, Ban } from "lucide-react";
import homeImage from "@/assets/astra-app-home-real.jpg";
import libraryImage from "@/assets/astra-app-library-real.jpg";
import exploreImage from "@/assets/astra-app-explore-real.jpg";
import suggestionsImage from "@/assets/astra-app-suggestions-real.jpg";
import resultsImage from "@/assets/astra-app-results-real.jpg";
import playerImage from "@/assets/astra-app-player-real.jpg";
import lyricsImage from "@/assets/astra-app-lyrics-real.jpg";
import livePoster from "@/assets/astra-download-live-poster.jpg";

// Starting totals confirmed by the developer; real downloads/ratings from this site are added on top.
// Keep these equal to genuine counts only. Update them as the real totals grow.
const BASE_DOWNLOADS = 20000;
const BASE_RATINGS = 1984;

const SUPPORT_NOTE = "Hi! If you love Astra Music, consider supporting my work! ☕";
const DOWNLOAD_URL = "https://github.com/shivam-s01/Aurum-app/releases/latest/download/astra-music-arm64-v8a-release.apk";
// Astra TV: resolved server-side to the newest Astra TV APK (see src/routes/api/public/download.ts)
const TV_DOWNLOAD_URL = "/api/public/download?device=tv";
const WAIT_SECONDS = 25;

const fmt = (n: number) => n.toLocaleString("en-US");
// "lite" is set on <html> before first paint for weak devices and TVs (see __root.tsx): no ambient animation, no parallax.
const isLite = () => typeof document !== "undefined" && document.documentElement.classList.contains("lite");

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
    scripts: [{ type: "application/ld+json", children: JSON.stringify([{"@context": "https://schema.org", "@type": "WebSite", "name": "Astra Music", "alternateName": ["Astra Music Download", "Astra Music APK"], "url": "https://astra.mmusic.workers.dev/"}, {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Astra Music", "operatingSystem": "Android", "applicationCategory": "MusicApplication", "description": "Download Astra Music for Android — a free, focused music player for discovery, playback and your personal library.", "url": "https://astra.mmusic.workers.dev/", "downloadUrl": "https://astra.mmusic.workers.dev/api/public/download", "image": "https://astra.mmusic.workers.dev/astra-share-cover.jpg", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}}, {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "What is Astra Music?", "acceptedAnswer": {"@type": "Answer", "text": "Astra Music is a free Android music player app for discovering songs, playing music and building your personal library."}}, {"@type": "Question", "name": "How do I download Astra Music APK?", "acceptedAnswer": {"@type": "Answer", "text": "Tap any Download APK button on this page. The latest official Astra Music APK for Android (arm64-v8a) downloads directly from the official GitHub release."}}, {"@type": "Question", "name": "Is Astra Music free?", "acceptedAnswer": {"@type": "Answer", "text": "Yes. Astra Music is free to download and use."}}, {"@type": "Question", "name": "Does Astra need an account?", "acceptedAnswer": {"@type": "Answer", "text": "Account requirements depend on the services and features available in the current build."}}, {"@type": "Question", "name": "What is Jam?", "acceptedAnswer": {"@type": "Answer", "text": "Jam lets you listen together with friends. One person starts a Jam and shares a code or link, and everyone who joins plays the same song in sync."}}, {"@type": "Question", "name": "Is there an Astra TV app?", "acceptedAnswer": {"@type": "Answer", "text": "Yes. Astra TV is a separate APK made for the big screen. Use the Download Astra TV link on this page to get the latest official build."}}, {"@type": "Question", "name": "Is it safe to install?", "acceptedAnswer": {"@type": "Answer", "text": "The APK comes straight from the developer's official GitHub release. Android shows a standard warning for any APK installed outside the Play Store."}}, {"@type": "Question", "name": "Which Android versions are supported?", "acceptedAnswer": {"@type": "Answer", "text": "Check the latest release information before installing to confirm compatibility with your device."}}]}]) }],
  }),
  component: AstraPage,
});

// Counts a real download click (once per visitor per 10 minutes) and tells the page so the counter can move.
function trackDownload() {
  try {
    let id = localStorage.getItem("astra_vid");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("astra_vid", id); }
    const last = Number(localStorage.getItem("astra_last_dl") || 0);
    if (Date.now() - last < 10 * 60 * 1000) return; // already counted recently
    localStorage.setItem("astra_last_dl", String(Date.now()));
    window.dispatchEvent(new Event("astra:download-counted"));
    const body = JSON.stringify({ visitorId: id });
    // sendBeacon survives the page starting the APK download / navigating away
    const sent = typeof navigator.sendBeacon === "function" && navigator.sendBeacon("/api/public/track-download", new Blob([body], { type: "text/plain" }));
    if (!sent) fetch("/api/public/track-download", { method: "POST", body, keepalive: true }).catch(() => {});
  } catch { /* storage blocked: skip */ }
}

function Heart() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.2S3.2 15.700 2.600 9.600C2.300 6.300 4.500 4 7.300 4c1.900 0 3.700 1 4.700 2.800C13 5 14.800 4 16.700 4c2.800 0 5 2.300 4.700 5.600-.6 6.100-9.400 11.600-9.400 11.600Z" /></svg>;
}

// Splits a heading into words that rise out of a mask one after another when the section is revealed.
function Words({ text }: { text: string }) {
  return <>{text.split(" ").map((w, i, a) => (
    <span key={i}><span className="wd" style={{ "--w": i } as React.CSSProperties}><span>{w}</span></span>{i < a.length - 1 ? " " : ""}</span>
  ))}</>;
}

// Number that counts up. It writes straight to the DOM, so the 60 frames of the animation never re-render React.
function CountUp({ value, ms = 1900 }: { value: number; ms?: number }) {
  const liveRef = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  const started = useRef(false);
  useEffect(() => {
    const el = liveRef.current;
    if (!el) return;
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || isLite()) { shown.current = value; el.textContent = `${fmt(value)}+`; started.current = true; return; }
    const from = started.current ? shown.current : 0;
    const dur = started.current ? 700 : ms;
    started.current = true;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const v = Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3)));
      shown.current = v;
      el.textContent = `${fmt(v)}+`;
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return (
    <strong className="count-up">
      <span className="cu-ghost" aria-hidden="true">{`${fmt(value)}+`}</span>
      <span className="cu-live" ref={liveRef} aria-hidden="true">{`${fmt(value)}+`}</span>
    </strong>
  );
}

function HeroStats() {
  const fetchStats = useServerFn(getPublicStats);
  const [live, setLive] = useState({ downloads: 0, ratingCount: 0, ratingSum: 0 });
  useEffect(() => {
    let alive = true;
    const load = () => { if (document.visibilityState === "visible") fetchStats().then((s) => { if (alive) setLive(s); }).catch(() => {}); };
    load();
    const t = window.setInterval(load, 60000);
    document.addEventListener("visibilitychange", load);
    return () => { alive = false; window.clearInterval(t); document.removeEventListener("visibilitychange", load); };
  }, [fetchStats]);
  useEffect(() => {
    const bump = () => setLive((s) => ({ ...s, downloads: s.downloads + 1 }));
    window.addEventListener("astra:download-counted", bump);
    return () => window.removeEventListener("astra:download-counted", bump);
  }, []);
  const downloads = BASE_DOWNLOADS + live.downloads;
  const ratings = BASE_RATINGS + live.ratingCount;
  return (
    <div className="hero-stats" aria-label={`Over ${fmt(downloads)} downloads and ${fmt(ratings)} ratings`}>
      <div><CountUp value={downloads} /><span>Downloads</span></div>
      <div><CountUp value={ratings} ms={2200} /><span>Ratings</span></div>
    </div>
  );
}

// Hero button: the countdown starts when the page opens, then the download starts automatically.
// The bottom button downloads instantly and cancels the countdown so nothing downloads twice.
// The timer lives in this small component, so each second re-renders only the button.
function HeroDownload() {
  const [wait, setWait] = useState<number | null>(WAIT_SECONDS);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const stop = () => setWait(null);
    window.addEventListener("astra:stop-countdown", stop);
    return () => window.removeEventListener("astra:stop-countdown", stop);
  }, []);
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
  return (
    <a className={`primary-download ${wait !== null ? "is-waiting" : ""}`} href={DOWNLOAD_URL} onClick={wait === null ? trackDownload : (e) => e.preventDefault()} aria-live="off">
      {wait !== null
        ? <span className="wait-label" aria-hidden="true">Your download starts automatically in <span className="nowrap"><b className="wait-num">{wait}</b> sec</span></span>
        : started ? <><Check size={20} /> Download started</> : <><Download size={20} /> Download APK</>}
      <span className="sr-only" role="status" aria-live="polite">{wait !== null ? `Your download starts automatically in about ${Math.ceil(wait / 5) * 5} seconds` : started ? "Download started" : ""}</span>
      {wait !== null && <span className="wait-bar" aria-hidden="true"><b style={{ width: `${((WAIT_SECONDS - wait) / WAIT_SECONDS) * 100}%` }} /></span>}
    </a>
  );
}

// Astra TV download: same button family as the main download, in the dark card colour so the two never compete.
function TvDownload({ onBand = false }: { onBand?: boolean }) {
  return (
    <a className={`tv-download ${onBand ? "on-band" : ""}`} href={TV_DOWNLOAD_URL} onClick={trackDownload}>
      <span className="tv-chip" aria-hidden="true"><Tv size={20} /></span>
      <span className="tv-text"><small>For Android TV</small><strong>Download Astra TV</strong></span>
      <ArrowDownToLine className="tv-arrow" size={19} aria-hidden="true" />
    </a>
  );
}

// All scroll work in one place. It touches the DOM directly (class and style writes) and never calls setState,
// so scrolling does not re-render React. Parallax and reveals are skipped on weak devices and TVs ("lite").
function SiteEffects() {
  useEffect(() => {
    const lite = isLite();
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bar = document.querySelector<HTMLElement>(".scroll-progress > div");
    const nav = document.querySelector<HTMLElement>(".float-nav");
    const art = document.querySelector<HTMLElement>(".hero-art");
    const links = Array.from(document.querySelectorAll<HTMLElement>(".float-nav [data-sec]"));
    let max = 1;
    let navOn = false;
    let raf = 0;
    const measure = () => { max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); };
    const frame = () => {
      raf = 0;
      const y = window.scrollY;
      if (bar) bar.style.transform = `scaleX(${Math.min(1, y / max).toFixed(3)})`;
      const on = y > 480;
      if (on !== navOn && nav) {
        navOn = on;
        nav.classList.toggle("is-on", on);
        nav.setAttribute("aria-hidden", String(!on));
        nav.toggleAttribute("inert", !on);
      }
      if (art && !lite && !reduce && y < 1000) art.style.setProperty("--sy", String(Math.round(y)));
      if (pending.length) sweep();
    };
    const onScroll = () => { if (!raf) raf = window.requestAnimationFrame(frame); };

    // reveal-on-scroll
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-revealed)"));
    let pending = nodes;
    const reveal = (el: Element) => el.classList.add("is-revealed");
    const sweep = () => {
      const vh = window.innerHeight;
      pending = pending.filter((n) => {
        if (n.getBoundingClientRect().top < vh * 0.92) { reveal(n); return false; }
        return true;
      });
    };
    let revealIO: IntersectionObserver | null = null;
    if (lite || reduce || typeof IntersectionObserver === "undefined") {
      nodes.forEach(reveal);
      pending = [];
    } else {
      revealIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          // reveal when visible OR when it was scrolled past quickly (already above the viewport)
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
            reveal(entry.target);
            pending = pending.filter((n) => n !== entry.target);
            revealIO?.unobserve(entry.target);
          }
        });
      }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
      nodes.forEach((n) => revealIO?.observe(n));
    }

    // which section is on screen (nav highlight), without measuring layout on every scroll
    let sectionIO: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined" && links.length) {
      sectionIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = (entry.target as HTMLElement).id;
          links.forEach((a) => a.classList.toggle("on", a.dataset.sec === id));
        });
      }, { rootMargin: "-40% 0px -55% 0px" });
      ["top", "screens", "features", "faq"].forEach((id) => { const el = document.getElementById(id); if (el) sectionIO?.observe(el); });
    }

    // feature-card tilt + spotlight: fine pointers only
    const list = document.querySelector<HTMLElement>(".feature-list");
    const fine = !lite && !reduce && typeof window.matchMedia === "function" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>(".feature-card");
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      card.style.setProperty("--ry", `${((px - 0.5) * 6).toFixed(2)}deg`);
      card.style.setProperty("--rx", `${((0.5 - py) * 6).toFixed(2)}deg`);
    };
    const onLeave = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>(".feature-card");
      card?.style.setProperty("--rx", "0deg");
      card?.style.setProperty("--ry", "0deg");
    };
    if (fine && list) { list.addEventListener("pointermove", onMove, { passive: true }); list.addEventListener("pointerout", onLeave, { passive: true }); }

    measure();
    frame();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => { measure(); onScroll(); }) : null;
    ro?.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
      ro?.disconnect();
      revealIO?.disconnect();
      sectionIO?.disconnect();
      if (fine && list) { list.removeEventListener("pointermove", onMove); list.removeEventListener("pointerout", onLeave); }
    };
  }, []);
  return null;
}

function playSyntheticMeow() {
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
  oscillator.onended = () => { context.close().catch(() => {}); };
}

// The cat + support note. Its animation timers live here, so they never re-render the page.
function CoffeeCharm({ onOpen }: { onOpen: () => void }) {
  const [visible, setVisible] = useState(false);
  const [meowing, setMeowing] = useState(false);
  type CatMode = "sit" | "walk" | "look" | "catch" | "groove" | "sleep" | "wake";
  const [catMode, setCatMode] = useState<CatMode>("sit");
  const [catPos, setCatPos] = useState(0.1);
  const [catFace, setCatFace] = useState(1);
  const [walkMs, setWalkMs] = useState(1900);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const faq = document.getElementById("faq");
    let faqNear = false;
    let raf = 0;
    const update = () => { raf = 0; const next = window.scrollY > 90 && !faqNear; setVisible((v) => (v === next ? v : next)); };
    const onScroll = () => { if (!raf) raf = window.requestAnimationFrame(update); };
    let io: IntersectionObserver | null = null;
    if (faq && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((entries) => { entries.forEach((e) => { faqNear = e.isIntersecting; }); onScroll(); }, { rootMargin: "0px 0px -40% 0px" });
      io.observe(faq);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); io?.disconnect(); if (raf) window.cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    if (!visible || isLite()) return;
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
  }, [visible]);

  useEffect(() => {
    const chars = Array.from(SUPPORT_NOTE);
    if (!visible) { setTyped(""); return; }
    if (isLite() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setTyped(SUPPORT_NOTE); return; }
    let i = 0;
    let timer = 0;
    const tick = () => {
      i += 1;
      setTyped(chars.slice(0, i).join(""));
      if (i < chars.length) timer = window.setTimeout(tick, /[,!]/.test(chars[i - 1]) ? 240 : 46 + Math.round(Math.random() * 26));
    };
    timer = window.setTimeout(tick, 700);
    return () => window.clearTimeout(timer);
  }, [visible]);

  const playMeow = () => {
    setMeowing(true);
    setWalkMs(400);
    setCatMode("catch");
    window.setTimeout(() => setMeowing(false), 1500);
    playSyntheticMeow();
  };

  return (
    <aside className={`coffee-charm ${visible ? "is-visible" : ""}`} aria-hidden={!visible} inert={!visible ? true : undefined}>
      <div className="cat-stage" style={{ "--k": catPos, "--f": catFace, "--walk": `${walkMs}ms` } as React.CSSProperties} aria-hidden="true">
        <span className="drift-heart d1"><Heart /></span><span className="drift-heart d2"><Heart /></span><span className="drift-heart d3"><Heart /></span><span className="drift-heart d4"><Heart /></span>
        <button type="button" className={`cat-walker cat-${catMode} ${meowing ? "is-meowing" : ""}`} onClick={playMeow} tabIndex={-1}>
          <span className={`meow-bubble ${meowing ? "show" : ""}`}>meow!</span>
          <span className="catch-heart"><Heart /></span>
          <span className="catch-burst"><i><Heart /></i><i><Heart /></i><i><Heart /></i><i><Heart /></i></span>
          <span className="cat-body"><span className="cat-flip">
            <span className="px px-tail"><img src="/astra-cat-tail.png" alt="" draggable={false} loading="lazy" /></span>
            <span className="px px-torso">
              <img className="px-body" src="/astra-cat-body.png" alt="" draggable={false} loading="lazy" />
              <span className="px px-head"><img src="/astra-cat-head.png" alt="" draggable={false} loading="lazy" /><i className="lid lid-l" /><i className="lid lid-r" /><i className="mouth-o" /></span>
            </span>
          </span></span>
          <span className="sleep-mark sleep-mark-one">z</span>
          <span className="sleep-mark sleep-mark-two">z</span>
        </button>
      </div>
      <div className="note-wrap">
        <button type="button" className="coffee-note" onClick={onOpen} aria-label={SUPPORT_NOTE}>
          <span className="note-ghost" aria-hidden="true">{SUPPORT_NOTE}</span>
          <span className="note-typed" aria-hidden="true">{typed}<i className={`note-caret ${typed.length >= Array.from(SUPPORT_NOTE).length ? "done" : ""}`} /></span>
        </button>
        <button type="button" className="support-orb" onClick={onOpen} aria-label="Support the developer with a coffee">
          <img src="/astra-dev.jpg" alt="" width={256} height={256} loading="lazy" />
          <span className="orb-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="15" height="15"><path className="steam-a" d="M8 6c-1-1.2 1-2 0-3.4M12 6c-1-1.2 1-2 0-3.4" /><path d="M5 9h11v5.2A4.8 4.8 0 0 1 11.2 19H9.8A4.8 4.8 0 0 1 5 14.2Z" className="cup" /><path d="M16 10.2h1.300a2.300 2.300 0 0 1 0 4.600H15.800" className="cup-handle" /><path d="M4 21h14" className="cup-handle" /></svg>
          </span>
        </button>
      </div>
    </aside>
  );
}

function AstraPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (loading) {
    return <CoffeeLoading onComplete={() => navigate({ to: "/support" })} />;
  }

  const bottomDownload = () => { window.dispatchEvent(new Event("astra:stop-countdown")); trackDownload(); };

  return (
    <main className="min-h-dvh overflow-hidden bg-background text-foreground">
      <SiteEffects />
      <div className="scroll-progress" aria-hidden="true"><div /></div>
      <div className="float-nav" aria-hidden="true" inert>
        <a href="#top" className="float-brand" aria-label="Back to top"><img src="/favicon.png" alt="" width={28} height={28} /><span>Astra</span></a>
        <nav aria-label="Quick navigation">
          <a href="#screens" data-sec="screens">Screens</a>
          <a href="#features" data-sec="features">Features</a>
          <a href="#faq" data-sec="faq">FAQ</a>
        </nav>
        <a href="#get" className="float-cta"><Download size={15} /> Download</a>
      </div>
      <header className="site-header">
        <a href="#top" className="brand-lockup" aria-label="Astra Music home">
          <img src="/favicon.png" alt="" className="brand-mark" width={42} height={42} />
          <span>Astra</span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#screens">Screens</a><a href="#features">Features</a><a href="#faq">FAQ</a>
          <Link to="/support" search={{ tab: "feedback" }}>Rate us</Link>
        </nav>
      </header>

      <section id="top" className="hero-section is-revealed" data-reveal>
        <div className="hero-copy">
          <h1>Music that moves you.<br /><em><span className="nowrap">No ads.</span> <span className="nowrap">No limits.</span></em></h1>
          <p>Astra brings discovery, search, playback and your library into one joyful music experience—without the clutter.</p>
          <div className="hero-actions">
            <div className="hero-downloads">
              <HeroDownload />
              <TvDownload />
            </div>
            <a className="secondary-link" href="#screens">See it in action <span>↓</span></a>
          </div>
          <HeroStats />
          <ul className="trust-chips" aria-label="Why you can trust this download">
            <li><ShieldCheck size={15} /> Official GitHub release</li>
            <li><Download size={15} /> Free, no ads</li>
            <li><Users size={15} /> Jam: listen together</li>
          </ul>
        </div>
        <div className="hero-art" aria-label="Astra Music app preview">
          <div className="burst burst-one" /><div className="burst burst-two" />
          <div className="hero-phone"><img src={playerImage} alt="Astra Music immersive player showing Dance Again" fetchPriority="high" decoding="async" /></div>
          <div className="floating-note">♪</div>
          <div className="playing-chip"><span className="equalizer"><i /><i /><i /></span><div><small>NOW PLAYING</small><strong>Dance Again</strong></div></div>
        </div>
      </section>

      <section id="screens" className="screens-section" data-reveal>
        <div className="section-title-row">
          <div><span className="section-kicker">Inside Astra</span><h2><Words text="Every screen, in rhythm." /></h2></div>
          <p>From discovery to your daily rotation, everything stays beautifully within reach.</p>
        </div>
        <div className="marquee" aria-label="Astra Music screenshots">
          <div className="marquee-track">
            {[...screenshots, ...screenshots].map((shot, index) => (
              <figure className={`screen-frame screen-${index % 7}`} key={`${shot.alt}-${index}`} aria-hidden={index >= screenshots.length || undefined}>
                <img src={shot.src} alt={index < screenshots.length ? shot.alt : ""} loading={index < 4 ? "eager" : "lazy"} decoding="async" />
                <figcaption><span>{String((index % screenshots.length) + 1).padStart(2, "0")}</span>{shot.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="features-section" data-reveal>
        <div className="section-title-row compact"><div><span className="section-kicker">Made to feel effortless</span><h2><Words text="Just press play." /></h2></div></div>
        <div className="feature-list">
          <article className="feature-card dark-card wide-card" data-reveal data-fx="up"><div className="feature-icon"><Sparkles /></div><div><h3>Fresh discovery</h3><p>Playlists and recommendations that make finding your next favorite feel natural.</p></div><span className="feature-number">01</span></article>
          <article className="feature-card aqua-card" data-reveal data-fx="left"><div className="feature-icon"><Search /></div><div><h3>Find it fast</h3><p>Search artists, albums and songs without digging through a crowded interface.</p></div><span className="feature-number">02</span></article>
          <article className="feature-card yellow-card" data-reveal data-fx="right"><div className="feature-icon"><Headphones /></div><div><h3>Immersive player</h3><p>Lyrics, queue and essential controls stay close while the music takes center stage.</p></div><span className="feature-number">03</span></article>
          <article className="feature-card lilac-card" data-reveal data-fx="left"><div className="feature-icon"><Library /></div><div><h3>Your library</h3><p>Liked songs, downloads, playlists and local files—organized around you.</p></div><span className="feature-number">04</span></article>
          <article className="feature-card coral-card" data-reveal data-fx="right"><div className="feature-icon"><Ban /></div><div><h3>Free, no ads</h3><p>Free to use, with no ads getting in the way of your music.</p></div><span className="feature-number">05</span></article>
          <article className="feature-card aqua-card wide-card" data-reveal data-fx="up"><div className="feature-icon"><Users /></div><div><h3>Listen together</h3><p>Start a Jam, share the link, and everyone hears the same song at the same moment.</p></div><span className="feature-number">06</span></article>
          <article className="feature-card dark-card wide-card" data-reveal data-fx="up"><div className="feature-icon"><ShieldCheck /></div><div><h3>Official release</h3><p>The APK comes straight from the official GitHub release.</p></div><span className="feature-number">07</span></article>
        </div>
      </section>

      <section id="get" className="download-band" data-reveal>
        <div className="band-live" aria-hidden="true"><img src={livePoster} alt="" width={640} height={360} loading="lazy" decoding="async" /></div>
        <div className="download-copy"><img src="/favicon.png" alt="" width={86} height={86} /><div><span>ASTRA MUSIC FOR ANDROID</span><h2><Words text="Turn up your everyday." /></h2><p>Download the latest Astra APK and start listening.</p></div></div>
        <div className="download-side">
          <a className="band-download" href={DOWNLOAD_URL} onClick={bottomDownload}><Smartphone size={20} /> Download APK</a>
          <TvDownload onBand />
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
          <details><summary>Is there an Astra TV app?<span aria-hidden="true">+</span></summary><p>Yes. Astra TV is a separate APK made for the big screen. Use the Download Astra TV link on this page to get the latest official build.</p></details>
          <details><summary>Is it safe to install?<span aria-hidden="true">+</span></summary><p>The APK comes straight from the developer's official GitHub release. Android shows a standard warning for any APK installed outside the Play Store. You can scan the file with VirusTotal first and read the Privacy Policy and Terms linked in the footer.</p></details>
          <details><summary>Which Android versions are supported?<span aria-hidden="true">+</span></summary><p>Check the latest release information before installing to confirm compatibility with your device.</p></details>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand"><img src="/favicon.png" alt="" width={42} height={42} /><div><strong>Astra Music</strong><span>Music feels better here.</span></div></div>
        <div className="footer-links"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/support" search={{ tab: "feedback" }}>Rate &amp; Feedback</Link><Link to="/contact">Developer Support</Link></div>
        <span className="copyright">© 2026 Astra Music · Made for Android</span>
      </footer>

      <CoffeeCharm onOpen={() => setLoading(true)} />
    </main>
  );
}

function CoffeeLoading({ onComplete }: { onComplete: () => void }) {
  const [seconds, setSeconds] = useState(4);
  const completed = useRef(false);
  // keep the latest callback in a ref so parent re-renders never restart the 4s timer
  const done = useRef(onComplete);
  done.current = onComplete;
  const finish = () => { if (completed.current) return; completed.current = true; done.current(); };

  useEffect(() => {
    const startedAt = Date.now();
    const interval = window.setInterval(() => setSeconds(Math.max(0, 4 - Math.floor((Date.now() - startedAt) / 1000))), 250);
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
