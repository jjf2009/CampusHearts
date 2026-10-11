import { InfoPage } from "@/components/site/SiteChrome";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <InfoPage title="Terms (the short version)">
      <ul>
        <li>Campus Buddy is a student-run project for Goa College of Engineering students. It isn&apos;t run by the college.</li>
        <li>You must be a current GEC student and at least 17. You verify with your own admit card or GEC email.</li>
        <li>You&apos;re responsible for what you post and send. Follow the safety rules.</li>
        <li>We can remove content or ban accounts that break the rules, with or without warning.</li>
        <li>It&apos;s free and provided as-is. We do our best to keep it running and safe, but can&apos;t promise it always will be.</li>
        <li>You can delete your account any time from Settings.</li>
      </ul>
    </InfoPage>
  );
}
