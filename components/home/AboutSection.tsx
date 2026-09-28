// components/home/AboutSection.tsx
"use client";
import { motion } from "framer-motion";
import { HeartIcon, LockIcon, ShieldIcon } from "@/components/ui/icons";

const values = [
  {
    icon: HeartIcon,
    title: "She makes the first move",
    description:
      "Only women can send love requests. No flood of unwanted messages, no pressure. Just people who are actually interested.",
  },
  {
    icon: ShieldIcon,
    title: "Students only",
    description:
      "Every account is tied to a verified college email. The people you see go to college in Goa, just like you.",
  },
  {
    icon: LockIcon,
    title: "Your number stays private",
    description:
      "Your WhatsApp number is hidden from everyone. It only unlocks for someone after you've both said yes.",
  },
];

export default function AboutSection() {
  return (
    <section id="why" className="scroll-mt-20 bg-blush px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <p className="eyebrow">Why Campus Heart</p>
          <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
            Dating that feels safe
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Big dating apps are crowded with strangers. This one is small, local, and built so no one gets
            overwhelmed.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card-soft rounded-3xl p-8"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blush text-rose-ink">
                <value.icon width={24} height={24} />
              </div>
              <h3 className="mt-6 font-serif text-xl font-medium text-charcoal">{value.title}</h3>
              <p className="mt-3 leading-relaxed text-muted">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
