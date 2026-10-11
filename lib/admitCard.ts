// Reads a Goa College of Engineering "Provisional Admit Card" and decides
// whether it can verify a fresher automatically.
//
// The portal PDFs (made with xhtml2pdf) have a text layer laid out as
// "Label : value" lines. Anything that doesn't look exactly like that goes to
// an admin instead of being trusted.

import type { Gender } from "@/lib/supabase/types";

export interface AdmitCard {
  /** Temporary Reg No, e.g. "T09001". Unique per student. */
  regNo: string | null;
  fullName: string | null;
  /** ISO date, e.g. "2008-03-09". */
  dob: string | null;
  gender: Gender | null;
  /** As printed, e.g. "Bachelors in Computer Engineering". */
  branchRaw: string | null;
  /** Mapped onto our branch list, e.g. "Computer". */
  branch: string | null;
  /** "FE" for first years. */
  year: string | null;
  admissionYear: string | null;
  gecEmail: string | null;
  isGec: boolean;
  isProvisionalCard: boolean;
}

export type CardDecision =
  | { outcome: "auto" }
  | { outcome: "review"; reason: string }
  | { outcome: "reject"; reason: string };

const LABELS = [
  "Temporary Reg No",
  "Full Name",
  "Father's Name",
  "Mobile Number",
  "Date of Birth",
  "Gender",
  "Blood Group",
  "Address",
  "Department",
  "Branch",
  "Admission Category",
  "Year",
  "Admission Year",
  "Registration Date",
  "Admission Round",
  "Email ID",
  "Amount",
];

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The value after `Label :` up to the end of the line or the next known label. */
function field(text: string, label: string): string | null {
  const others = LABELS.filter((l) => l !== label).map(escapeRegex).join("|");
  const re = new RegExp(
    `(?:^|\\n|\\s)${escapeRegex(label)}\\.?(?:\\s*\\([^)]*\\))?\\s*:\\s*(.+?)\\s*(?=\\n|(?:${others})\\.?(?:\\s*\\([^)]*\\))?\\s*:|$)`,
    "i"
  );
  const value = text.match(re)?.[1]?.trim();
  return value || null;
}

/** "March 9, 2008" / "Sept. 14, 2008" / "Nov. 4, 2007" -> "2008-03-09" */
export function parseCardDate(value: string | null): string | null {
  if (!value) return null;
  const m = value.match(/([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (!m) return null;
  const month = MONTHS[m[1].slice(0, 3).toLowerCase()];
  const day = Number(m[2]);
  const year = Number(m[3]);
  if (!month || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1) return null;
  return date.toISOString().slice(0, 10);
}

export function ageFromDob(dob: string, today = new Date()): number {
  const [y, m, d] = dob.split("-").map(Number);
  let age = today.getUTCFullYear() - y;
  const beforeBirthday =
    today.getUTCMonth() + 1 < m || (today.getUTCMonth() + 1 === m && today.getUTCDate() < d);
  if (beforeBirthday) age--;
  return age;
}

/** "Bachelors in Computer Engineering" -> "Computer" (see BRANCHES in lib/profileOptions). */
export function mapBranch(raw: string | null): string | null {
  if (!raw) return null;
  const b = raw.toLowerCase();
  if (b.includes("vlsi")) return "VLSI";
  if (b.includes("information technology")) return "IT";
  if (b.includes("telecommunication") || b.includes("e&tc") || b.includes("etc")) return "E&TC";
  if (b.includes("electronics") && b.includes("computer")) return "Electronics & Computer";
  if (b.includes("electrical")) return "Electrical & Electronics";
  if (b.includes("computer")) return "Computer";
  if (b.includes("mechanical")) return "Mechanical";
  if (b.includes("civil")) return "Civil";
  return "Other";
}

export function parseAdmitCard(rawText: string): AdmitCard {
  const text = rawText.replace(/\r/g, "").replace(/[ \t]+/g, " ");
  const upper = text.toUpperCase();

  const regNo = text.match(/Temporary Reg No\.?\s*:\s*(T\d{5})\b/i)?.[1]?.toUpperCase() ?? null;
  const genderRaw = field(text, "Gender")?.toLowerCase() ?? "";
  const gender: Gender | null = genderRaw.startsWith("female")
    ? "female"
    : genderRaw.startsWith("male")
      ? "male"
      : null;
  const branchRaw = field(text, "Branch");
  const gecEmail = text.match(/Email ID\s*\(GEC\)\s*:\s*([A-Za-z0-9._%+-]+@gec\.ac\.in)/i)?.[1]?.toLowerCase() ?? null;

  return {
    regNo,
    fullName: field(text, "Full Name"),
    dob: parseCardDate(field(text, "Date of Birth")),
    gender,
    branchRaw,
    branch: mapBranch(branchRaw),
    year: text.match(/(?:^|\n|\s)Year\s*:\s*([A-Z]{2})\b/)?.[1] ?? null,
    admissionYear: text.match(/Admission Year\s*:\s*(\d{4})/i)?.[1] ?? null,
    gecEmail,
    isGec: upper.includes("GOA COLLEGE OF ENGINEERING"),
    isProvisionalCard: upper.includes("PROVISIONAL ADMIT CARD"),
  };
}

/**
 * auto   -> verify instantly
 * review -> looks like a real card but something is unusual; an admin checks it
 * reject -> not a GEC first-year admit card at all (or unreadable)
 */
export function assessCard(
  card: AdmitCard,
  { producer, expectedYear }: { producer: string | null | undefined; expectedYear: string }
): CardDecision {
  if (!card.isGec) {
    return { outcome: "reject", reason: "This isn't a Goa College of Engineering admit card." };
  }
  if (!card.isProvisionalCard) {
    return { outcome: "reject", reason: "Please upload your Provisional Admit Card from the GEC portal." };
  }
  if (card.admissionYear && card.admissionYear !== expectedYear) {
    return {
      outcome: "reject",
      reason: `This card is for the ${card.admissionYear} intake. Seniors can sign in with their @gec.ac.in email instead.`,
    };
  }
  if (card.year && card.year !== "FE") {
    return {
      outcome: "reject",
      reason: "Admit-card verification is for first years. Seniors can sign in with their @gec.ac.in email.",
    };
  }
  if (!card.regNo || !card.fullName || !card.gender || !card.dob || !card.admissionYear || !card.year) {
    return {
      outcome: "review",
      reason: "We couldn't read every detail on this card, so an admin will check it.",
    };
  }
  if (!/xhtml2pdf/i.test(producer ?? "")) {
    return {
      outcome: "review",
      reason: "This PDF doesn't look like the original from the GEC portal, so an admin will check it.",
    };
  }
  return { outcome: "auto" };
}

/** "ANIKA RAVI TESTKAR" -> "Anika" */
export function firstNameFrom(fullName: string | null): string {
  const first = fullName?.trim().split(/\s+/)[0] ?? "";
  return first ? first[0].toUpperCase() + first.slice(1).toLowerCase() : "";
}
