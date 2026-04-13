import Image from "next/image";
import Link from "next/link";
import { SERVICE_CATEGORY_SLUGS } from "@/data/services";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
];

/**
 * Visitor-facing labels use the brand voice ("AI Automation"); the URL
 * slugs map to the internal ServiceCategory taxonomy. Clicking any of
 * these deep-links to /services with the category pre-selected.
 */
const SERVICES: { label: string; slug: string }[] = [
  { label: "AI Automation", slug: SERVICE_CATEGORY_SLUGS["AI Systems"] },
  { label: "Design Creatives", slug: SERVICE_CATEGORY_SLUGS["Design Creatives"] },
  { label: "Digital Marketing", slug: SERVICE_CATEGORY_SLUGS["Digital Marketing"] },
];

export function Footer() {
  return (
    <footer className="pt-24 pb-12 px-4 border-t border-white/5 bg-[#050505] glass-morphism">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12 items-center md:items-start">
        <div className="text-center md:text-left md:ml-5 flex flex-col items-center md:items-start">
          <Link href="/" className="mb-4 inline-flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="4Pie Labs"
              width={128}
              height={32}
              className="h-8 w-auto brightness-0 invert"
            />
          </Link>
          <p className="text-white/30 max-w-xs mb-6 px-4 md:px-0">
            Building the systems that make autonomous agencies possible.
          </p>
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <a
              href="https://www.linkedin.com/company/4-pie-labs/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 transition-all duration-300 hover:text-[#0A66C2] hover:drop-shadow-[0_0_8px_rgba(10,102,194,0.8)]"
              aria-label="LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="mailto:team@fourpielabs.com"
              className="text-white/40 transition-all duration-300 hover:text-[#EA4335] hover:drop-shadow-[0_0_8px_rgba(234,67,53,0.8)]"
              aria-label="Email"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 7l-10 7L2 7" />
              </svg>
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 md:gap-16 text-center md:text-left items-center md:items-start">
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3 text-white/40 text-sm">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">
              Services
            </h4>
            <ul className="space-y-3 text-white/40 text-sm">
              {SERVICES.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services?category=${s.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">
              Admin
            </h4>
            <ul className="space-y-3 text-white/40 text-sm">
              <li>
                <Link
                  href="/admin/login"
                  className="hover:text-white transition-colors"
                >
                  Internal Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-12 pt-12 border-t border-white/5 text-center text-white/20 text-xs">
        © {new Date().getFullYear()} 4Pie Labs AI Automation Agency. All rights
        reserved.
      </div>
    </footer>
  );
}
