import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { LogosRow } from "@/components/LogosRow";
import { AEOCallout } from "@/components/AEOCallout";
import { ROICalculator } from "@/components/ROICalculator";
import { Services } from "@/components/Services";
import { IndustryGrid } from "@/components/IndustryGrid";
import { ProgramsGridHome } from "@/components/ProgramsGridHome";
import { Timeline } from "@/components/Timeline";
import { Testimonials } from "@/components/Testimonials";
import { BookingCTA } from "@/components/BookingCTA";
import { FAQ } from "@/components/FAQ";
import { faqs } from "@/data/faqs";
import { BlogSection } from "@/components/BlogSection";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

const HOME_TITLE = `${SITE.name} - AI-First Marketing for Painting Contractors, Tour Operators & Local Service Businesses`;
const HOME_DESCRIPTION =
  "4Pie Labs helps painting contractors, tour operators, and local service businesses dominate Google, Maps, and AI answer engines. AI-first marketing built by a tech company - not a traditional agency.";

export const metadata: Metadata = {
  // `absolute` bypasses the root layout's "%s | 4Pie Labs" template since the
  // brand name is already in the title.
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: "/",
    type: "website",
    // OG image inherited (none yet) - branded image lands in Phase 1D.
  },
  twitter: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
};

// Pre-render + ISR. Without this, every visit triggers fresh Supabase
// queries from Testimonials + BlogSection, which adds 300–800ms per
// navigation (and blocks Next's <Link> prefetch). Cache at the edge
// for 5 minutes; admin publish actions call revalidatePath('/') so
// new content surfaces immediately.
export const revalidate = 300;

export default function HomePage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <JsonLd data={faqSchema} />
      <Hero />
      <LogosRow />
      <AEOCallout />
      <Services />
      <IndustryGrid />
      <ProgramsGridHome />
      <ROICalculator />
      <Timeline />
      <Testimonials />
      <BookingCTA />
      <FAQ />
      <BlogSection />
    </>
  );
}
