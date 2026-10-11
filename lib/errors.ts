/** Turns raw Postgres / PostgREST errors into something a student can act on. */
export function friendlyError(message: string | null | undefined): string {
  const m = message ?? "";
  if (/Daily like limit|Slow down|too many reports/i.test(m)) return m.replace(/^.*?:\s*/, "");
  if (/row-level security/i.test(m)) return "That's not possible right now. They may have changed their settings.";
  if (/duplicate key|already exists/i.test(m)) return "Already done!";
  if (/check constraint.*body/i.test(m)) return "Messages need 1 to 1000 characters.";
  if (/JWT|not authenticated|Auth session/i.test(m)) return "Your session expired. Please log in again.";
  if (/Failed to fetch|NetworkError|network/i.test(m)) return "You seem to be offline. Check your connection.";
  if (/Match not found/i.test(m)) return "This chat isn't available any more.";
  return m || "Something went wrong. Please try again.";
}
