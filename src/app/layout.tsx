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

// Inline theme-boot. Dark is the CSS default (defined in @theme), so the
// script only needs to set data-theme="light" when the user has explicitly
// opted in to light. Anything else (no stored value, "dark", or a script
// failure) leaves the dark default intact. Storage key is versioned (:v3)
// so old :v1 / :v2 caches are ignored - everyone hits the new dark default
// on first load.
const themeBootScript = `(function(){try{var t=localStorage.getItem('4pielabs:theme:v3');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | AI Automation & Digital Marketing Agency`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE.name} | AI Automation & Digital Marketing Agency`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | AI Automation & Digital Marketing Agency`,
    description: SITE.description,
    creator: SITE.twitter,
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
