import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
export const Route = createFileRoute("/contact")({ head:()=>({meta:[{title:"Developer Support — Astra Music"},{name:"description",content:"Official developer support and issue reporting for Astra Music."},{property:"og:title",content:"Developer Support — Astra Music"},{property:"og:description",content:"Official developer support and issue reporting for Astra Music."},{property:"og:type",content:"website"},{property:"og:url",content:"/contact"},{name:"twitter:card",content:"summary"}],links:[{rel:"canonical",href:"/contact"}]}), component:Contact });
function Contact(){return <LegalPage eyebrow="Support" title="Developer Support">
  <p>Need help with Astra Music? Contact Shivam through the project’s verified GitHub pages.</p>
  <h2>Report a bug or request a feature</h2>
  <p><a className="back-link" href="https://github.com/shivam-s01/Aurum-app/issues" target="_blank" rel="noreferrer">Open Astra GitHub Issues ↗</a></p>
  <h2>Developer and source</h2>
  <p><a className="back-link" href="https://github.com/shivam-s01" target="_blank" rel="noreferrer">Visit Shivam’s GitHub profile ↗</a></p>
  <p><a className="back-link" href="https://github.com/shivam-s01/Aurum-app" target="_blank" rel="noreferrer">View the Astra Music project ↗</a></p>
  <h2>What to include</h2>
  <ul><li>Astra Music version</li><li>Android version and device model</li><li>A short description of the issue</li><li>Steps that reproduce the problem</li><li>A screenshot, if it does not contain private information</li></ul>
  <p>Never post passwords, authentication codes, payment information, or other sensitive personal information in a public issue.</p>
</LegalPage>}