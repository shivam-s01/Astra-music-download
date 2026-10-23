import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Clock, Coffee, Copy, MessageCircle, Send, ShieldCheck, Star } from "lucide-react";
import { listComments, submitComment, submitRating } from "@/lib/comments.functions";

const UPI_ID = "64707172@nyes";
const upiLink = (amount: number) => `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent("Astra Music")}&am=${amount}&cu=INR&tn=${encodeURIComponent("Support Astra Music")}`;

export type SupportTab = "support" | "feedback";

type Props = {
  onBack: () => void;
  tab?: SupportTab;
  onTabChange?: (tab: SupportTab) => void;
};

export function SupportPage({ onBack, tab, onTabChange }: Props) {
  // Works controlled (route keeps the tab in the URL) or on its own.
  const [innerTab, setInnerTab] = useState<SupportTab>(tab ?? "support");
  useEffect(() => { if (tab) setInnerTab(tab); }, [tab]);
  const active = innerTab;
  const choose = (next: SupportTab) => { setInnerTab(next); onTabChange?.(next); };

  const tabs: { id: SupportTab; label: string; icon: React.ReactNode }[] = [
    { id: "support", label: "Buy a coffee", icon: <Coffee size={16} /> },
    { id: "feedback", label: "Rate & feedback", icon: <Star size={16} /> },
  ];
  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.id === active);
    const next = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    choose(tabs[next].id);
    document.getElementById(`support-tab-${tabs[next].id}`)?.focus();
  };

  return (
    <main className="support-page">
      <header className="support-header">
        <button type="button" className="support-back" onClick={onBack} aria-label="Back to Astra"><ArrowLeft size={20} /></button>
      </header>
      <section className="support-intro support-profile">
        <img className="support-avatar" src="/astra-dev.jpg" alt="Shivam" width={112} height={112} />
        <h1>Hi, I’m Shivam</h1>
        <p>Thanks for stopping by. Every coffee, rating, or kind word keeps Astra going.</p>
      </section>

      <div className="sp-tabs" role="tablist" aria-label="Support options" data-tab={active} onKeyDown={onTabKey}>
        <span className="sp-tab-pill" aria-hidden="true" />
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`support-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`support-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            className={active === t.id ? "is-active" : ""}
            onClick={() => choose(t.id)}
          >{t.icon}<span>{t.label}</span></button>
        ))}
      </div>

      <div className="sp-panel" id={`support-panel-${active}`} role="tabpanel" aria-labelledby={`support-tab-${active}`} key={active}>
        {active === "support" ? <CoffeePanel /> : <FeedbackPanel />}
      </div>

      <footer className="support-footer"><span>Built with care by Shivam</span><strong>ASTRA MUSIC</strong></footer>
    </main>
  );
}

function CoffeePanel() {
  const [amount, setAmount] = useState(299);
  const [custom, setCustom] = useState("");
  const [copied, setCopied] = useState(false);
  const customValue = Number(custom);
  const customValid = custom === "" || (Number.isFinite(customValue) && customValue >= 10 && customValue <= 100000);
  const finalAmount = custom && customValid ? Math.round(customValue) : amount;
  const copy = async () => { try { await navigator.clipboard.writeText(UPI_ID); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ } };
  return (
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
  );
}

/* ───────────────────────── Rate & feedback ───────────────────────── */

type PublicComment = { id: string; message: string; rating: number | null; created_at: string };
type MyMessage = { text: string; at: number };

const MY_KEY = "astra_my_msgs";
const MY_TTL = 3 * 24 * 60 * 60 * 1000;
const SEND_GAP_MS = 15000;
const STAR_WORDS = ["", "Not for me", "Could be better", "It’s good", "Really good", "Love it!"];

function visitorId(): string {
  try {
    let id = localStorage.getItem("astra_vid");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("astra_vid", id); }
    return id;
  } catch { return crypto.randomUUID(); }
}

function readMine(): MyMessage[] {
  try {
    const raw = JSON.parse(localStorage.getItem(MY_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((m): m is MyMessage => !!m && typeof m.text === "string" && typeof m.at === "number" && Date.now() - m.at < MY_TTL);
  } catch { return []; }
}
function writeMine(list: MyMessage[]) { try { localStorage.setItem(MY_KEY, JSON.stringify(list.slice(0, 5))); } catch { /* storage blocked */ } }

function FeedbackPanel() {
  const fetchComments = useServerFn(listComments);
  const send = useServerFn(submitComment);
  const sendRating = useServerFn(submitRating);

  /* ---- rating (completely separate from the message) ---- */
  const [rating, setRating] = useState(0);        // saved rating
  const [hover, setHover] = useState(0);
  const [rateState, setRateState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  useEffect(() => {
    try { const r = Number(localStorage.getItem("astra_rating") || 0); if (r >= 1 && r <= 5) { setRating(r); setRateState("saved"); } } catch { /* storage blocked */ }
  }, []);
  const onRate = async (n: number) => {
    if (rateState === "saving") return;
    const before = rating;
    setRating(n); setRateState("saving");
    try {
      const r = await sendRating({ data: { rating: n, visitorId: visitorId() } });
      if (r.ok) { setRateState("saved"); try { localStorage.setItem("astra_rating", String(n)); } catch { /* ignore */ } }
      else { setRating(before); setRateState("error"); }
    } catch { setRating(before); setRateState("error"); }
  };
  const onStarKey = (e: React.KeyboardEvent, n: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); const t = Math.min(5, n + 1); setHover(0); document.getElementById(`fb-star-${t}`)?.focus(); }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); const t = Math.max(1, n - 1); setHover(0); document.getElementById(`fb-star-${t}`)?.focus(); }
  };
  const shown = hover || rating;
  const rateLabel =
    rateState === "saving" ? "Saving your rating…"
    : rateState === "error" ? "Couldn’t save. Tap a star to try again."
    : hover ? STAR_WORDS[hover]
    : rating && rateState === "saved" ? `Thanks! You rated Astra ${rating}★ · tap to change`
    : "Tap a star — no message needed";

  /* ---- approved messages + the visitor's own pending ones ---- */
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mine, setMine] = useState<MyMessage[]>([]);
  const load = useCallback(() => {
    fetchComments().then((r) => { setComments(r.comments); setLoaded(true); }).catch(() => setLoaded(true));
  }, [fetchComments]);
  useEffect(() => { load(); setMine(readMine()); }, [load]);
  // once a message was approved it shows in the public list, so drop it from "waiting for review"
  const waiting = useMemo(() => mine.filter((m) => !comments.some((c) => c.message.trim() === m.text.trim())), [mine, comments]);
  useEffect(() => { if (loaded && waiting.length !== mine.length) { setMine(waiting); writeMine(waiting); } }, [loaded, waiting, mine.length]);

  /* ---- write a message (optional) ---- */
  const [text, setText] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const lastSend = useRef(0);
  const trimmed = text.trim();
  const canPost = trimmed.length >= 3 && state !== "sending";
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    if (trimmed.length < 3) { setState("error"); setError("Please write at least 3 characters."); return; }
    if (/https?:\/\/|www\./i.test(trimmed)) { setState("error"); setError("Links are not allowed in messages."); return; }
    if (Date.now() - lastSend.current < SEND_GAP_MS) { setState("error"); setError("Please wait a few seconds before sending another message."); return; }
    setState("sending");
    try {
      const r = await send({ data: { message: trimmed, website: hp || undefined } });
      if (r.ok) {
        lastSend.current = Date.now();
        const next = [{ text: trimmed, at: Date.now() }, ...readMine().filter((m) => m.text !== trimmed)];
        writeMine(next); setMine(next.slice(0, 5));
        setState("sent"); setText("");
      } else { setState("error"); setError(r.error ?? "Something went wrong."); }
    } catch { setState("error"); setError("Could not send right now. Please try again."); }
  };

  return (
    <div className="fb-wrap">
      <section className="fb-card fb-rate" aria-labelledby="fb-rate-h">
        <div className="fb-head"><span className="fb-kicker">Step 1 · Takes one tap</span><h2 id="fb-rate-h">How do you like Astra?</h2></div>
        <div className="fb-stars" role="radiogroup" aria-label="Rate Astra from 1 to 5 stars" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              id={`fb-star-${n}`}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""} — ${STAR_WORDS[n]}`}
              tabIndex={(rating || 1) === n ? 0 : -1}
              className={n <= shown ? "on" : ""}
              style={{ "--i": n } as React.CSSProperties}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(0)}
              onKeyDown={(e) => onStarKey(e, n)}
              onClick={() => onRate(n)}
              disabled={rateState === "saving"}
            ><Star size={34} /></button>
          ))}
        </div>
        <p className={`fb-rate-status ${rateState}`} role="status" aria-live="polite">{rateState === "saved" && !hover && <Check size={15} />}{rateLabel}</p>
      </section>

      <section className="fb-card" aria-labelledby="fb-write-h">
        <div className="fb-head"><span className="fb-kicker">Step 2 · Optional</span><h2 id="fb-write-h">Leave a message</h2><p>A feature idea, a bug, or just what you love. Messages go live after a quick review by me.</p></div>
        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="fb-text" className="sr-only">Your message</label>
          <textarea
            id="fb-text"
            className="fb-textarea"
            maxLength={400}
            rows={4}
            placeholder="Write your message here…"
            value={text}
            onChange={(e) => { setText(e.target.value); if (state !== "sending") setState("idle"); }}
            aria-describedby="fb-hint"
          />
          {/* honeypot — hidden from people */}
          <input className="fb-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={hp} onChange={(e) => setHp(e.target.value)} />
          <div className="fb-actions">
            <small id="fb-hint" className={text.length >= 380 ? "warn" : ""}>{text.length}/400 · no links please</small>
            <button type="submit" disabled={!canPost}><Send size={16} />{state === "sending" ? "Sending…" : "Send message"}</button>
          </div>
          {state === "sent" && <p className="fb-status ok" role="status"><ShieldCheck size={16} /> Thank you! Your message is in review and will appear below once approved.</p>}
          {state === "error" && <p className="fb-status err" role="alert">{error}</p>}
        </form>
      </section>

      <section className="fb-card" aria-labelledby="fb-list-h">
        <div className="fb-head"><span className="fb-kicker">Community</span><h2 id="fb-list-h">What people say</h2></div>
        {waiting.length > 0 && (
          <ul className="fb-list fb-mine" aria-label="Your messages waiting for review">
            {waiting.map((m) => (
              <li key={m.at}>
                <div className="fb-meta"><strong>You</strong><span className="fb-pill"><Clock size={12} /> Waiting for review</span></div>
                <p>{m.text}</p>
              </li>
            ))}
          </ul>
        )}
        <ul className="fb-list" aria-live="polite">
          {!loaded ? (
            [0, 1].map((i) => <li key={i} className="fb-skel" aria-hidden="true"><i /><i /></li>)
          ) : comments.length === 0 ? (
            <li className="fb-empty"><MessageCircle size={22} /><span>No messages yet — be the first to say something nice.</span></li>
          ) : comments.map((c) => (
            <li key={c.id}>
              <div className="fb-meta">
                <span className="fb-avatar" style={{ "--h": (c.id.charCodeAt(0) * 37 + c.id.charCodeAt(1) * 11) % 360 } as React.CSSProperties} aria-hidden="true">A</span>
                <strong>Astra listener</strong>
                {c.rating ? <span className="fb-stars-sm" aria-label={`${c.rating} out of 5 stars`}>{"★".repeat(c.rating)}{"☆".repeat(5 - c.rating)}</span> : null}
                <time dateTime={c.created_at}>{new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time>
              </div>
              <p>{c.message}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
