// components/home/CTASection.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <section className="bg-cream px-4 py-20 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-rose-soft via-rose-deep to-[#9e6a86] px-6 py-16 text-center sm:px-12 sm:py-20"
      >
        <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 -bottom-20 h-72 w-72 rounded-full bg-peach/30 blur-3xl" />

        <div className="relative">
          <Image
            src="/CampusHeartLogo.png"
            alt=""
            width={64}
            height={64}
            className="mx-auto rounded-2xl bg-white/90 p-2"
          />
          <h2 className="mx-auto mt-8 max-w-2xl font-serif text-4xl font-medium tracking-tight text-white sm:text-5xl">
            Your campus crush might already be here.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-lg text-white/85">
            Make your profile in two minutes and see who&apos;s around.
          </p>
          <Link
            href="/login"
            className="mt-10 inline-flex rounded-full bg-white px-10 py-4 text-lg font-medium text-rose-ink shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Join Campus Heart
          </Link>
          <p className="mt-6 text-sm text-white/75">
            Free · College email required · Goa colleges only
          </p>
        </div>
      </motion.div>
    </section>
  );
}
