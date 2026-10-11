import { InfoPage } from "@/components/site/SiteChrome";

export const metadata = { title: "Safety & community rules" };

export default function SafetyPage() {
  return (
    <InfoPage title="Safety & rules">
      <p>Campus Buddy only works if everyone feels safe. Break these rules and you&apos;ll be banned.</p>
      <h2>The rules</h2>
      <ul>
        <li>Be yourself: your own photos, your real details. One account per person.</li>
        <li>Be kind. No harassment, hate, threats, or pressuring anyone.</li>
        <li>No nudity or sexual content, and nothing involving anyone under 18.</li>
        <li>No spam, selling, or promoting things.</li>
        <li>Never share someone else&apos;s photos, chats or details outside Campus Buddy.</li>
        <li>&ldquo;No&rdquo; means no. If someone passes, unmatches or blocks you, move on.</li>
      </ul>
      <h2>Staying safe</h2>
      <ul>
        <li>Keep chatting in the app until you&apos;re comfortable. Only share your WhatsApp when you want to.</li>
        <li>Meet for the first time somewhere public on campus, and tell a friend.</li>
        <li>Never send money or anything you wouldn&apos;t want shared.</li>
        <li>Trust your gut. Unmatch, block, or report from the ⋯ menu any time.</li>
      </ul>
      <h2>Reporting</h2>
      <p>
        Reporting someone blocks them for you instantly. The admins review every report and can ban accounts. In an
        emergency, contact college authorities or call 112.
      </p>
    </InfoPage>
  );
}
