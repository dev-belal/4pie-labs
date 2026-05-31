import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Industry tiles surfacing the three verticals the Pipeline program is
 * tuned for. Each click lands on /programs#pipeline so the visitor sees
 * the program tier built for their category. Imagery is sourced from
 * Pixabay - tourism, painter at work, and a small-business storefront -
 * served through Next/Image with `cdn.pixabay.com` registered in
 * next.config.ts remotePatterns.
 */

type Industry = {
  title: string;
  sub: string;
  image: string;
  alt: string;
};

// Tour operators imagery comes from Pixabay; the painter + storefront
// shots are from Unsplash because the Pixabay IDs we tried for those
// two didn't resolve. Both hostnames are configured under
// next.config.ts `images.remotePatterns`.
const INDUSTRIES: Industry[] = [
  {
    title: "Tour operators",
    sub: "Where 60% of our book lives. Tours, attractions, hospitality.",
    image:
      "https://cdn.pixabay.com/photo/2017/12/15/13/51/polynesia-3021072_1280.jpg",
    alt: "Tropical island with palm trees and turquoise water, hospitality and tourism",
  },
  {
    title: "Painting contractors",
    sub: "Where our craftsmanship pays. Residential + commercial.",
    image:
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1280&q=80",
    alt: "Painter applying paint with a roller to an interior wall",
  },
  {
    title: "Other local services",
    sub: "Landscaping, roofing, wellness, professional services.",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1280&q=80",
    alt: "Independent small business storefront on a city street",
  },
];

const PIPELINE_HREF = "/programs#pipeline";

export function IndustryGrid() {
  return (
    <section className="px-4 py-24 md:py-28">
      <div className="max-w-[1240px] mx-auto">
        <div className="text-center mb-12 md:mb-14">
          <span
            className="block font-semibold text-[40px] md:text-[56px] leading-none text-primary/30 tracking-tight mb-2"
            aria-hidden
          >
            03
          </span>
          <span className="block text-xs font-medium text-muted-foreground tracking-widest uppercase mb-3">
            Built for
          </span>
          <h2 className="text-[clamp(28px,3.5vw,40px)] font-semibold tracking-tight text-foreground leading-[1.15]">
            Three industries we know{" "}
            <span className="font-semibold text-primary">deeply.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {INDUSTRIES.map(({ title, sub, image, alt }) => (
            <Link
              key={title}
              href={PIPELINE_HREF}
              className="group block rounded-2xl bg-surface border border-card-border overflow-hidden transition-all hover:-translate-y-0.5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="aspect-[16/10] relative overflow-hidden bg-surface-2">
                <Image
                  src={image}
                  alt={alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent pointer-events-none" />
              </div>
              <div className="p-5 md:p-6 flex flex-col">
                <h3 className="text-lg font-semibold tracking-tight text-foreground mb-1.5">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-snug mb-4">
                  {sub}
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider group-hover:gap-2 transition-all">
                  See the Pipeline program
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
