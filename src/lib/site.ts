export const SITE = {
  url: "https://fourpielabs.com",
  name: "4Pie Labs",
  // Pivot-aligned. Used as the fallback for openGraph.description and
  // twitter.description in the root layout, so every page that does not
  // override these reads from here. Keep <= 155 chars so social cards do
  // not truncate.
  description:
    "4Pie Labs builds AI-first marketing for local service businesses, getting you found first on Google, Maps, and AI search like ChatGPT.",
  twitter: "@4pielabs",
} as const;
