// components/home/FeatureSection.tsx
"use client";
import { motion } from "framer-motion";
import { HeartIcon, MailIcon, UserIcon, WhatsAppIcon } from "@/components/ui/icons";

const steps = [
  {
    icon: MailIcon,
    title: "Sign in with your college email",
    description: "We send a one-time code to your college address. No passwords, and no one from outside campus.",
  },
  {
    icon: UserIcon,
    title: "Make your profile",
    description: "Three photos, a short bio and a few interests. It takes about two minutes.",
  },
  {
    icon: HeartIcon,
    title: "She sends a love request",
    description: "Women browse profiles and send requests. Men see who's interested and accept or decline.",
  },
  {
    icon: WhatsAppIcon,
    title: "Match and say hi",
    description: "Once a request is accepted, you can both unlock each other's WhatsApp number and take it from there.",
  },
];

export default function FeatureSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-cream px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
            From hello to WhatsApp in four steps
          </h2>
        </div>

        <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connector line (desktop) */}
          <div
            aria-hidden="true"
            className="absolute top-8 right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-rose-soft/0 via-rose-soft/50 to-rose-soft/0 lg:block"
          />
          {steps.map((step, index) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative text-center"
            >
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-rose-ink shadow-[var(--shadow-soft)]">
                <step.icon width={26} height={26} />
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-deep text-xs font-semibold text-white">
                  {index + 1}
                </span>
              </div>
              <h3 className="mt-6 font-serif text-xl font-medium text-charcoal">{step.title}</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted">{step.description}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
