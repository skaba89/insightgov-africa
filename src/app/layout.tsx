import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SubscriptionProvider } from "@/contexts/subscription-context";
import { AuthProvider } from "@/contexts/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://insightgov.africa"),
  title: {
    default: "InsightGov Africa - Générateur de Dashboards IA pour l'Afrique",
    template: "%s | InsightGov Africa",
  },
  description: "La première plateforme SaaS de génération automatique de tableaux de bord et KPIs par IA, conçue pour les Ministères, ONG et Entreprises africaines. Transformez vos données en décisions en quelques minutes.",
  keywords: [
    "Dashboard",
    "KPI",
    "Data Visualization", 
    "Afrique",
    "IA",
    "Intelligence Artificielle",
    "Gouvernement",
    "ONG",
    "Analyse données",
    "Reporting",
    "Statistiques",
    "Sénégal",
    "Afrique de l'Ouest",
    "Ministère",
    "Santé publique",
    "Education",
    "Agriculture",
  ],
  authors: [{ name: "InsightGov Africa Team", url: "https://insightgov.africa" }],
  creator: "InsightGov Africa",
  publisher: "InsightGov Africa",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: ["en_US", "pt_BR"],
    url: "https://insightgov.africa",
    siteName: "InsightGov Africa",
    title: "InsightGov Africa - Générateur de Dashboards IA pour l'Afrique",
    description: "Transformez vos données en tableaux de bord décisionnels en quelques minutes grâce à l'IA. La solution de reporting pour les organisations africaines.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "InsightGov Africa - Dashboard Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@insightgov_africa",
    creator: "@insightgov_africa",
    title: "InsightGov Africa - Dashboards IA pour l'Afrique",
    description: "Générez vos KPIs et tableaux de bord automatiquement avec l'IA",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://insightgov.africa",
    languages: {
      "fr-FR": "https://insightgov.africa",
      "en-US": "https://insightgov.africa/en",
    },
  },
  category: "Business Software",
  classification: "SaaS Dashboard Platform",
  other: {
    "application-name": "InsightGov Africa",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "InsightGov",
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#3b82f6",
    "msapplication-tap-highlight": "no",
  },
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "InsightGov Africa",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "Plateforme SaaS de génération automatique de tableaux de bord et KPIs par IA pour les organisations africaines",
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "250",
    "highPrice": "2500",
    "priceCurrency": "EUR",
    "offerCount": "3",
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "47",
  },
  "provider": {
    "@type": "Organization",
    "name": "InsightGov Africa",
    "url": "https://insightgov.africa",
    "logo": "https://insightgov.africa/logo.svg",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+221-33-123-4567",
      "contactType": "customer service",
      "availableLanguage": ["French", "English"],
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Dakar",
      "addressCountry": "SN",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <SubscriptionProvider>
            {children}
          </SubscriptionProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
