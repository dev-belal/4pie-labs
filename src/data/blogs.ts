export interface BlogFAQ {
  q: string;
  a: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  author: string;
  // Human-readable display date, e.g. "May 28, 2026". Shown in headers.
  date: string;
  // ISO 8601 form of the same date (YYYY-MM-DD). Used for the
  // BlogPosting JSON-LD schema's datePublished property where Schema.org
  // expects a Date type. Keep both in sync.
  datePublishedISO: string;
  readTime: string;
  image: string;
  excerpt: string;
  content: string;
  faqs?: BlogFAQ[];
}

// Categories the editorial pipeline actually uses, post-pivot. Order is the
// order shown in the BlogBrowser filter strip.
export const blogCategories = ["ALL", "AEO", "Local SEO"];

// Direct Pixabay CDN images per post. cdn.pixabay.com is already in
// next.config.ts remotePatterns, so Next's image optimizer can fetch and
// re-serve these. Each URL is the 1280px-wide variant; Next will resize
// down as needed per the <Image sizes=...> hint in the rendering
// components. Each image is also the post's OG image (set in the post
// page's generateMetadata via openGraph.images).
//
// Source page references (for swap-in later if any image needs replacing):
//   local-business-chatgpt-visibility ->
//     https://pixabay.com/photos/student-typing-keyboard-text-849826/
//   painting-contractor-google-leads ->
//     https://pixabay.com/photos/painter-to-brush-work-figure-1537421/
//   aeo-vs-seo-local-business ->
//     https://pixabay.com/photos/freelance-laptop-google-macbook-6051356/

export const blogs: BlogPost[] = [
  {
    id: "local-business-chatgpt-visibility",
    slug: "local-business-chatgpt-visibility",
    title:
      "Why Your Local Business Isn't Showing Up in ChatGPT (And How to Fix It)",
    category: "AEO",
    author: "Syed Belal",
    date: "May 28, 2026",
    datePublishedISO: "2026-05-28",
    readTime: "6 min read",
    image:
      "https://cdn.pixabay.com/photo/2015/07/17/22/43/student-849826_1280.jpg",
    excerpt:
      "If ChatGPT and Perplexity never mention your business, it's usually because your site isn't structured for AI to read, trust, and cite. Here's what to fix first.",
    content: `
## The short answer

If your local business doesn't appear when someone asks ChatGPT or Perplexity for a recommendation, the most common reason is that your website isn't structured for AI to extract and trust your information. AI answer engines don't rank ten blue links. They pull a single, synthesized answer from sources they can read clearly and verify. If your pages bury key facts in images, client-side popups, or vague copy, the AI skips you and cites a competitor instead.

The fix is rarely "write more." It's making the facts about your business unmissable and machine-readable: clear headings, plain answers to the questions buyers actually ask, structured data, and a consistent presence across the web that tells the AI you're a real, trusted business.

## Why AI answer engines ignore most local businesses

Traditional Google search shows a list and lets the user choose. Answer engines do the choosing for the user. When someone asks "who's the best painting contractor near me" or "how do I get my business found online," the engine retrieves a handful of sources, decides which it trusts, and writes one answer that cites them.

Three things get a business skipped:

**1. The information isn't on the page in plain text.** AI crawlers read HTML text. They don't click buttons, expand popups, or watch videos. If your services, service area, and answers live inside a click-to-open modal or a slideshow, the engine never sees them.

**2. The content doesn't answer a real question.** AI engines match intent, not keywords. A page that says "premium solutions for discerning clients" tells the AI nothing. A page that says "we repaint a 3-bedroom home exterior in 2 to 4 days, starting around $4,000" gives it a fact it can quote.

**3. There's no trust signal.** AI weighs whether a business is real and consistent. Mismatched name, address, and phone number across directories, no reviews, and no structured data all lower the confidence an engine has in citing you.

## What actually moves the needle

**Answer the question in the first sentence.** Research on AI citations consistently finds that answer-first formatting is one of the strongest signals for getting pulled into a generated answer. Lead every important page with a direct, quotable statement, then explain.

**Add structured data (schema).** Schema markup is a machine-readable label that tells search engines and AI exactly what your business does, where it operates, and how to categorize you. Organization, Service, and FAQPage schema are the highest-value types for a service business.

**Build a clean FAQ section on every key page.** FAQ content written as real questions and direct answers is among the most-cited formats in AI search, because it maps exactly to how people ask questions.

**Fix your local consistency.** Make sure your business name, address, and phone are identical everywhere, including Google Business Profile, directories, and your site. Inconsistency reads as risk to an AI.

**Keep it fresh.** Studies of AI citations found that the large majority of cited pages for commercial queries were updated within the past year. Stale pages get passed over. Update your cornerstone pages regularly.

## How to check where you stand right now

Be your own customer. Open ChatGPT, Perplexity, and Google's AI results and ask the questions your buyers would ask: "best [your service] in [your city]," "how do I choose a [your service] provider," "is [your business name] any good." Note who gets cited. If it's never you, that's your baseline. Perplexity is the fastest place to test changes, since its citations update within days.
    `,
    faqs: [
      {
        q: "Why doesn't my business show up in ChatGPT?",
        a: "Usually because your website content isn't structured for AI to read and trust. AI answer engines extract facts from clear page text and structured data. If your key information is hidden in images, popups, or vague marketing copy, the engine skips you and cites a competitor.",
      },
      {
        q: "How long does it take to start appearing in AI search?",
        a: "Structural changes like adding FAQ content and clearer answers can show up in Perplexity within days and in ChatGPT within a few weeks. Building lasting trust and consistent citations takes months of steady work.",
      },
      {
        q: "Is showing up in ChatGPT different from ranking on Google?",
        a: "Yes. Google ranks you in a list of links. AI answer engines cite you as the single source in a written answer. They share the same technical foundation, but AI citation rewards clear answers, structured data, and freshness more heavily than traditional rankings reward keywords and backlinks.",
      },
      {
        q: "Do I need to be on every AI platform?",
        a: "Citation overlap between engines is low, so appearing in one doesn't guarantee the others. Start with the platforms your customers actually use, structure your content well, and you'll improve your odds across all of them at once.",
      },
    ],
  },
  {
    id: "painting-contractor-google-leads",
    slug: "painting-contractor-google-leads",
    title: "How Painting Contractors Get More Leads From Google in 2026",
    category: "Local SEO",
    author: "Syed Belal",
    date: "May 19, 2026",
    datePublishedISO: "2026-05-19",
    readTime: "7 min read",
    image:
      "https://cdn.pixabay.com/photo/2016/07/23/19/36/painter-1537421_1280.jpg",
    excerpt:
      "For painting contractors, most online leads come from three places: the Google Maps pack, a complete Google Business Profile, and pages that answer what homeowners actually search. Here's how to win all three.",
    content: `
## The short answer

For painting contractors, the fastest path to more leads from Google in 2026 is to dominate local search in three specific places: the Google Maps pack (the map with three businesses that appears for "painters near me"), a fully completed Google Business Profile with steady reviews, and website pages that directly answer what homeowners search before they hire. Paid ads can accelerate this, but the contractors who win consistently are the ones who show up first in the map pack and answer real questions on their site.

## Where painting leads actually come from

When a homeowner needs their house painted, they rarely scroll past the first few results. The lead flow concentrates in a few high-intent moments:

- **The Maps pack.** Searches like "exterior painters near me" or "house painting [city]" surface a map with three local businesses. Most clicks and calls go to these three. Getting in is about proximity, profile completeness, review volume and recency, and local relevance.
- **The Google Business Profile.** Before calling, homeowners read your profile: photos of real work, recent reviews, response to reviews, services listed, service area. A thin profile loses to a complete one even if you're the better painter.
- **Question-answering pages.** Homeowners search things like "how much does it cost to paint a house exterior" and "how long does interior painting take." If your site answers these clearly, you capture the buyer at the research stage, and increasingly, AI answer engines cite those same pages.

## The playbook

**1. Complete and optimize your Google Business Profile.** Fill every field. Add your service area, hours, and services. Upload real photos of completed jobs regularly. Profiles with fresh photos perform better. List specific services (exterior, interior, cabinet refinishing, commercial) rather than a single generic "painting."

**2. Make reviews a system, not an afterthought.** Review volume and recency are among the strongest factors for the Maps pack. Ask every satisfied customer for a review the day you finish the job, with a direct link. Respond to every review, positive or negative. A steady trickle of recent reviews beats a pile of old ones.

**3. Ensure NAP consistency everywhere.** Your business name, address, and phone number must be identical across your website, Google Business Profile, and every directory. Inconsistencies confuse both Google and AI engines and quietly suppress your ranking.

**4. Build pages that answer buyer questions.** Create pages or sections that answer the real questions homeowners ask: cost ranges, timelines, prep work, paint types, warranty. Lead each with a direct answer. These pages capture research-stage buyers and are exactly what AI answer engines pull from when someone asks about painting.

**5. Add local and service schema.** Structured data tells Google and AI what you do and where. For a service business this means Organization and Service schema, plus FAQ schema on your question-answering pages.

**6. Layer in paid ads once the foundation is set.** Google Search and Local Services Ads can put you at the top immediately, and Local Services Ads bill per lead rather than per click. But ads amplify a strong profile and weak ads can't fix a thin one. Get the organic foundation right first.

## How to measure it

Track three numbers monthly: your position in the Maps pack for your top three search terms, your call and form volume from Google, and your review count and average rating. If the Maps position improves and reviews climb, the leads follow.
    `,
    faqs: [
      {
        q: "How do painting contractors rank higher in the Google Maps pack?",
        a: "The biggest factors are a complete Google Business Profile, consistent name/address/phone across the web, proximity to the searcher, and a steady stream of recent reviews. Upload real job photos regularly and ask every happy customer for a review the day the job finishes.",
      },
      {
        q: "Are Google ads worth it for painters?",
        a: "They can be, especially Local Services Ads, which charge per lead instead of per click and show a Google Guaranteed badge. Ads work best layered on top of a strong Business Profile and review base, not as a replacement for them.",
      },
      {
        q: "How long does it take to see more leads from Google?",
        a: "Profile and review improvements can lift Maps visibility within weeks. Content and organic ranking build over a few months. Paid ads produce leads immediately but stop when you stop paying.",
      },
      {
        q: "What website pages help painting contractors get leads?",
        a: "Pages that answer real homeowner questions: cost to paint a home, how long a job takes, interior vs exterior prep, and paint durability. Clear, direct answers on these pages capture research-stage buyers and get cited by AI search engines.",
      },
    ],
  },
  {
    id: "aeo-vs-seo-local-business",
    slug: "aeo-vs-seo-local-business",
    title: "AEO vs SEO: What Local Service Businesses Need to Know",
    category: "AEO",
    author: "Syed Belal",
    date: "May 8, 2026",
    datePublishedISO: "2026-05-08",
    readTime: "5 min read",
    image:
      "https://cdn.pixabay.com/photo/2021/02/26/10/47/freelance-6051356_1280.jpg",
    excerpt:
      "SEO gets you into Google's list of results. AEO gets you cited as the single answer in ChatGPT, Perplexity, and Google AI Overviews. Local businesses need both, and they share the same foundation.",
    content: `
## The short answer

SEO (search engine optimization) gets your business into Google's ranked list of links. AEO (answer engine optimization) gets your business cited as the single, synthesized answer that AI engines like ChatGPT, Perplexity, and Google AI Overviews deliver before any list appears. For local service businesses, the two aren't competing strategies. They share the same technical foundation, and the smartest approach in 2026 is to do both at once.

## The core difference

Traditional search shows the user ten options and lets them pick. An answer engine picks for them. When a homeowner asks an AI "what's the best way to find a reliable contractor," the engine doesn't return links. It writes an answer and cites a few trusted sources. SEO is about being one of the ten links. AEO is about being the cited answer.

The shift matters because AI search is growing fast. Google's AI Overviews now appear on a large share of searches, and a meaningful and rising portion of buyers form an opinion from an AI answer before they ever click through to a website.

## What's the same, and what's different

**Shared foundation:** Both reward a fast, well-structured site with clear content and proper schema markup. A page that loads quickly, uses clear headings, answers questions directly, and carries structured data performs well in both traditional and AI search. You do not maintain two separate websites.

**Where AEO differs:** AEO weights a few signals more heavily than classic SEO does:

- **Answer-first formatting.** Leading with a direct, quotable answer matters more for citation than it does for ranking.
- **FAQ and Q&A structure.** Content framed as real questions and direct answers maps to how people query AI, and is among the most-cited formats.
- **Freshness.** AI engines strongly favor recently updated pages for commercial questions.
- **Entity clarity and trust.** Consistent business information and structured data tell the AI you're a real, categorizable business worth citing.

Classic SEO leans harder on keyword targeting and backlinks. Those still matter, but they're not the levers that decide whether an AI extracts your paragraph.

## Why local service businesses should care

For a local business, AEO is often more winnable than broad SEO. Competing for a generic high-volume keyword means fighting national brands with huge authority. But a specific, local, intent-rich question, like "how do I get my [business type] found online in [city]," has little competition, and a clear, well-structured answer on your site can get cited quickly. AEO lets a smaller local business punch above its weight by being the clearest answer rather than the biggest brand.

## The practical takeaway

Don't choose between AEO and SEO. Build one strong foundation: a fast site, clear answers, FAQ content, structured data, consistent local presence. The same foundation serves both. Then test: ask the AI engines the questions your customers ask, see who gets cited, and refine. Perplexity shows results fastest; use it as your feedback loop.
    `,
    faqs: [
      {
        q: "What's the difference between AEO and SEO?",
        a: "SEO optimizes to rank in a list of search results. AEO optimizes to be cited as the single answer AI engines generate. SEO gets you into the conversation; AEO makes you the answer. They share the same technical foundation.",
      },
      {
        q: "Do local businesses need AEO if they already do SEO?",
        a: "Increasingly, yes. A growing share of buyers get answers from AI before clicking any link. If your business isn't cited in those answers, you're invisible in a fast-growing discovery channel, even if you rank on traditional Google.",
      },
      {
        q: "Is AEO harder than SEO for a small business?",
        a: "In some ways it's easier. AEO rewards clear, well-structured answers over raw domain authority and backlinks, so a small local business with sharp, specific content can get cited for niche questions where it could never outrank national brands in classic search.",
      },
      {
        q: "Can I do AEO and SEO with one website?",
        a: "Yes. They share the same foundation: a fast, clearly structured site with direct answers and schema markup. You optimize once and benefit in both traditional and AI search.",
      },
    ],
  },
];

export function getBlogBySlug(slug: string): BlogPost | undefined {
  return blogs.find((b) => b.slug === slug);
}
