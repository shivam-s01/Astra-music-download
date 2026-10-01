import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
export const Route = createFileRoute("/contact")({ head:()=>({meta:[{title:"Developer Support — Astra Music"},{name:"description",content:"Official developer support and issue reporting for Astra Music."},{property:"og:title",content:"Developer Support — Astra Music"},{property:"og:description",content:"Official developer support and issue reporting for Astra Music."},{property:"og:type",content:"website"},{property:"og:url",content:"/contact"},{name:"twitter:card",content:"summary"}],links:[{rel:"canonical",href:"/contact"}]}), component:Contact });
function Contact(){return <LegalPage eyebrow="Support" title="Developer Support">
  <p>Need help with Astra Music? Share your feedback in the community section on the home page — the developer, Shivam, reads every message.</p>
  <h2>Report a bug or request a feature</h2>
  <p><a className="back-link" href="/#community">Go to the Astra community ↗</a></p>
  <h2>Support development</h2>
  <p>You can support Astra directly via UPI: <strong>64707172@nyes</strong></p>
  <h2>What to include</h2>
  <ul><li>Astra Music version</li><li>Android version and device model</li><li>A short description of the issue</li><li>Steps that reproduce the problem</li></ul>
  <p>Never post passwords, authentication codes, payment information, or other sensitive personal information in a public message.</p>
</LegalPage>}
