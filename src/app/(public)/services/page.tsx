import type { Metadata } from "next";
import { ServicesBrowser } from "@/components/ServicesBrowser";

export const metadata: Metadata = {
  title: "Services",
  description:
    "AI automation, design creatives, and digital marketing services built for scale. Explore our full catalog.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Services — 4Pie Labs",
    description:
      "AI automation, design creatives, and digital marketing services built for scale.",
    url: "/services",
    type: "website",
  },
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-4">
      <ServicesBrowser />
    </div>
  );
}
