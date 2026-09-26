// components/home/HomeSection.tsx (Hero Section)
"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { CapIcon, CheckIcon, HeartIcon, MapPinIcon, ShieldIcon, XIcon } from "@/components/ui/icons";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
});

/** Illustrative phone mock of the Explore screen. Not a real profile. */
function PhoneMock() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[300px]">
      {/* Back card */}
      <div className="absolute inset-x-6 top-6 bottom-0 rotate-6 rounded-[2.25rem] bg-lavender/40" />

      <div className="relative rounded-[2.5rem] border-8 border-white bg-white shadow-[0_30px_60px_-20px_rgba(160,90,90,0.35)]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-t-[1.75rem] bg-gradient-to-br from-peach via-rose-soft to-lavender">
          {/* Abstract portrait */}
          <div className="absolute top-[22%] left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-white/35" />
          <div className="absolute -bottom-10 left-1/2 h-40 w-56 -translate-x-1/2 rounded-[50%] bg-white/30" />

          <div className="absolute inset-x-3 top-3 flex gap-1.5">
            <span className="h-1 flex-1 rounded-full bg-white" />
            <span className="h-1 flex-1 rounded-full bg-white/40" />
            <span className="h-1 flex-1 rounded-full bg-white/40" />
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 pt-10 pb-3 text-white">
            <p className="font-serif text-2xl">Rohan</p>
            <div className="flex gap-3 text-xs text-white/90">
              <span className="flex items-center gap-1">
                <CapIcon width={12} height={12} /> Year 3
              </span>
              <span className="flex items-center gap-1">
                <MapPinIcon width={12} height={12} /> Panaji
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2 px-4 pt-3 pb-4">
          <p className="text-xs leading-relaxed text-charcoal">
            Sunset at Miramar, bad puns, and the best ros omelette in town.
          </p>
          <div className="flex gap-1.5">
            {["music", "football", "cafés"].map((tag) => (
              <span key={tag} className="rounded-full bg-peach/40 px-2 py-0.5 text-[10px] text-charcoal">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex justify-center gap-4 pt-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-rose-soft/30 text-muted">
              <XIcon width={18} height={18} />
            </span>
            <span className="btn-primary flex h-11 w-11 items-center justify-center rounded-full text-white">
              <HeartIcon width={20} height={20} fill="currentColor" />
            </span>
          </div>
        </div>
      </div>

      {/* Floating notification */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="absolute -right-4 bottom-24 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-lg sm:-right-10"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckIcon width={14} height={14} />
        </span>
        <span className="text-xs font-medium text-charcoal">It&apos;s a match!</span>
      </motion.div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-warm px-6 pt-28 pb-20 sm:pt-32 lg:pb-28">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-20 -left-20 h-72 w-72 rounded-full bg-rose-soft/15 blur-3xl" />
        <div className="absolute -right-10 bottom-10 h-96 w-96 rounded-full bg-peach/20 blur-3xl" />
        <div className="absolute top-1/3 right-1/3 h-64 w-64 rounded-full bg-lavender/15 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="text-center lg:text-left">
          <motion.p
            {...fadeUp(0)}
            className="inline-flex items-center gap-2 rounded-full border border-rose-soft/30 bg-white/60 px-4 py-1.5 text-sm text-muted"
          >
            <ShieldIcon width={16} height={16} className="text-rose-ink" />
            Only for college students in Goa
          </motion.p>

          <motion.h1
            {...fadeUp(0.1)}
            className="mt-6 font-serif text-5xl leading-[1.05] font-medium tracking-tight text-charcoal sm:text-6xl lg:text-7xl"
          >
            Meet someone
            <br />
            from campus.
            <br />
            <span className="text-rose-ink italic">She goes first.</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.2)}
            className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-muted lg:mx-0"
          >
            Campus Heart is a dating app just for verified students. Women send love requests, men choose who
            to accept, and numbers are only shared once you both say yes.
          </motion.p>

          <motion.div
            {...fadeUp(0.3)}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <Link
              href="/login"
              className="btn-primary w-full rounded-full px-8 py-4 text-center text-lg font-medium text-white shadow-md sm:w-auto"
            >
              Join with college email
            </Link>
            <a
              href="#how-it-works"
              className="btn-ghost w-full rounded-full px-8 py-4 text-center text-lg font-medium sm:w-auto"
            >
              How it works
            </a>
          </motion.div>

          <motion.ul
            {...fadeUp(0.4)}
            className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted lg:justify-start"
          >
            {["Free to join", "No passwords", "Private until you match"].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckIcon width={16} height={16} className="text-rose-ink" />
                {item}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <PhoneMock />
        </motion.div>
      </div>
    </section>
  );
}
