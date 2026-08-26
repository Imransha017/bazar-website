// Products can be tagged with multiple categories / subcategories / options.
// The admin UI stores them as a comma-separated string in a single column, so
// every reader must treat those columns as lists, not single slugs.

export const slugList = (v?: string | null): string[] =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const nameList = (v?: string | null): string[] =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const hasSlug = (v: string | null | undefined | string[], slug: string): boolean => {
  if (!slug) return false;
  const list = Array.isArray(v) ? v : slugList(v);
  return list.includes(slug);
};

/** Pair up a comma list of slugs with its comma list of display names. */
export const pairSlugNames = (
  slugs?: string | null,
  names?: string | null,
): Array<{ slug: string; name: string }> => {
  const s = slugList(slugs);
  const n = nameList(names);
  return s.map((slug, i) => ({ slug, name: n[i] ?? slug }));
};
