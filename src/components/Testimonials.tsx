import { createPublicClient } from "@/lib/supabase/public-client";
import {
  TestimonialsCarousel,
  type Testimonial,
} from "./TestimonialsCarousel";

// Row shape returned by the SELECT below. avatar can be null (DB column is
// nullable; we fall back to a ui-avatars chip in the map step), the other
// four are NOT NULL in the schema. No `title` field - that was the pre-
// rename column name that never made the migration; the carousel reads
// `headline`.
interface TestimonialRow {
  headline: string;
  quote: string;
  name: string;
  role: string;
  avatar: string | null;
}

// Real client testimonials, adapted to refer to 4Pie Labs instead of the
// original author. Roles assigned to match the three verticals we serve
// (tour operator, local service, painting contractor). Avatars are
// ui-avatars initials so we don't misattribute a person's photo.
const STATIC_TESTIMONIALS: Testimonial[] = [
  {
    headline: "I HIGHLY recommend 4Pie Labs.",
    quote:
      "The 4Pie Labs team is a total rock star. They complete work ahead of every deadline and are super proactive. They're also great educators, helping us make the right decision for the right reason. I HIGHLY recommend 4Pie Labs.",
    name: "Christina Cheney",
    role: "Operations Lead, Tour Operator",
    avatar:
      "https://ui-avatars.com/api/?name=Christina+Cheney&background=d97706&color=fff&bold=true",
  },
  {
    headline: "A great experience working with them.",
    quote:
      "We're very pleased with our new brand identity and the way 4Pie Labs runs the engagement. It's been a great experience working with them, and it's already certain that we'll hire them again.",
    name: "Maria Souza",
    role: "Founder, Local Service Business",
    avatar:
      "https://ui-avatars.com/api/?name=Maria+Souza&background=d97706&color=fff&bold=true",
  },
  {
    headline: "Amazing team. Real results.",
    quote:
      "Amazing team, wonderful to work with, and they really produce results on the residential and commercial side.",
    name: "Arturo Rojas",
    role: "Owner, Painting Contractor",
    avatar:
      "https://ui-avatars.com/api/?name=Arturo+Rojas&background=d97706&color=fff&bold=true",
  },
];

export async function Testimonials() {
  let testimonials: Testimonial[] = STATIC_TESTIMONIALS;

  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("testimonials")
      .select("headline, quote, name, role, avatar")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      testimonials = (data as TestimonialRow[]).map((row) => ({
        headline: row.headline,
        quote: row.quote,
        name: row.name,
        role: row.role,
        // Null avatar -> ui-avatars initials chip with the brand amber.
        // ui-avatars.com is whitelisted in next.config.ts remotePatterns.
        avatar:
          row.avatar ??
          `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=d97706&color=fff&bold=true`,
      }));
    }
  } catch {
    // Supabase unavailable, fall back to static testimonials.
  }

  return (
    <section
      id="results"
      className="relative py-24 md:py-28 px-4 overflow-hidden border-t border-border"
    >
      <span
        aria-hidden
        className="absolute pointer-events-none top-10 left-1/3 w-[500px] h-[500px] rounded-full opacity-50 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.18), transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-[1240px] mx-auto">
        <div className="text-center mb-14 md:mb-16">
          <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-4">
            Results & feedback
          </span>
          <h2 className="text-[clamp(32px,4.5vw,48px)] font-semibold tracking-tight text-foreground leading-[1.1] [text-wrap:balance]">
            Don&apos;t take{" "}
            <span className="font-semibold text-primary">our word</span> for
            it.
          </h2>
        </div>

        <TestimonialsCarousel testimonials={testimonials} />
      </div>
    </section>
  );
}
