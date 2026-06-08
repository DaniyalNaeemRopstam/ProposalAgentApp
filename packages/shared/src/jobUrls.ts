/** True when URL is a real external listing (not dev placeholder / empty). */
export function isValidJobListingUrl(url: string | undefined | null): boolean {
  if (!url || !url.trim()) return false;
  const trimmed = url.trim();
  try {
    const u = new URL(trimmed);
    const path = u.pathname.toLowerCase();
    // Dev seeds like https://wellfound.com/jobs/example-3
    if (/\/jobs\/example-\d+/.test(path)) return false;
    if (path === "/jobs" || path === "/jobs/") return false;
    if (path.includes("/example")) return false;
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function resolveJobListingUrl(job: {
  sourceUrl?: string | null;
  url?: string | null;
}): string | null {
  const candidate = job.sourceUrl?.trim() || job.url?.trim() || "";
  return isValidJobListingUrl(candidate) ? candidate : null;
}
