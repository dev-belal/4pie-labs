import { Hero } from "@/components/Hero";
import { ROICalculator } from "@/components/ROICalculator";
import { Services } from "@/components/Services";
import { Timeline } from "@/components/Timeline";
import { Testimonials } from "@/components/Testimonials";
import { BookingCTA } from "@/components/BookingCTA";
import { FAQ } from "@/components/FAQ";
import { faqs } from "@/data/faqs";
import { BlogSection } from "@/components/BlogSection";
import { JsonLd } from "@/components/JsonLd";

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
      <ROICalculator />
      <Services />
      <Timeline />
      <Testimonials />
      <BookingCTA />
      <FAQ />
      <BlogSection />
    </>
  );
}
