import { Link } from "@tanstack/react-router";
import iconAsset from "@/assets/astra-icon.png.asset.json";

type LegalPageProps = { eyebrow: string; title: string; children: React.ReactNode };

export function LegalPage({ eyebrow, title, children }: LegalPageProps) {
  return <main className="legal-page">
    <Link to="/" className="brand-lockup"><img src={iconAsset.url} alt="" className="brand-mark" /><span>Astra</span></Link>
    <span className="section-kicker">{eyebrow}</span><h1>{title}</h1>
    {children}
    <Link to="/" className="back-link">← Back to Astra Music</Link>
  </main>;
}