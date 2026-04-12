import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
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

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

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
    description: SITE.description,
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
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
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
