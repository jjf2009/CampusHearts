// components/home/CTASection.tsx
"use client";
import { Button } from "@heroui/react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

export default function CTASection() {
    return (
        <section className="relative px-6 py-24 overflow-hidden">
            {/* Warm gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-soft/20 via-peach/15 to-lavender/10"></div>

            {/* Decorative blurs */}
            <div className="absolute top-10 left-10 w-64 h-64 bg-rose-soft/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-lavender/15 rounded-full blur-3xl"></div>

            <div className="relative mx-auto max-w-3xl text-center">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <Image
                        src="/CampusHeartLogo.png"
                        alt="Campus Heart"
                        width={80}
                        height={80}
                        className="mx-auto opacity-80"
                    />
                </motion.div>

                {/* Headline */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-charcoal"
                >
                    Ready to write your first letter?
                </motion.h2>

                {/* Subtext */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mt-6 text-lg text-muted max-w-xl mx-auto leading-relaxed"
                >
                    Someone is out there, waiting to hear from you.
                    <br />
                    Take the first step — no rush, no pressure.
                </motion.p>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-10"
                >
                    <Button
                        as={Link}
                        href="/signup"
                        radius="full"
                        size="lg"
                        className="bg-gradient-to-r from-rose-soft to-rose-deep text-white font-medium px-10 py-6 text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                    >
                        Find Your Match
                    </Button>
                </motion.div>

                {/* Trust note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-8 text-sm text-muted/60"
                >
                    Free to join · No credit card required · Exclusively for Goa students
                </motion.p>
            </div>
        </section>
    );
}
