export interface AdmissionInput {
  /** Full name exactly as on the admission letter. */
  fullName: string;
  admissionNumber: string;
}

export interface AdmissionConfig {
  collegeKeywords: string[];
  admissionYear: string;
}

export type AdmissionResult = { ok: true } | { ok: false; reason: string };

function normalize(text: string) {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Admission numbers are compared with all spaces and punctuation removed. */
export function normalizeAdmissionNumber(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function admissionConfigFromEnv(): AdmissionConfig {
  return {
    collegeKeywords: (process.env.COLLEGE_NAME_KEYWORDS ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    admissionYear: (process.env.ADMISSION_YEAR ?? String(new Date().getFullYear())).trim(),
  };
}

/**
 * Checks the text of an admission-proof PDF against what the student typed.
 * Pure function so it can be tested without a PDF or a database.
 */
export function checkAdmissionText(
  pdfText: string,
  input: AdmissionInput,
  config: AdmissionConfig
): AdmissionResult {
  const text = normalize(pdfText);
  if (text.length < 40) {
    return {
      ok: false,
      reason:
        "We couldn't read any text in this PDF. Upload the original PDF you received from the college, not a scan or photo.",
    };
  }

  const padded = ` ${text} `;

  if (config.collegeKeywords.length === 0) {
    return { ok: false, reason: "Verification isn't configured yet. Please tell the organisers." };
  }
  if (!config.collegeKeywords.some((k) => padded.includes(` ${normalize(k)} `))) {
    return { ok: false, reason: "This doesn't look like an admission letter from our college." };
  }

  if (!text.includes(config.admissionYear)) {
    return { ok: false, reason: `This letter isn't for the ${config.admissionYear} intake.` };
  }

  const admission = normalizeAdmissionNumber(input.admissionNumber);
  if (admission.length < 4) {
    return { ok: false, reason: "Enter your full admission / application number." };
  }
  if (!text.replace(/ /g, "").toUpperCase().includes(admission)) {
    return { ok: false, reason: "Your admission number wasn't found in this PDF." };
  }

  const nameTokens = normalize(input.fullName).split(" ").filter((t) => t.length > 1);
  if (nameTokens.length === 0) {
    return { ok: false, reason: "Enter your full name as it appears on the letter." };
  }
  const missing = nameTokens.filter((t) => !padded.includes(` ${t} `));
  if (missing.length > 0) {
    return { ok: false, reason: "The name you entered doesn't match the name on the letter." };
  }

  return { ok: true };
}
