// components/home/HomeSection.tsx (Hero Section)
"use client";
import { Button } from "@heroui/react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 pb-16 bg-gradient-warm overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-rose-soft/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-peach/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-lavender/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Logo animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Image
            src="/CampusHeartLogo.png"
            alt="Campus Heart"
            width={120}
            height={120}
            className="mx-auto animate-float"
            priority
          />
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight leading-tight text-charcoal"
        >
          Real connection
          <br />
          <span className="text-rose-deep italic">takes time</span>
          <br />
          <span className="text-3xl sm:text-4xl md:text-5xl text-muted font-normal">
            — and that&apos;s okay.
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 text-muted text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
        >
          Campus Heart is a slow dating space for college students in Goa.
          <br className="hidden sm:block" />
          Write thoughtful letters. Take your time. Build something real.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            as={Link}
            href="/signup"
            radius="full"
            size="lg"
            className="w-full sm:w-auto bg-gradient-to-r from-rose-soft to-rose-deep text-white font-medium px-8 py-6 text-lg shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
          >
            Find Your Match
          </Button>

          <Button
            as={Link}
            href="#how-it-works"
            variant="bordered"
            radius="full"
            size="lg"
            className="w-full sm:w-auto border-rose-soft/40 text-charcoal font-medium px-8 py-6 text-lg hover:bg-rose-soft/10 transition-all"
          >
            How It Works
          </Button>
        </motion.div>

        {/* Trust indicator */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-sm text-muted/70"
        >
          Built exclusively for college students in Goa
        </motion.p>
      </div>
    </section>
  );
}
