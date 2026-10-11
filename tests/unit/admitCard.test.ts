import { describe, expect, it } from "vitest";
import { extractText, getDocumentProxy, getMeta } from "unpdf";
import {
  ageFromDob,
  assessCard,
  firstNameFrom,
  mapBranch,
  parseAdmitCard,
  parseCardDate,
} from "@/lib/admitCard";
import { cardLines, makeCardPdf } from "../fixtures/makeCard";

const PORTAL = "xhtml2pdf <https://github.com/xhtml2pdf/xhtml2pdf/>";
const parse = (overrides = {}) => parseAdmitCard(cardLines(overrides).join("\n"));
const assess = (card = parse(), producer: string | null = PORTAL) =>
  assessCard(card, { producer, expectedYear: "2026" });

describe("parseAdmitCard", () => {
  it("reads every field from the portal layout", () => {
    expect(parse()).toEqual({
      regNo: "T09001",
      fullName: "ANIKA RAVI TESTKAR",
      dob: "2008-09-07",
      gender: "female",
      branchRaw: "Bachelors in Computer Engineering",
      branch: "Computer",
      year: "FE",
      admissionYear: "2026",
      gecEmail: "art1.s26@gec.ac.in",
      isGec: true,
      isProvisionalCard: true,
    });
  });

  it("reads fields when the text layer runs lines together", () => {
    const card = parseAdmitCard(cardLines().join(" "));
    expect(card.fullName).toBe("ANIKA RAVI TESTKAR");
    expect(card.gender).toBe("female");
    expect(card.regNo).toBe("T09001");
    expect(card.year).toBe("FE");
  });

  it("does not confuse 'Admission Year' with 'Year' or Female with Male", () => {
    const card = parse({ gender: "Male", year: "SE" });
    expect(card.gender).toBe("male");
    expect(card.year).toBe("SE");
    expect(card.admissionYear).toBe("2026");
  });

  it("handles mixed-case names and every month abbreviation used by the portal", () => {
    expect(parse({ fullName: "Ayra Mehta Testcase" }).fullName).toBe("Ayra Mehta Testcase");
    for (const [raw, iso] of [
      ["March 9, 2008", "2008-03-09"],
      ["Nov. 4, 2007", "2007-11-04"],
      ["Sept. 14, 2008", "2008-09-14"],
      ["Oct. 06, 2008", "2008-10-06"],
      ["June 27, 2008", "2008-06-27"],
      ["May 3, 2008", "2008-05-03"],
    ]) {
      expect(parseCardDate(raw)).toBe(iso);
    }
    expect(parseCardDate("Feb. 30, 2008")).toBeNull();
    expect(parseCardDate("sometime")).toBeNull();
  });

  it("returns nulls rather than guessing on garbage", () => {
    const card = parseAdmitCard("hello world, this is not an admit card");
    expect(card).toMatchObject({ regNo: null, fullName: null, gender: null, isGec: false, isProvisionalCard: false });
  });

  it("only accepts T + 5 digit reg numbers", () => {
    expect(parse({ regNo: "T123" }).regNo).toBeNull();
    expect(parse({ regNo: "X09001" }).regNo).toBeNull();
  });
});

describe("assessCard", () => {
  it("auto-verifies a complete portal card", () => {
    expect(assess()).toEqual({ outcome: "auto" });
  });

  it("sends non-portal PDFs (Word, edited, re-saved) to review", () => {
    expect(assess(parse(), "Microsoft® Word for Microsoft 365").outcome).toBe("review");
    expect(assess(parse(), null).outcome).toBe("review");
  });

  it("sends cards with missing details to review", () => {
    expect(assess(parse({ gender: "Other" })).outcome).toBe("review");
    expect(assess(parse({ dob: "unknown" })).outcome).toBe("review");
    expect(assess(parse({ regNo: "nope" })).outcome).toBe("review");
  });

  it("rejects other colleges, other documents, other intakes and seniors", () => {
    expect(assess(parse({ college: "SOME OTHER COLLEGE" }))).toMatchObject({ outcome: "reject" });
    expect(assess(parse({ title: "FEE RECEIPT" }))).toMatchObject({ outcome: "reject" });
    expect(assess(parse({ admissionYear: "2025" }))).toMatchObject({ outcome: "reject" });
    expect(assess(parse({ year: "SE" }))).toMatchObject({ outcome: "reject" });
  });
});

describe("helpers", () => {
  it("maps GEC branch names", () => {
    expect(mapBranch("Bachelors in Computer Engineering")).toBe("Computer");
    expect(mapBranch("Bachelors in Information Technology")).toBe("IT");
    expect(mapBranch("Bachelors in Electronics and Telecommunication Engineering")).toBe("E&TC");
    expect(mapBranch("Bachelors in Electronics and Computer Science")).toBe("Electronics & Computer");
    expect(mapBranch("Bachelors in Electrical and Electronics Engineering")).toBe("Electrical & Electronics");
    expect(mapBranch("Bachelors in Mechanical Engineering")).toBe("Mechanical");
    expect(mapBranch("Bachelors in Civil Engineering")).toBe("Civil");
    expect(mapBranch("Bachelors in VLSI Design and Technology")).toBe("VLSI");
    expect(mapBranch("Bachelors in Something New")).toBe("Other");
    expect(mapBranch(null)).toBeNull();
  });

  it("computes age around birthdays", () => {
    const today = new Date(Date.UTC(2026, 9, 11));
    expect(ageFromDob("2008-10-11", today)).toBe(18);
    expect(ageFromDob("2008-10-12", today)).toBe(17);
    expect(ageFromDob("2008-04-09", today)).toBe(18);
  });

  it("takes a nicely cased first name", () => {
    expect(firstNameFrom("ANIKA RAVI TESTKAR")).toBe("Anika");
    expect(firstNameFrom("  ayra  mehta ")).toBe("Ayra");
    expect(firstNameFrom(null)).toBe("");
  });
});

describe("real PDF round trip", () => {
  it("parses a generated portal-style PDF and reads its producer", async () => {
    const bytes = await makeCardPdf({ fullName: "ROHAN TEST NAIK", gender: "Male" });
    const doc = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(doc, { mergePages: true });
    const { info } = await getMeta(doc);
    const card = parseAdmitCard(text);
    expect(card).toMatchObject({ fullName: "ROHAN TEST NAIK", gender: "male", regNo: "T09001", year: "FE" });
    expect(assessCard(card, { producer: info.Producer, expectedYear: "2026" })).toEqual({ outcome: "auto" });
  });
});
