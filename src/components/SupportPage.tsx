import { useState } from "react";
import { ArrowLeft, Check, Coffee, Copy } from "lucide-react";

const UPI_ID = "64707172@nyes";
const upiLink = (amount: number) => `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent("Astra Music")}&am=${amount}&cu=INR&tn=${encodeURIComponent("Support Astra Music")}`;

export function SupportPage({ onBack }: { onBack: () => void }) {
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
