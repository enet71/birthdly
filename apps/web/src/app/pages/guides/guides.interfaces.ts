export interface Guide {
  slug: string;
  // Translation keys.
  title: string;
  description: string;
  // ISO date shown on the page and used as `dateModified`; the sitemap uses it as `lastmod`.
  updatedAt: string;
}
