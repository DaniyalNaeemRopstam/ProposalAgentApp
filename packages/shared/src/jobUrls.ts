/** Dev/demo seeds across platforms (Wellfound slugs, HN item ids, etc.). */
const PLACEHOLDER_PATTERN = /example-\d+/i;

/** True when URL is a real external listing (not dev placeholder / empty). */
export function isValidJobListingUrl(url: string | undefined | null): boolean {
  if (!url || !url.trim()) return false;
  const trimmed = url.trim();
  try {
    const u = new URL(trimmed);
    const blob = `${u.hostname}${u.pathname}${u.search}`;
    if (PLACEHOLDER_PATTERN.test(blob)) return false;

    const path = u.pathname.toLowerCase();
    if (path === "/jobs" || path === "/jobs/") return false;

    // Hacker News: item?id must be a numeric story/comment id
    if (u.hostname === "news.ycombinator.com" && path === "/item") {
      const id = u.searchParams.get("id");
      if (!id || !/^\d+$/.test(id)) return false;
    }

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
