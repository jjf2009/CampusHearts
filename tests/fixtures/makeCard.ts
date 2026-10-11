import { PDFDocument, StandardFonts } from "pdf-lib";

/** Fake student details. Never put real student data in tests. */
export interface FakeCard {
  regNo?: string;
  fullName?: string;
  dob?: string;
  gender?: string;
  branch?: string;
  year?: string;
  admissionYear?: string;
  email?: string;
  college?: string;
  title?: string;
}

export const FAKE: Required<FakeCard> = {
  regNo: "T09001",
  fullName: "ANIKA RAVI TESTKAR",
  dob: "Sept. 07, 2008",
  gender: "Female",
  branch: "Bachelors in Computer Engineering",
  year: "FE",
  admissionYear: "2026",
  email: "art1.s26@gec.ac.in",
  college: "GOA COLLEGE OF ENGINEERING",
  title: "PROVISIONAL ADMIT CARD - Valid till October 2026",
};

/** The text layout of a GEC portal admit card, with fake values. */
export function cardLines(card: FakeCard = {}): string[] {
  const c = { ...FAKE, ...card };
  return [
    c.college,
    "FARMAGUDI, PONDA, GOA - 403401",
    "Website: www.gec.ac.in, Email: ppl@gec.ac.in",
    "Government of Goa",
    c.title,
    "Bachelor of Engineering Admission 2026-27",
    `Temporary Reg No. : ${c.regNo}`,
    `Full Name : ${c.fullName}`,
    "Father's Name : RAVI TESTKAR",
    "Mobile Number : 9000000000",
    `Date of Birth : ${c.dob}`,
    `Gender : ${c.gender}`,
    "Blood Group : O+",
    "Address : H No. 1, Test Lane, Ponda-Goa",
    "Department : Computer Engineering Department",
    `Branch : ${c.branch}`,
    "Admission Category: General Category",
    `Year : ${c.year}`,
    `Admission Year : ${c.admissionYear}`,
    "Registration Date : 2026-06-29",
    "Admission Round : 1",
    `Email ID (GEC) : ${c.email}`,
    "Amount : Rs.15100.00",
  ];
}

export async function makeCardPdf(
  card: FakeCard = {},
  { producer = "xhtml2pdf <https://github.com/xhtml2pdf/xhtml2pdf/>", lines }: { producer?: string; lines?: string[] } = {}
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setProducer(producer);
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  (lines ?? cardLines(card)).forEach((line, i) =>
    page.drawText(line, { x: 40, y: 800 - i * 22, size: 11, font })
  );
  return Buffer.from(await doc.save());
}

/** A PDF with no text layer at all (like a scan). */
export async function makeBlankPdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.addPage();
  return Buffer.from(await doc.save());
}
