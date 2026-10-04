// components/home/FAQSection.tsx
"use client";
import { Accordion, AccordionItem } from "@heroui/react";
import { motion } from "framer-motion";

const faqs = [
  {
    key: "1",
    question: "Who can join?",
    answer:
      "Any student at our college. Seniors sign in with their college email. Freshers without an ID card or college email sign in with any email and upload the admission letter PDF they received. We check the college name, intake year, your name and admission number automatically, and one letter can only be used for one account.",
  },
  {
    key: "2",
    question: "Can people screenshot my photos?",
    answer:
      "We make it as hard as a website can. Photos are stored encrypted, are never sent as a normal image, only appear while someone presses and holds, vanish the moment they switch apps, and are stamped with the viewer's name. No website can fully block a phone's screenshot button, but any leak can be traced back to whoever took it.",
  },
  {
    key: "3",
    question: "When is my phone number shared?",
    answer:
      "Only after a love request is accepted. Until then your number is hidden from everyone, and even then only your match can unlock it.",
  },
  {
    key: "4",
    question: "What happens if I decline a request?",
    answer:
      "Nothing awkward. The request just disappears. The sender isn't told why, and they can't send you another one. If you like someone who already liked you, it's an instant match.",
  },
  {
    key: "5",
    question: "Can I change my profile later?",
    answer:
      "Yes. You can update your photos, bio, interests and details from your profile page at any time.",
  },
  {
    key: "6",
    question: "Is Campus Heart free?",
    answer: "Yes. It's completely free during our beta.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="scroll-mt-20 bg-blush px-6 py-24">
      <div className="mx-auto max-w-3xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
            Good questions
          </h2>
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
              base: "bg-white border border-rose-soft/15 shadow-none rounded-2xl px-6",
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
