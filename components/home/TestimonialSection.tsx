// components/home/TestimonialSection.tsx
"use client";
import { motion } from "framer-motion";

const letters = [
    {
        quote:
            "I wrote to her about the monsoon, about how the rain makes me think too much. She wrote back about her grandmother's garden. We haven't met yet, but I already know her.",
        tag: "— a letter from someone waiting",
    },
    {
        quote:
            "He didn't know my face when he first wrote to me. He only knew my words. And still, he chose to keep writing. That meant more than any swipe ever could.",
        tag: "— a letter from someone found",
    },
    {
        quote:
            "I was tired of dating apps that made me feel like a product. Here, I feel like a person again. Someone worth waiting for.",
        tag: "— a letter from someone healing",
    },
];

export default function TestimonialSection() {
    return (
        <section className="px-6 py-24 bg-cream">
            <div className="mx-auto max-w-5xl">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center max-w-2xl mx-auto mb-16"
                >
                    <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-charcoal">
                        Letters from the heart
                    </h2>
                    <p className="mt-4 text-muted text-lg leading-relaxed">
                        Words shared by people who chose to slow down.
                    </p>
                </motion.div>

                {/* Letter quotes */}
                <div className="grid gap-8 md:grid-cols-3">
                    {letters.map((letter, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="relative"
                        >
                            <div className="bg-white rounded-2xl p-8 border border-rose-soft/15 shadow-sm h-full">
                                {/* Decorative quote mark */}
                                <div className="absolute -top-3 left-6 text-5xl text-rose-soft/30 font-serif">
                                    "
                                </div>

                                <p className="text-charcoal leading-relaxed italic text-lg font-light pt-4">
                                    {letter.quote}
                                </p>

                                <p className="mt-6 text-sm text-muted">
                                    {letter.tag}
                                </p>

                                {/* Bottom decoration */}
                                <div className="absolute bottom-8 right-8 w-8 h-8 opacity-10">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="text-rose-deep">
                                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
