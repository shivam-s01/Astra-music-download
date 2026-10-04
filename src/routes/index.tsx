import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listComments, submitComment } from "@/lib/comments.functions";
import { getPublicStats } from "@/lib/stats.functions";
import { ArrowLeft, Check, Coffee, Copy, MessageCircle, Star, Download, Headphones, Library, Search, ShieldCheck, Sparkles } from "lucide-react";
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

// Starting numbers; real downloads/ratings from this site are added on top.
const BASE_DOWNLOADS = 20000;
const BASE_RATINGS = 14500;
const BASE_AVG = 4.9;
const SUPPORT_NOTE = "Hi! If you love Astra Music, consider supporting my work! ☕";
const DOWNLOAD_URL = "https://github.com/shivam-s01/Aurum-app/releases/latest/download/app-arm64-v8a-release.apk";

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
      { name: "description", content: "Download Astra Music for Android — free music player app. Get the latest official Astra Music APK, discover songs and build your library. Safe direct download." },
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
    scripts: [{ type: "application/ld+json", children: JSON.stringify([{"@context": "https://schema.org", "@type": "WebSite", "name": "Astra Music", "alternateName": ["Astra Music Download", "Astra Music APK"], "url": "https://astra.mmusic.workers.dev/"}, {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Astra Music", "operatingSystem": "Android", "applicationCategory": "MusicApplication", "description": "Download Astra Music for Android — a free, focused music player for discovery, playback and your personal library.", "url": "https://astra.mmusic.workers.dev/", "downloadUrl": "https://github.com/shivam-s01/Aurum-app/releases/latest/download/astra-music-arm64-v8a-release.apk", "image": "https://astra.mmusic.workers.dev/astra-share-cover.jpg", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}}, {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "What is Astra Music?", "acceptedAnswer": {"@type": "Answer", "text": "Astra Music is a free Android music player app for discovering songs, playing music and building your personal library."}}, {"@type": "Question", "name": "How do I download Astra Music APK?", "acceptedAnswer": {"@type": "Answer", "text": "Tap any Download APK button on this page. The latest official Astra Music APK for Android (arm64-v8a) downloads directly from the official GitHub release."}}, {"@type": "Question", "name": "Is Astra Music free?", "acceptedAnswer": {"@type": "Answer", "text": "Yes. Astra Music is free to download and use."}}, {"@type": "Question", "name": "Does Astra need an account?", "acceptedAnswer": {"@type": "Answer", "text": "Account requirements depend on the services and features available in the current build."}}, {"@type": "Question", "name": "Which Android versions are supported?", "acceptedAnswer": {"@type": "Answer", "text": "Check the latest release information before installing to confirm compatibility with your device."}}]}]) }],
  }),
  component: AstraPage,
});

function Heart() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.2S3.2 15.700 2.600 9.600C2.300 6.300 4.500 4 7.300 4c1.900 0 3.700 1 4.700 2.800C13 5 14.800 4 16.700 4c2.800 0 5 2.300 4.700 5.600-.6 6.100-9.400 11.600-9.400 11.600Z" /></svg>;
}

function AstraPage() {
  const [supportView, setSupportView] = useState<"site" | "loading" | "support">("site");
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
  const avgRating = ((BASE_RATINGS * BASE_AVG + live.ratingSum) / totalRatings).toFixed(1);
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
    }, { threshold: 0, rootMargin: "0px 0px 8% 0px" });
    nodes.forEach((node) => observer.observe(node));
    // safety net: fast scrolling can outrun the observer, so also check on scroll
    let raf = 0;
    const sweep = () => {
      raf = 0;
      const vh = window.innerHeight;
      nodes.forEach((node) => {
        if (!node.classList.contains("is-revealed") && node.getBoundingClientRect().top < vh * 1.05) reveal(node);
      });
    };
    const onScroll = () => { if (!raf) raf = window.requestAnimationFrame(sweep); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    sweep();
    return () => { observer.disconnect(); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) window.cancelAnimationFrame(raf); };
  }, []);

  if (supportView === "loading") {
    return <CoffeeLoading onComplete={() => setSupportView("support")} />;
  }

  if (supportView === "support") {
    return <SupportPage onBack={() => setSupportView("site")} />;
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
      <header className="site-header">
        <a href="#top" className="brand-lockup" aria-label="Astra Music home">
          <img src="/favicon.png" alt="" className="brand-mark" />
          <span>Astra</span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#screens">Screens</a><a href="#features">Features</a><a href="#faq">FAQ</a>
        </nav>
        <a className="header-download" href={DOWNLOAD_URL} onClick={trackDownload}><Download size={15} /> Download</a>
      </header>

      <section id="top" className="hero-section is-revealed" data-reveal>
        <div className="hero-copy">
          <div className="release-pill"><span /> Made for Android</div>
          <h1>Your music.<br /><em>Your moment.</em></h1>
          <p>Astra brings discovery, search, playback and your library into one joyful music experience—without the clutter.</p>
          <div className="hero-actions">
            <a className="primary-download" href={DOWNLOAD_URL} onClick={trackDownload}><Download size={20} /> Download APK</a>
            <a className="secondary-link" href="#screens">See it in action <span>↓</span></a>
          </div>
          <div className="hero-stats" aria-label={`Over ${totalDownloads.toLocaleString("en-US")} downloads, ${totalRatings.toLocaleString("en-US")} plus ratings, ${avgRating} average rating`}>
            <div><strong>{totalDownloads.toLocaleString("en-US")}+</strong><span>Downloads</span></div>
            <div><strong>{totalRatings.toLocaleString("en-US")}+</strong><span>Ratings</span></div>
            <div><strong>{avgRating}<span className="stat-star">★</span></strong><span>Average rating</span></div>
          </div>
        </div>
        <div className="hero-art" aria-label="Astra Music app preview">
          <div className="burst burst-one" /><div className="burst burst-two" />
          <div className="hero-phone"><img src={playerImage} alt="Astra Music immersive player showing Dance Again" /></div>
          <div className="floating-note">♪</div>
          <div className="playing-chip"><span className="equalizer"><i /><i /><i /></span><div><small>NOW PLAYING</small><strong>Dance Again</strong></div></div>
        </div>
      </section>


      <section id="screens" className="screens-section" data-reveal>
        <div className="section-title-row">
          <div><span className="section-kicker">Inside Astra</span><h2>Every screen, in rhythm.</h2></div>
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
        <div className="section-title-row compact"><div><span className="section-kicker">Made to feel effortless</span><h2>Just press play.</h2></div></div>
        <div className="feature-list">
          <article className="feature-card dark-card" data-reveal><div className="feature-icon"><Sparkles /></div><div><h3>Fresh discovery</h3><p>Playlists and recommendations that make finding your next favorite feel natural.</p></div><span className="feature-number">01</span></article>
          <article className="feature-card aqua-card" data-reveal><div className="feature-icon"><Search /></div><div><h3>Find it fast</h3><p>Search artists, albums and songs without digging through a crowded interface.</p></div><span className="feature-number">02</span></article>
          <article className="feature-card yellow-card" data-reveal><div className="feature-icon"><Headphones /></div><div><h3>Immersive player</h3><p>Lyrics, queue and essential controls stay close while the music takes center stage.</p></div><span className="feature-number">03</span></article>
          <article className="feature-card lilac-card" data-reveal><div className="feature-icon"><Library /></div><div><h3>Your library</h3><p>Liked songs, downloads, playlists and local files—organized around you.</p></div><span className="feature-number">04</span></article>
        </div>
      </section>

      <section className="download-band" data-reveal>
        <div className="band-live" aria-hidden="true"><video poster={livePoster} autoPlay muted loop playsInline preload="auto"><source src={liveVideoWebm} type="video/webm" /><source src={liveVideo} type="video/mp4" /></video></div>
        <div className="download-copy"><img src="/favicon.png" alt="" /><div><span>ASTRA MUSIC FOR ANDROID</span><h2>Turn up your everyday.</h2><p>Download the latest Astra APK and start listening.</p></div></div>
        <div className="download-side"><a className="band-download" href={DOWNLOAD_URL} onClick={trackDownload}><Download size={20} /> Download APK</a><span><ShieldCheck size={14} /> Latest official release</span></div>
      </section>

      <section id="faq" className="faq-section" data-reveal>
        <div><span className="section-kicker">Good to know</span><h2>Quick answers.</h2></div>
        <div className="faq-list">
          <details><summary>What is Astra Music?<span aria-hidden="true">+</span></summary><p>Astra Music is a free Android music player app for discovering songs, playing music and building your personal library.</p></details>
          <details><summary>How do I download Astra Music APK?<span aria-hidden="true">+</span></summary><p>Tap any Download APK button on this page. The latest official Astra Music APK for Android (arm64-v8a) downloads directly from the official GitHub release.</p></details>
          <details><summary>Is Astra Music free?<span aria-hidden="true">+</span></summary><p>Yes. Astra Music is free to download and use.</p></details>
          <details><summary>Does Astra need an account?<span aria-hidden="true">+</span></summary><p>Account requirements depend on the services and features available in the current build.</p></details>
          <details><summary>Which Android versions are supported?<span aria-hidden="true">+</span></summary><p>Check the latest release information before installing to confirm compatibility with your device.</p></details>
        </div>
      </section>

      <CommunitySection />

      <footer className="site-footer">
        <div className="footer-brand"><img src="/favicon.png" alt="" /><div><strong>Astra Music</strong><span>Music feels better here.</span></div></div>
        <div className="footer-links"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/contact">Developer Support</Link></div>
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
        <button type="button" className="coffee-note" onClick={() => setSupportView("loading")} aria-label={SUPPORT_NOTE}>
          <span className="note-ghost" aria-hidden="true">{SUPPORT_NOTE}</span>
          <span className="note-typed" aria-hidden="true">{typed}<i className={`note-caret ${typed.length >= Array.from(SUPPORT_NOTE).length ? "done" : ""}`} /></span>
        </button>
        <button type="button" className="support-orb" onClick={() => setSupportView("loading")} aria-label="Support the developer with a coffee">
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

  useEffect(() => {
    const startedAt = Date.now();
    const interval = window.setInterval(() => setSeconds(Math.max(0, 4 - Math.floor((Date.now() - startedAt) / 1000))), 200);
    const timeout = window.setTimeout(() => {
      completed.current = true;
      onComplete();
    }, 4000);
    return () => { window.clearInterval(interval); window.clearTimeout(timeout); };
  }, [onComplete]);

  return (
    <main className="coffee-loading">
      <div className="steam" aria-hidden="true"><i /><i /><i /></div>
      <div className="loading-cup" aria-hidden="true"><span /></div>
      <p>A little warmth for Astra</p>
      <h1>Brewing your support space…</h1>
      <div className="brew-track"><span /></div>
      <button type="button" className="skip-button" onClick={onComplete}>Skip <span>{seconds}s</span></button>
    </main>
  );
}

const UPI_ID = "64707172@nyes";
const upiLink = (amount: number) => `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent("Astra Music")}&am=${amount}&cu=INR&tn=${encodeURIComponent("Support Astra Music")}`;

function SupportPage({ onBack }: { onBack: () => void }) {
  const [amount, setAmount] = useState(299);
  const [custom, setCustom] = useState("");
  const [copied, setCopied] = useState(false);
  const customValue = Number(custom);
  const customValid = custom === "" || (Number.isFinite(customValue) && customValue >= 10 && customValue <= 100000);
  const finalAmount = custom && customValid ? Math.round(customValue) : amount;
  const copy = async () => { try { await navigator.clipboard.writeText(UPI_ID); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ } };
  return (
    <main className="support-page">
      <header className="support-header">
        <button type="button" className="support-back" onClick={onBack} aria-label="Back to Astra"><ArrowLeft size={20} /></button>
      </header>
      <section className="support-intro support-profile">
        <img className="support-avatar" src="/astra-dev.jpg" alt="Shivam" width={112} height={112} />
        <h1>Hi, I’m Shivam</h1>
        <p>Thanks for stopping by. Every coffee, sponsorship, or share keeps the projects going.</p>
      </section>
      <section className="support-shell" aria-label="UPI support">
        <div className="support-shell-head"><div><span>UPI · INDIA</span><h2>Choose an amount</h2></div><Coffee size={28} /></div>
        <div className="upi-tiers" role="radiogroup" aria-label="Support amount">
          {[99, 299, 999].map((v) => (
            <button key={v} type="button" role="radio" aria-checked={!custom && amount === v} className={!custom && amount === v ? "is-active" : ""} onClick={() => { setAmount(v); setCustom(""); }}>₹{v}</button>
          ))}
        </div>
        <label className="upi-custom"><span>Custom amount (₹10 – ₹1,00,000)</span>
          <input inputMode="numeric" placeholder="e.g. 500" value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))} aria-invalid={!customValid} />
        </label>
        {!customValid && <p className="upi-error">Please enter an amount between ₹10 and ₹1,00,000.</p>}
        <a className="coming-button upi-pay" href={customValid ? upiLink(finalAmount) : undefined} aria-disabled={!customValid}>PAY ₹{finalAmount} WITH UPI APP</a>
        <div className="upi-id-row"><div><span>UPI ID</span><strong>{UPI_ID}</strong></div><button type="button" onClick={copy}>{copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}</button></div>
        <p className="upi-note">Opens Google Pay, PhonePe, Paytm or any UPI app on your phone. On desktop, copy the UPI ID and pay from your phone.</p>
      </section>
      <footer className="support-footer"><span>Built with care by Shivam</span><strong>ASTRA MUSIC</strong></footer>
    </main>
  );
}

type Comment = { id: string; message: string; rating: number | null; created_at: string };

function CommunitySection() {
  const fetchComments = useServerFn(listComments);
  const send = useServerFn(submitComment);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  useEffect(() => { fetchComments().then((r) => setComments(r.comments)).catch(() => {}); }, [fetchComments]);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = text.trim();
    if (msg.length < 3) { setState("error"); setError("Please write at least 3 characters."); return; }
    setState("sending");
    try {
      const r = await send({ data: { message: msg, ...(rating ? { rating } : {}) } });
      if (r.ok) { setState("sent"); setText(""); setRating(0); } else { setState("error"); setError(r.error ?? "Something went wrong."); }
    } catch { setState("error"); setError("Could not send right now. Please try again."); }
  };
  return (
    <section id="community" className="community-section" data-reveal>
      <div><span className="section-kicker">Community</span><h2>Say something.</h2><p>Share feedback, a feature idea or just what you love. No name or account needed — messages appear after a quick review.</p></div>
      <div className="community-body">
        <form className="comment-form" onSubmit={onSubmit}>
          <div className="star-input" role="radiogroup" aria-label="Rate Astra">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} className={n <= rating ? "on" : ""} onClick={() => { setRating(rating === n ? 0 : n); if (state !== "sending") setState("idle"); }}><Star size={26} /></button>
            ))}
            <small>{rating ? `${rating}/5` : "Optional"}</small>
          </div>
          <label htmlFor="comment-text" className="sr-only">Your message</label>
          <textarea id="comment-text" maxLength={400} rows={4} placeholder="Write your message…" value={text} onChange={(e) => { setText(e.target.value); if (state !== "sending") setState("idle"); }} />
          <div className="comment-actions"><small>{text.length}/400</small><button type="submit" disabled={state === "sending"}><MessageCircle size={16} /> {state === "sending" ? "Sending…" : "Post"}</button></div>
          {state === "sent" && <p className="comment-status ok" role="status">Thank you! Your message will appear after review.</p>}
          {state === "error" && <p className="comment-status err" role="alert">{error}</p>}
        </form>
        <ul className="comment-list">
          {comments.length === 0 ? <li className="comment-empty">Be the first to share your thoughts.</li> : comments.map((c) => (
            <li key={c.id}><div className="comment-meta"><strong>Astra listener</strong>{c.rating ? <span className="comment-stars" aria-label={`${c.rating} out of 5 stars`}>{"★".repeat(c.rating)}{"☆".repeat(5 - c.rating)}</span> : null}<time dateTime={c.created_at}>{new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time></div><p>{c.message}</p></li>
          ))}
        </ul>
      </div>
    </section>
  );
}

declare global {
  interface Window { webkitAudioContext?: typeof AudioContext }
}