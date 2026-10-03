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
import { AstraCat } from "@/components/AstraCat";
import liveVideo from "@/assets/astra-download-live.mp4";
import liveVideoWebm from "@/assets/astra-download-live.webm";
import livePoster from "@/assets/astra-download-live-poster.jpg";

// Starting numbers; real downloads/ratings from this site are added on top.
const BASE_DOWNLOADS = 20000;
const BASE_RATINGS = 14500;
const BASE_AVG = 4.9;
const DOWNLOAD_URL = "https://github.com/shivam-s01/Aurum-app/releases/latest/download/astra-music-arm64-v8a-release.apk";

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
      { title: "Astra Music — Your music, your way" },
      { name: "description", content: "Download Astra Music for Android — a beautiful, focused player for discovery, playback and your personal library." },
      { property: "og:title", content: "Astra Music — Your music, your way" },
      { property: "og:description", content: "A beautiful, focused music player built for Android." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://astra.mmusic.workers.dev/astra-share-cover.jpg" },
      { name: "twitter:image", content: "https://astra.mmusic.workers.dev/astra-share-cover.jpg" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: AstraPage,
});

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
  const [catMode, setCatMode] = useState<"watch" | "stalk" | "crouch" | "pounce" | "dribble" | "paw" | "look" | "sleep" | "wake">("watch");

  useEffect(() => {
    const updateCoffee = () => {
      const vh = window.innerHeight;
      const faqTop = document.getElementById("faq")?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      const band = document.querySelector(".download-band")?.getBoundingClientRect();
      const overBand = !!band && band.top < vh - 20 && band.bottom > vh - 240;
      setCoffeeVisible(window.scrollY > Math.min(520, vh * 0.55) && faqTop > vh * 0.98 && !overBand);
    };
    updateCoffee();
    window.addEventListener("scroll", updateCoffee, { passive: true });
    return () => window.removeEventListener("scroll", updateCoffee);
  }, []);

  useEffect(() => {
    if (!coffeeVisible) return;
    const routine: Array<{ mode: typeof catMode; duration: number }> = [
      { mode: "watch", duration: 2300 },
      { mode: "look", duration: 1200 },
      { mode: "stalk", duration: 1450 },
      { mode: "crouch", duration: 650 },
      { mode: "pounce", duration: 1250 },
      { mode: "dribble", duration: 2400 },
      { mode: "paw", duration: 1900 },
      { mode: "watch", duration: 2800 },
      { mode: "sleep", duration: 6800 },
      { mode: "wake", duration: 800 },
    ];
    let index = 0;
    let timer = 0;
    const advance = () => {
      const moment = routine[index];
      if (!moment) return;
      setCatMode(moment.mode);
      index = (index + 1) % routine.length;
      timer = window.setTimeout(advance, moment.duration + Math.round(Math.random() * 650));
    };
    advance();
    return () => window.clearTimeout(timer);
  }, [coffeeVisible]);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -7%" });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  if (supportView === "loading") {
    return <CoffeeLoading onComplete={() => setSupportView("support")} />;
  }

  if (supportView === "support") {
    return <SupportPage onBack={() => setSupportView("site")} />;
  }

  const playMeow = () => {
    setMeowing(true);
    setCatMode("crouch");
    window.setTimeout(() => setCatMode("pounce"), 420);
    window.setTimeout(() => setMeowing(false), 1500);
    window.setTimeout(() => setCatMode("watch"), 1800);
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
          <details><summary>Is Astra Music free?<span aria-hidden="true">+</span></summary><p>Yes. Astra Music is free to download and use.</p></details>
          <details><summary>Where do I get the APK?<span aria-hidden="true">+</span></summary><p>Use any Download APK button on this page to get the latest official Android release.</p></details>
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
        <button className="cat-stage" type="button" onClick={playMeow} aria-label="Play with Astra cat">
          <span className={`meow-bubble ${meowing ? "show" : ""}`}>meow</span>
          <span className={`real-cat cat-${catMode} ${meowing ? "is-meowing" : ""}`} aria-hidden="true">
            <AstraCat />
            <span className="sleep-mark sleep-mark-one">z</span>
            <span className="sleep-mark sleep-mark-two">z</span>
          </span>
        </button>
        <button type="button" className="coffee-note" onClick={() => setSupportView("loading")} aria-label="Support the developer">
          <span>Hi! If you love Astra Music, consider supporting my work! ☕</span>
        </button>
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
        <div className="support-identity"><img src="/favicon.png" alt="" /><div><span>ASTRA CREATOR</span><strong>Shivam</strong></div></div>
        <span className="support-brand">ASTRA MUSIC</span>
      </header>
      <section className="support-intro">
        <span className="support-kicker">INDEPENDENT DEVELOPMENT</span>
        <h1>Support the future<br />of <em>Astra.</em></h1>
        <p>Help Shivam continue building a focused, independent music experience with care and consistency.</p>
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