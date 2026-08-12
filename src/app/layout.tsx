import type { Metadata } from "next";
import { Syne, Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth";
import { SITE_URL } from "@/lib/constants/config";
import "./globals.css";

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "FINDit",

  title: {
    default: "FINDit — Lost & Found for ESTIN Students",
    template: "%s · FINDit",
  },

  verification: {
    google: "Th212iOll8uCeGmml8xe4TN6w6_-s3CjJ6zkJRPevdc",
  },
  description:
    "FINDit is the campus lost & found platform for ESTIN Bejaia students. Browse found items, report what you lost, or post what you found — no campus-wide email spam.",
  keywords: [
    "lost and found",
    "ESTIN",
    "lost item",
    "found item",
    "findit",
    "student platform",
    "ESTIN Bejaia",
    "campus lost found",
  ],
  authors: [{ name: "Mohamed Anis BELAMRI" }],
  creator: "Mohamed Anis BELAMRI",

  openGraph: {
    title: "FINDit — Lost & Found for ESTIN Students",
    description:
      "A smarter lost & found for our campus. Browse what's been found, post what you lost, or report what you found — no campus-wide emails.",
    url: SITE_URL,
    siteName: "FINDit",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "FINDit — Lost & Found for ESTIN Students",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "FINDit — Lost & Found for ESTIN Students",
    description:
      "A smarter lost & found for our campus. Browse what's been found, post what you lost, or report what you found — no campus-wide emails.",
    images: ["/opengraph-image.png"],
  },

  alternates: {
    canonical: SITE_URL,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "FINDit",
  url: SITE_URL,
  description: "Campus lost & found platform for ESTIN Bejaia students.",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "Mohamed Anis BELAMRI",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "FINDit",
  alternateName: "FINDit ESTIN",
  url: SITE_URL,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${inter.variable}`}
      data-theme="dark"
    >
      <body className="min-h-screen flex flex-col antialiased">
        {/* JSON-LD: hardcoded static objects — never include user-supplied data here */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
