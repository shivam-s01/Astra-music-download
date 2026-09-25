import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
export const Route = createFileRoute("/terms")({ head:()=>({meta:[{title:"Terms & Conditions — Astra Music"},{name:"description",content:"Terms and conditions for Astra Music."},{property:"og:title",content:"Terms & Conditions — Astra Music"},{property:"og:description",content:"Terms and conditions for Astra Music."},{property:"og:type",content:"website"},{property:"og:url",content:"/terms"},{name:"twitter:card",content:"summary"}],links:[{rel:"canonical",href:"/terms"}]}), component:Terms });
function Terms(){return <LegalPage eyebrow="Legal" title="Terms & Conditions">
  <p>Last updated: September 18, 2026</p>
  <p>By downloading or using Astra Music, you agree to these terms. If you do not agree, do not use the app.</p>
  <h2>License and acceptable use</h2>
  <p>You receive a limited, personal, non-exclusive, and revocable right to use Astra on a compatible Android device. You must not misuse the app, interfere with its operation, bypass security measures, distribute harmful code, or use it unlawfully.</p>
  <h2>Music and third-party content</h2>
  <p>Astra is an independent third-party client. It does not host, own, or claim rights to music, artwork, lyrics, or other content supplied by users or external services. You are responsible for following applicable law, service terms, and creators’ rights.</p>
  <h2>Downloads and local files</h2>
  <p>You are responsible for ensuring that any content you access, save, or play through Astra is lawful in your location and that you have all necessary permissions.</p>
  <h2>Updates and availability</h2>
  <p>Features, compatibility, and access may change or be discontinued. Playback and search can depend on your device, connection, Android version, and third-party services outside Astra’s control.</p>
  <h2>No warranties</h2>
  <p>Astra is provided “as is” and “as available,” without warranties of uninterrupted access, accuracy, compatibility, or fitness for a particular purpose, to the extent permitted by law.</p>
  <h2>Limitation of liability</h2>
  <p>To the extent permitted by law, the developer is not liable for indirect, incidental, special, or consequential loss arising from your use of, or inability to use, Astra or third-party services.</p>
  <h2>Termination</h2>
  <p>Your permission to use Astra may end if you violate these terms. Provisions concerning ownership, disclaimers, and liability continue where legally applicable.</p>
  <h2>Changes and contact</h2>
  <p>These terms may be updated as Astra evolves. Continued use after an update means you accept the revised terms. Questions can be submitted through the official support page.</p>
</LegalPage>}