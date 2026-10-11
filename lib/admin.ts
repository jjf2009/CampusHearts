/** Admins are listed by email in ADMIN_EMAILS (comma or space separated). */
export function adminEmails(raw = process.env.ADMIN_EMAILS ?? ""): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
}

export function isAdminEmail(email: string | null | undefined, raw?: string): boolean {
  if (!email) return false;
  return adminEmails(raw).includes(email.trim().toLowerCase());
}
