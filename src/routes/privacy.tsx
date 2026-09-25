import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
export const Route = createFileRoute("/privacy")({ head:()=>({meta:[{title:"Privacy Policy — Astra Music"},{name:"description",content:"Privacy Policy for Astra Music."},{property:"og:title",content:"Privacy Policy — Astra Music"},{property:"og:description",content:"Privacy Policy for Astra Music."},{property:"og:type",content:"website"},{property:"og:url",content:"/privacy"},{name:"twitter:card",content:"summary"}],links:[{rel:"canonical",href:"/privacy"}]}), component:Privacy });
function Privacy(){return <LegalPage eyebrow="Legal" title="Privacy Policy">
  <p>Last updated: September 18, 2026</p>
  <p>This policy explains how Astra Music handles information when you use the Android application or this website.</p>
  <h2>Information Astra may process</h2>
  <p>Astra may process search queries, playback requests, playlists, liked songs, listening preferences, app settings, and basic device or diagnostic information needed to provide and improve its features. Information stored locally remains on your device unless a feature clearly requires an external service.</p>
  <h2>Device permissions</h2>
  <p>Astra may request access to audio or media files, notifications, and network connectivity when those permissions are needed for a feature. You can review or revoke permissions at any time in Android settings, although some features may then stop working.</p>
  <h2>Third-party services</h2>
  <p>Astra is an independent third-party music client and may send requests to music, hosting, or other external services. Those services process information under their own privacy policies. Astra does not control their practices.</p>
  <h2>Data sharing and sale</h2>
  <p>Astra does not sell your personal information. Information may be shared only when required to provide a feature, comply with law, protect users, or investigate misuse.</p>
  <h2>Data security and retention</h2>
  <p>Reasonable safeguards are used to protect information handled by Astra. No method of storage or transmission is completely secure. Data is kept only as long as reasonably needed for the purpose for which it was processed.</p>
  <h2>Children’s privacy</h2>
  <p>Astra is not directed to children under 13, and the developer does not knowingly collect personal information from children under 13.</p>
  <h2>Your choices</h2>
  <p>You can clear the app’s local data, uninstall the app, revoke Android permissions, or contact the developer about a privacy question through the official support page.</p>
  <h2>Policy changes</h2>
  <p>This policy may be updated when Astra’s features or legal requirements change. The updated date above will show the latest revision.</p>
</LegalPage>}