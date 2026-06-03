import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Instrument Serif - italic accent on hero headlines only ("finds first.").
// Single italic display weight is enough; we never set it as the body font.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["italic", "normal"],
  subsets: ["latin"],
  display: "swap",
});

// Inline theme + scroll boot. Runs before paint.
//
// 1. Theme: dark is the CSS default (defined in @theme), so the script
//    only needs to set data-theme="light" when the user has explicitly
//    opted in to light. Storage key is versioned (:v3) so old :v1/:v2
//    caches are ignored.
//
// 2. Scroll: `history.scrollRestoration = "manual"` opts out of the
//    browser's automatic "restore the scroll position the visitor was
//    at before the refresh" behavior. Combined with an explicit
//    `scrollTo(0,0)` on DOMContentLoaded, this means a refresh always
//    lands at the top of the page (the request the user expects when
//    they hit Cmd-R / Ctrl-R / F5). Next.js's App Router handles
//    scroll-on-navigation separately, so this only affects the
//    initial / refresh load - not in-app navigation, which still
//    auto-scrolls to top.
const themeBootScript = `(function(){try{var t=localStorage.getItem('4pielabs:theme:v3');if(t==='light')document.documentElement.setAttribute('data-theme','light');if('scrollRestoration' in history)history.scrollRestoration='manual';window.addEventListener('DOMContentLoaded',function(){window.scrollTo(0,0);});}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "4Pie Labs | AI-First Marketing for Local Service Businesses",
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  // Intentionally NO alternates.canonical here. Setting it on the root
  // layout would bleed into every child route that does not explicitly
  // override it, causing Next to emit <link rel="canonical" href="/">
  // on pages like /audit and /programs and signalling them as duplicates
  // of the homepage. Every page sets its own canonical in its metadata.
  openGraph: {
    title: "4Pie Labs | AI-First Marketing for Local Service Businesses",
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: "en_US",
    type: "website",
    // Default social card. Per-page openGraph.images can override this.
    // Without it, summary_large_image below would render blank on Twitter.
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "4Pie Labs - AI-first marketing for local service businesses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "4Pie Labs | AI-First Marketing for Local Service Businesses",
    description: SITE.description,
    creator: SITE.twitter,
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    legalName: "4Pie Labs AI Automation Agency",
    url: SITE.url,
    logo: `${SITE.url}/logo.png`,
    description:
      "4Pie Labs helps painting contractors, tour operators, and local service businesses dominate Google, Maps, and AI answer engines. AI-first marketing built by a tech company - not a traditional agency.",
    sameAs: [
      "https://www.linkedin.com/company/4-pie-labs/",
      "https://www.instagram.com/devbelaal",
      "https://www.x.com/devbelaal",
      "https://www.youtube.com/@devbelaal",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "team@fourpielabs.com",
      contactType: "customer support",
      availableLanguage: ["English"],
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    publisher: { "@type": "Organization", name: SITE.name },
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <head>
        {/* Set data-theme="dark|light" before paint to avoid the FOUC on
            navigation. Reads the same localStorage key the toggle writes. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <JsonLd data={organization} />
        <JsonLd data={website} />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
