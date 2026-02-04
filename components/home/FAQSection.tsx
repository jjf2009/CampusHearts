// components/home/FAQSection.tsx
"use client";
import { Accordion, AccordionItem } from "@heroui/react";
import { motion } from "framer-motion";

const faqs = [
  {
    key: "1",
    question: "Why letters instead of instant chat?",
    answer:
      "Instant chat encourages impulsive, reactive communication. Letters slow things down and create space for thoughtfulness. When you know your message will take time to arrive, you write differently — more honestly, more intentionally.",
  },
  {
    key: "2",
    question: "Why do letters take time to arrive?",
    answer:
      "The delay is a feature, not a limitation. It builds anticipation, reduces pressure, and encourages patience. Just like real letters, the waiting is part of the experience.",
  },
  {
    key: "3",
    question: "Is this only for college students in Goa?",
    answer:
      "Yes. Campus Heart is built exclusively for students in Goa's colleges. Keeping the community smaller and local creates a safer, more relatable environment where genuine connections can form.",
  },
  {
    key: "4",
    question: "Do I need to upload my photos?",
    answer:
      "No. Your profile focuses on words first. If you choose to share photos later, that happens naturally as trust builds — not as a first impression.",
  },
  {
    key: "5",
    question: "Is Campus Heart free to use?",
    answer:
      "Yes. The core experience is completely free during our beta phase. We believe connection shouldn't have a paywall.",
  },
];

export default function FAQSection() {
  return (
    <section className="px-6 py-24 bg-blush">
      <div className="mx-auto max-w-3xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-charcoal">
            Questions you might have
          </h2>
          <p className="mt-4 text-muted text-lg">
            A few things to know before you start writing.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Accordion
            variant="splitted"
            className="gap-4"
            itemClasses={{
              base: "bg-white border border-rose-soft/15 shadow-sm rounded-xl px-6",
              title: "font-medium text-charcoal text-base",
              trigger: "py-5",
              content: "text-muted pb-5 leading-relaxed",
            }}
          >
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.key}
                aria-label={faq.question}
                title={faq.question}
              >
                {faq.answer}
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
