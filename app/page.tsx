import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { LogoMark } from "@/components/ui/Logo";

const steps = [
  { emoji: "📄", title: "Verify", text: "Freshers upload their GEC admit card. Seniors log in with their @gec.ac.in email." },
  { emoji: "✏️", title: "Make a profile", text: "3 photos, a few details and a fun quiz. Pick dating, friends, or both." },
  { emoji: "💘", title: "Like people", text: "Browse, search, filter or swipe. Best matches show up first." },
  { emoji: "💬", title: "Match & chat", text: "Like each other and a chat opens. Share your WhatsApp only if you want." },
];

const promises = [
  ["🎓", "GEC students only", "Every account is checked against an admit card or a college email."],
  ["🔒", "Photos locked", "Encrypted, shown only while held, stamped with the viewer's name."],
  ["🙈", "Numbers private", "Chat inside Campus Buddy. Sharing WhatsApp is always your choice."],
  ["🚩", "Block & report", "One tap. Admins review every report and ban people who break the rules."],
] as const;

const faqs = [
  ["I'm a fresher without an ID card or GEC email. Can I join?", "Yes! Log in with any email, then upload the Provisional Admit Card PDF from the GEC portal. It's checked in seconds. Only have a printed copy? Upload a photo and an admin checks it, usually within a day."],
  ["Is it only for dating?", "No. Pick Dating, Friends or Both. Friends mode lets you meet anyone, any gender. Dating only shows people who are interested in each other."],
  ["Can people screenshot my photos?", "We make it as hard as a website can: photos are encrypted, never sent as a normal image, only visible while someone holds them, and stamped with the viewer's name. No website can fully block a phone's screenshot button, but any leak can be traced."],
  ["Who sees my phone number?", "Nobody, unless you tap \"Share my WhatsApp\" inside a chat with a match."],
  ["What if someone is creepy?", "Block or report them from the ⋯ menu. Blocking hides you both from each other immediately. Admins review reports and ban rule-breakers."],
  ["Is it free?", "Yes, completely."],
] as const;

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-5xl px-4 pt-10 pb-14 text-center sm:pt-16">
          <LogoMark size={72} className="mx-auto animate-wiggle" />
          <p className="eyebrow mt-5">Goa College of Engineering only</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-display text-6xl leading-[0.95] sm:text-7xl">
            Find your <span className="highlight">people</span> at GEC.
            <br />
            <span className="scribble-underline text-rose-deep">Date or make friends.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-xl text-muted">
            Campus Buddy is a dating &amp; friendship site just for verified GEC students. Freshers welcome, even before
            you get your ID card.
          </p>
          <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Link href="/login" className="btn-primary rounded-full px-8 py-3.5 text-2xl">
              Join Campus Buddy
            </Link>
            <a href="#how" className="btn-ghost rounded-full px-8 py-3.5 text-2xl">
              How it works
            </a>
          </div>
          <p className="mt-4 text-base text-faint">Free · No passwords · Takes 3 minutes</p>
        </section>

        <section id="how" className="scroll-mt-4 border-y-2 border-ink bg-paper-2 px-4 py-14">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-display text-5xl">How it works</h2>
            <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.title} className={`sketch p-5 ${i % 2 ? "tilt-r" : "tilt-l"}`}>
                  <p className="text-4xl" aria-hidden="true">
                    {s.emoji}
                  </p>
                  <h3 className="mt-2 font-display text-3xl">
                    {i + 1}. {s.title}
                  </h3>
                  <p className="mt-1 text-lg text-muted">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-center font-display text-5xl">
            Safe by <span className="highlight">design</span>
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {promises.map(([emoji, title, text]) => (
              <li key={title} className="sketch flex gap-4 p-5">
                <span className="text-4xl" aria-hidden="true">
                  {emoji}
                </span>
                <div>
                  <h3 className="font-display text-3xl">{title}</h3>
                  <p className="text-lg text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section id="faq" className="border-t-2 border-ink bg-paper-2 px-4 py-14">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center font-display text-5xl">Questions</h2>
            <div className="mt-6 space-y-3">
              {faqs.map(([q, a]) => (
                <details key={q} className="sketch group p-4">
                  <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-3 text-xl font-bold">
                    {q}
                    <span className="text-2xl transition group-open:rotate-45" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-lg text-muted">{a}</p>
                </details>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/login" className="btn-primary inline-block rounded-full px-8 py-3.5 text-2xl">
                Let&apos;s go!
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
