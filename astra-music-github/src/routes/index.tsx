import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Coffee, Download, Headphones, Library, Search, ShieldCheck, Sparkles } from "lucide-react";
import homeAsset from "@/assets/astra-app-home-clean.jpg.asset.json";
import libraryAsset from "@/assets/astra-app-library-clean.jpg.asset.json";
import exploreAsset from "@/assets/astra-app-explore-clean.jpg.asset.json";
import suggestionsAsset from "@/assets/astra-app-suggestions-clean.jpg.asset.json";
import resultsAsset from "@/assets/astra-app-results-clean.jpg.asset.json";
import playerAsset from "@/assets/astra-app-player-clean.jpg.asset.json";
import lyricsAsset from "@/assets/astra-app-lyrics-clean.jpg.asset.json";
import catPlayImage from "@/assets/astra-cat-play.png";
import catSleepImage from "@/assets/astra-cat-sleep.png";
import coffeeImage from "@/assets/astra-coffee.png";
import catMeowAsset from "@/assets/astra-cat-meow.ogg.asset.json";

const DOWNLOAD_URL = "https://github.com/shivam-s01/Aurum-app/releases/latest/download/app-arm64-v8a-release.apk";

const screenshots = [
  { src: homeAsset.url, alt: "Astra Music home screen with quick picks and recommendations", label: "Discover" },
  { src: libraryAsset.url, alt: "Astra Music library with liked songs and recent plays", label: "Library" },
  { src: exploreAsset.url, alt: "Astra Music search screen with mood and genre collections", label: "Explore" },
  { src: suggestionsAsset.url, alt: "Astra Music personalized song suggestions", label: "Suggestions" },
  { src: resultsAsset.url, alt: "Astra Music artist, album and song search results", label: "Instant search" },
  { src: playerAsset.url, alt: "Astra Music immersive now playing screen", label: "Now playing" },
  { src: lyricsAsset.url, alt: "Astra Music synchronized lyrics screen", label: "Live lyrics" },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Astra Music — Your music, your way" },
      { name: "description", content: "Download Astra Music for Android — a beautiful, focused player for discovery, playback and your personal library." },
      { property: "og:title", content: "Astra Music — Your music, your way" },
      { property: "og:description", content: "A beautiful, focused music player built for Android." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AstraPage,
});

function AstraPage() {
  const [supportView, setSupportView] = useState<"site" | "loading" | "support">("site");
  const [coffeeVisible, setCoffeeVisible] = useState(false);
  const [meowing, setMeowing] = useState(false);
  const [catMode, setCatMode] = useState<"watch" | "stalk" | "crouch" | "pounce" | "dribble" | "paw" | "look" | "sleep">("watch");
  const catAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const updateCoffee = () => {
      const faq = document.getElementById("faq");
      const faqTop = faq?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      setCoffeeVisible(window.scrollY > Math.min(520, window.innerHeight * 0.55) && faqTop > window.innerHeight * 0.78);
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

  if (supportView === "loading") {
    return <CoffeeLoading onComplete={() => setSupportView("support")} />;
  }

  if (supportView === "support") {
    return <SupportPage onBack={() => setSupportView("site")} />;
  }

  const playMeow = () => {
    setMeowing(true);
    setCatMode("pounce");
    window.setTimeout(() => setMeowing(false), 1100);
    window.setTimeout(() => setCatMode("watch"), 1050);
    if (!catAudio.current) catAudio.current = new Audio(catMeowAsset.url);
    catAudio.current.currentTime = 0;
    void catAudio.current.play().catch(() => playSyntheticMeow());
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
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="site-header">
        <a href="#top" className="brand-lockup" aria-label="Astra Music home">
          <img src="/favicon.png" alt="" className="brand-mark" />
          <span>Astra</span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#screens">Screens</a><a href="#features">Features</a><a href="#faq">FAQ</a>
        </nav>
        <a className="header-download" href={DOWNLOAD_URL}><Download size={15} /> Download</a>
      </header>

      <section id="top" className="hero-section">
        <div className="hero-copy">
          <div className="release-pill"><span /> Made for Android</div>
          <h1>Your music.<br /><em>Your moment.</em></h1>
          <p>Astra brings discovery, search, playback and your library into one joyful music experience—without the clutter.</p>
          <div className="hero-actions">
            <a className="primary-download" href={DOWNLOAD_URL}><Download size={20} /> Download APK</a>
            <a className="secondary-link" href="#screens">See it in action <span>↓</span></a>
          </div>
          <div className="hero-meta">
            <AnimatedStat value={20000} suffix="+" label="Downloads" />
            <AnimatedStat value={14500} suffix="+" label="Ratings" />
            <AnimatedStat value={4.9} suffix="★" label="Average rating" decimals={1} />
          </div>
        </div>
        <div className="hero-art" aria-label="Astra Music app preview">
          <div className="burst burst-one" /><div className="burst burst-two" />
          <div className="hero-phone"><img src={playerAsset.url} alt="Astra Music immersive player showing Dance Again" /></div>
          <div className="floating-note">♪</div>
          <div className="playing-chip"><span className="equalizer"><i /><i /><i /></span><div><small>NOW PLAYING</small><strong>Dance Again</strong></div></div>
        </div>
      </section>

      <section id="screens" className="screens-section">
        <div className="section-title-row">
          <div><span className="section-kicker">Inside Astra</span><h2>Every screen, in rhythm.</h2></div>
          <p>From discovery to your daily rotation, everything stays beautifully within reach.</p>
        </div>
        <div className="marquee" aria-label="Astra Music screenshots moving from right to left">
          <div className="marquee-track">
            {[...screenshots, ...screenshots].map((shot, index) => (
              <figure className={`screen-frame screen-${index % 7}`} key={`${shot.alt}-${index}`} aria-hidden={index >= screenshots.length || undefined}>
                <img src={shot.src} alt={index < screenshots.length ? shot.alt : ""} loading={index < 4 ? "eager" : "lazy"} />
                <figcaption><span>{String((index % screenshots.length) + 1).padStart(2, "0")}</span>{shot.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="section-title-row compact"><div><span className="section-kicker">Made to feel effortless</span><h2>Just press play.</h2></div></div>
        <div className="feature-list">
          <article className="feature-card dark-card"><div className="feature-icon"><Sparkles /></div><div><h3>Fresh discovery</h3><p>Playlists and recommendations that make finding your next favorite feel natural.</p></div><span className="feature-number">01</span></article>
          <article className="feature-card aqua-card"><div className="feature-icon"><Search /></div><div><h3>Find it fast</h3><p>Search artists, albums and songs without digging through a crowded interface.</p></div><span className="feature-number">02</span></article>
          <article className="feature-card yellow-card"><div className="feature-icon"><Headphones /></div><div><h3>Immersive player</h3><p>Lyrics, queue and essential controls stay close while the music takes center stage.</p></div><span className="feature-number">03</span></article>
          <article className="feature-card lilac-card"><div className="feature-icon"><Library /></div><div><h3>Your library</h3><p>Liked songs, downloads, playlists and local files—organized around you.</p></div><span className="feature-number">04</span></article>
        </div>
      </section>

      <section className="download-band">
        <div className="download-copy"><img src="/favicon.png" alt="" /><div><span>ASTRA MUSIC FOR ANDROID</span><h2>Turn up your everyday.</h2><p>Download the latest Astra APK and start listening.</p></div></div>
        <div className="download-side"><a className="band-download" href={DOWNLOAD_URL}><Download size={20} /> Download APK</a><span><ShieldCheck size={14} /> Latest release via GitHub</span></div>
      </section>

      <section id="faq" className="faq-section">
        <div><span className="section-kicker">Good to know</span><h2>Quick answers.</h2></div>
        <div className="faq-list">
          <details><summary>Is Astra Music free?<span>+</span></summary><p>Yes. Astra Music is free to download and use.</p></details>
          <details><summary>Where do I get the APK?<span>+</span></summary><p>Use any Download APK button on this page to get the latest Android release directly from GitHub.</p></details>
          <details><summary>Does Astra need an account?<span>+</span></summary><p>Account requirements depend on the services and features available in the current build.</p></details>
          <details><summary>Which Android versions are supported?<span>+</span></summary><p>Check the latest release information before installing to confirm compatibility with your device.</p></details>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand"><img src="/favicon.png" alt="" /><div><strong>Astra Music</strong><span>Music feels better here.</span></div></div>
        <div className="footer-links"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/contact">Contact</Link></div>
        <span className="copyright">© 2026 Astra Music · Made for Android</span>
      </footer>

      <aside className={`coffee-charm ${coffeeVisible ? "is-visible" : ""}`} aria-hidden={!coffeeVisible}>
        <button className="cat-stage" type="button" onClick={playMeow} aria-label="Play with Astra cat">
          <span className={`meow-bubble ${meowing ? "show" : ""}`}>meow</span>
          <span className={`real-cat cat-${catMode}`} aria-hidden="true">
            <img className="cat-playing" src={catPlayImage} alt="" loading="lazy" width={1024} height={1024} />
            <img className="cat-sleeping" src={catSleepImage} alt="" loading="lazy" width={1024} height={1024} />
            <span className="sleep-mark sleep-mark-one">z</span>
            <span className="sleep-mark sleep-mark-two">z</span>
          </span>
        </button>
        <div className="coffee-note">
          <div><strong>If you love Astra,</strong><span>please support the developer.</span></div>
          <button type="button" className="coffee-button" onClick={() => setSupportView("loading")} aria-label="Support the developer with coffee"><img src={coffeeImage} alt="" loading="lazy" width={1024} height={1024} /></button>
        </div>
      </aside>
    </main>
  );
}

function AnimatedStat({ value, suffix, label, decimals = 0 }: { value: number; suffix: string; label: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const statRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = statRef.current;
    if (!node) return;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      const startedAt = performance.now();
      const animate = (now: number) => {
        const progress = Math.min((now - startedAt) / 1450, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setDisplay(value * eased);
        if (progress < 1) frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
      observer.disconnect();
    }, { threshold: 0.5 });
    observer.observe(node);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [value]);

  const formatted = decimals ? display.toFixed(decimals) : Math.round(display).toLocaleString("en-US");
  return <div ref={statRef}><strong>{formatted}{suffix}</strong><span>{label}</span></div>;
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

function SupportPage({ onBack }: { onBack: () => void }) {
  return (
    <main className="support-page">
      <header className="support-header">
        <button type="button" className="support-back" onClick={onBack} aria-label="Back to Astra"><ArrowLeft size={20} /></button>
        <div className="support-identity"><img src="/favicon.png" alt="" /><div><span>ASTRA CREATOR</span><strong>@ishivam</strong></div></div>
        <span className="support-brand">ASTRA MUSIC</span>
      </header>
      <section className="support-intro">
        <span className="support-kicker">INDEPENDENT DEVELOPMENT</span>
        <h1>Support the future<br />of <em>Astra.</em></h1>
        <p>Help Shivam continue building a focused, independent music experience with care and consistency.</p>
      </section>
      <section className="support-shell" aria-label="Support options coming soon">
        <div className="support-shell-head"><div><span>CONTRIBUTION</span><h2>Support development</h2></div><Coffee size={28} /></div>
        <div className="blank-options"><span /><span /><span /></div>
        <div className="blank-message"><span /><span /></div>
        <button className="coming-button" type="button" disabled>COMING SOON</button>
      </section>
      <footer className="support-footer"><span>Built with care by Shivam</span><strong>ASTRA MUSIC</strong></footer>
    </main>
  );
}

declare global {
  interface Window { webkitAudioContext?: typeof AudioContext }
}