import { InfoPage } from "@/components/site/SiteChrome";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy">
      <h2>What we store</h2>
      <ul>
        <li>Your email (for logging in).</li>
        <li>Your profile: name, photos, details, quiz answers, and optionally your WhatsApp number.</li>
        <li>
          For freshers: your admit card file and the details read from it (reg no, name, gender, date of birth, branch,
          GEC email), to prove you&apos;re a student and stop fake or duplicate accounts.
        </li>
        <li>Your likes, matches, messages, blocks and reports.</li>
      </ul>
      <h2>Who can see what</h2>
      <ul>
        <li>Other verified students see your profile, except your phone number, admit card and email.</li>
        <li>Photos are encrypted and only shown while someone holds them, stamped with the viewer&apos;s name.</li>
        <li>Your WhatsApp number is only shown to a match after you choose to share it.</li>
        <li>Messages are only visible to the two people in the chat.</li>
        <li>Admins can see admit cards waiting for review and reports, only to verify and keep people safe.</li>
      </ul>
      <h2>Deleting your data</h2>
      <p>Settings → Delete my account removes your profile, photos, admit card, matches and messages for good.</p>
    </InfoPage>
  );
}
