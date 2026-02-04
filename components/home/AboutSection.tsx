// components/home/AboutSection.tsx
"use client";
import { Card, CardBody } from "@heroui/react";
import { motion } from "framer-motion";

const values = [
  {
    title: "Patience Over Impulse",
    description:
      "Letters take time to arrive. The wait builds anticipation and intention. No more reactive, thoughtless messages.",
  },
  {
    title: "Depth Over Surface",
    description:
      "Without instant photo judgments, you're free to share who you really are. Connections form through words first.",
  },
  {
    title: "Safety Over Speed",
    description:
      "A slower platform is a calmer one. Less pressure, more honesty. A space where vulnerability feels safer.",
  },
];

export default function AboutSection() {
  return (
    <section className="px-6 py-24 bg-blush">
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
            Why slow down?
          </h2>
          <p className="mt-4 text-muted text-lg leading-relaxed">
            Modern dating apps optimize for engagement. We optimize for meaning.
            When you slow things down, everything changes.
          </p>
        </motion.div>

        {/* Value cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                radius="lg"
                shadow="none"
                className="h-full bg-white/70 backdrop-blur-sm border border-rose-soft/15 hover:bg-white transition-all"
              >
                <CardBody className="p-8">
                  <div className="w-12 h-1 bg-gradient-to-r from-rose-soft to-coral rounded-full mb-6"></div>
                  <h3 className="font-serif text-xl font-medium text-charcoal">
                    {value.title}
                  </h3>
                  <p className="mt-4 text-muted leading-relaxed">
                    {value.description}
                  </p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
