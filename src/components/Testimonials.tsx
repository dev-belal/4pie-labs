import { createPublicClient } from "@/lib/supabase/public-client";
import {
  TestimonialsCarousel,
  type Testimonial,
} from "./TestimonialsCarousel";

// PLACEHOLDER TESTIMONIALS - see the marker comment above the carousel below.
// Real, anonymized-by-industry+region quotes replace these before public
// launch. Neutral initials avatars (ui-avatars) avoid misattributing a real
// person's photo to a placeholder.
const STATIC_TESTIMONIALS: Testimonial[] = [
  {
    headline: "[PLACEHOLDER headline]",
    quote:
      "[PLACEHOLDER - Real quote about how 4Pie Labs helped them go from being invisible online to being the top-ranked tour operator in their market. Specific before-state, specific result, specific quality of working with us.]",
    name: "Tour Operator",
    role: "[Region], multi-year client",
    avatar:
      "https://ui-avatars.com/api/?name=Tour+Operator&background=random&color=fff",
  },
  {
    headline: "[PLACEHOLDER headline]",
    quote:
      "[PLACEHOLDER - Real quote from a painting contractor about leaving a traditional agency, working with us, and seeing predictable lead flow within months. Reference dashboards or AI agent if relevant.]",
    name: "Painting Contractor",
    role: "[Region], multi-year client",
    avatar:
      "https://ui-avatars.com/api/?name=Painting+Contractor&background=random&color=fff",
  },
  {
    headline: "[PLACEHOLDER headline]",
    quote:
      "[PLACEHOLDER - Real quote from a tour operator or local service business about the difference between working with a 'tech company that does marketing' vs. a traditional agency. Reference dashboards, AI agents, AEO, or custom work.]",
    name: "Local Service Business",
    role: "[Region], multi-year client",
    avatar:
      "https://ui-avatars.com/api/?name=Local+Service&background=random&color=fff",
  },
];

type TestimonialRow = {
  headline?: string | null;
  title?: string | null;
  quote: string;
  name: string;
  role: string;
  avatar: string | null;
};

export async function Testimonials() {
  let testimonials: Testimonial[] = STATIC_TESTIMONIALS;

  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("testimonials")
      .select("headline, title, quote, name, role, avatar")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      testimonials = (data as TestimonialRow[]).map((row) => ({
        headline: row.headline ?? row.title ?? "",
        quote: row.quote,
        name: row.name,
        role: row.role,
        avatar:
          row.avatar ??
          `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=random&color=fff`,
      }));
    }
  } catch {
    // Supabase unavailable - fall back to static testimonials
  }

  return (
    <section
      id="results"
      className="py-24 px-4 bg-background overflow-hidden relative border-t border-foreground/5"
    >
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-morphism text-[10px] font-bold text-primary mb-6 tracking-widest uppercase">
            RESULTS & FEEDBACK
          </div>
          <h2 className="text-4xl md:text-6xl font-display font-bold italic text-foreground">
            Don&apos;t take our word for it.
          </h2>
        </div>

        {/* PLACEHOLDER TESTIMONIALS: Real quotes from real clients (anonymized by industry + region) will be added before public launch. Do not invent specific numbers or scenarios in the placeholders. */}
        <TestimonialsCarousel testimonials={testimonials} />
      </div>
    </section>
  );
}
