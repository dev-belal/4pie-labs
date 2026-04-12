import { createClient } from "@/lib/supabase/server";
import {
  TestimonialsCarousel,
  type Testimonial,
} from "./TestimonialsCarousel";

const STATIC_TESTIMONIALS: Testimonial[] = [
  {
    headline: "Hiring used to take us weeks. Now it takes hours.",
    quote:
      "We process hundreds of CVs every week and it was all manual. They built us a system that generates standardized CVs and scores candidates. What used to take our recruiters two full days now happens in the background.",
    name: "Israel Sanc Rueda",
    role: "CEO & Founder, NexAi Automations, Espana",
    avatar: "/testimonials/israel.jpeg",
  },
  {
    headline: "Our content workflow went from chaos to clockwork.",
    quote:
      "We were publishing maybe 2 blogs a month with zero SEO consistency. Now we're pushing out 8 to 10 optimized posts a month and organic traffic has nearly tripled. Feels like we added a whole content team.",
    name: "Iman Motamed",
    role: "CEO & Founder, Bloomhouse Marketing, USA",
    avatar: "/testimonials/iman.png",
  },
  {
    headline: "Really Helpful in automating the hectic work we had",
    quote:
      "Really goes above and beyond to support me and my business. Not only puts together great solutions, but also helps explain them and why they will benefit our team. Would highly recommended!",
    name: "Louis Modeste",
    role: "Wealth Manager, Edward Bond Associates, UK",
    avatar: "/testimonials/louis.jpeg",
  },
  {
    headline: "Leads stopped falling through the cracks.",
    quote:
      "Now we have an AI chatbot handling first-touch support, booking calls, and following up automatically. Every inquiry gets an instant response, and we've seen a real jump in conversions.",
    name: "Saad Ali Khan",
    role: "CEO & Founder, Botyama AI, UK",
    avatar: "/testimonials/saad.jpeg",
  },
  {
    headline: "Finally, reporting that doesn't eat up our week.",
    quote:
      "They built us a fully automated system with a live dashboard where clients can see occupancy and revenue in real time. That one system alone freed up enough time to take on 20 more units.",
    name: "Abdul Kareem",
    role: "Lead Engineer, ZJ Rentals, USA",
    avatar: "/testimonials/abdul.jpeg",
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
    const supabase = await createClient();
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
    // Supabase unavailable — fall back to static testimonials
  }

  return (
    <section
      id="results"
      className="py-24 px-4 bg-[#050505] overflow-hidden relative border-t border-white/5"
    >
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-morphism text-[10px] font-bold text-primary mb-6 tracking-widest uppercase">
            RESULTS & FEEDBACK
          </div>
          <h2 className="text-4xl md:text-6xl font-display font-bold italic text-white">
            Don&apos;t take our word for it.
          </h2>
        </div>

        <TestimonialsCarousel testimonials={testimonials} />
      </div>
    </section>
  );
}
