// components/home/FeatureSection.tsx
"use client";
import { Card, CardBody } from "@heroui/react";
import { motion } from "framer-motion";

const features = [
    {
        icon: "✉️",
        title: "Letters, Not Swipes",
        description:
            "Express yourself through thoughtful, handwritten-style digital letters that take time to compose and arrive.",
    },
    {
        icon: "🌅",
        title: "Words Before Looks",
        description:
            "No profile photos upfront. Connect based on personality, not appearances. Visuals come later, naturally.",
    },
    {
        icon: "🕊️",
        title: "Emotionally Safe",
        description:
            "A slower pace means fewer impulsive reactions. No instant replies. No pressure. Just space to be honest.",
    },
    {
        icon: "🎓",
        title: "Campus Exclusive",
        description:
            "Only verified college students in Goa. A smaller, more familiar community where trust can grow.",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 },
    },
};

export default function FeatureSection() {
    return (
        <section id="how-it-works" className="px-6 py-24 bg-cream">
            <div className="mx-auto max-w-6xl">
                {/* Section header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-charcoal">
                        A different kind of dating
                    </h2>
                    <p className="mt-4 text-muted text-lg leading-relaxed">
                        When you remove the speed, you create room for something deeper.
                        Here&apos;s how Campus Heart is designed to be different.
                    </p>
                </div>

                {/* Feature grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {features.map((feature, index) => (
                        <motion.div key={index} variants={itemVariants}>
                            <Card
                                radius="lg"
                                shadow="none"
                                className="h-full bg-white border border-rose-soft/15 hover:border-rose-soft/30 transition-all hover:shadow-lg hover:-translate-y-1"
                            >
                                <CardBody className="p-6">
                                    <div className="text-3xl mb-4">{feature.icon}</div>
                                    <h3 className="font-serif text-lg font-medium text-charcoal">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-3 text-sm text-muted leading-relaxed">
                                        {feature.description}
                                    </p>
                                </CardBody>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
