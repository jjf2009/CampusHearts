// components/home/ForYouSection.tsx
"use client";
import { motion } from "framer-motion";
import { CheckIcon } from "@/components/ui/icons";

const sides = [
  {
    label: "Find your partner",
    title: "Go with someone who gets you",
    points: [
      "Take the quiz: dance floor or deep talks, Bollywood or EDM",
      "See your most compatible freshers first, with a match %",
      "Like them back and it's a match, no awkward DMs",
    ],
    accent: "from-rose-soft/30 to-peach/30",
  },
  {
    label: "Stay safe",
    title: "Your photos stay yours",
    points: [
      "Photos are encrypted and never sent as a downloadable image",
      "They only show while someone presses and holds",
      "Every view is watermarked with the viewer's name",
    ],
    accent: "from-lavender/40 to-peach/20",
  },
];

export default function ForYouSection() {
  return (
    <section className="bg-cream px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="eyebrow">Freshers night, sorted</p>
          <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
            Here&apos;s what to expect
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {sides.map((side, index) => (
            <motion.div
              key={side.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`rounded-[2rem] bg-gradient-to-br ${side.accent} p-8 sm:p-10`}
            >
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide text-rose-ink uppercase">
                {side.label}
              </span>
              <h3 className="mt-5 font-serif text-3xl font-medium text-charcoal">{side.title}</h3>
              <ul className="mt-6 space-y-3">
                {side.points.map((point) => (
                  <li key={point} className="flex gap-3 text-charcoal/85">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-rose-ink">
                      <CheckIcon width={12} height={12} strokeWidth={2.5} />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
