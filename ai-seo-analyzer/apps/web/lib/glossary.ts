/**
 * Plain-language definitions for technical SEO terms, shown by
 * <GlossaryTerm> wherever one of these words appears in the UI. Keeps the
 * default reading level beginner-friendly without deleting the real term.
 */
export const glossary: Record<string, string> = {
  seo: "The practice of helping search engines (like Google) understand and recommend your site to people searching for related things.",
  canonical:
    "A note in your page's code that tells Google \"this is the main version of this page,\" so duplicate or similar pages don't confuse it.",
  schema:
    "Extra hidden info on your page that helps Google show richer results — like star ratings or event dates — directly in search.",
  "robots.txt":
    "A file that tells automated visitors (like Google's) which parts of your site they're allowed to look at.",
  "core web vitals":
    "Google's three measurements of how fast and stable your page feels to load and use.",
  backlink:
    "A link from someone else's website to yours — search engines treat these a bit like recommendations.",
  ctr: "Click-through rate: out of everyone who saw your page in search results, the percentage who actually clicked it.",
  "meta description":
    "The short preview text people see under your page's title in Google search results.",
  "alt text":
    "A written description of an image, used by screen readers and search engines that can't \"see\" pictures.",
  sitemap: "A list of all your pages that you hand to Google, so it knows what to look at.",
  crawl: "The process of an automated visitor (like Google's, or ours) systematically reading through your site's pages.",
  index: "Once Google has read a page and added it to its searchable database, that page is \"indexed.\"",
  "domain authority":
    "A third-party estimate (not a Google metric) of how trustworthy/influential a whole website appears, based on its backlinks.",
};

export type GlossaryKey = keyof typeof glossary;
