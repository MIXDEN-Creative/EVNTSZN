import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/montserrat/900.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import type { Metadata } from "next";
import Script from "next/script";
import SavedItemsProvider from "@/components/evntszn/SavedItemsProvider";
import { getWebOrigin } from "@/lib/domains";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getWebOrigin()),
  title: {
    default: "EVNTSZN | Nights out, live games, concerts, and league nights",
    template: "%s | EVNTSZN",
  },
  icons: {
    icon: "/brand/evntszn-icon.png",
  },
  description:
    "Find the nights out, live games, concerts, and league moments worth showing up for with EVNTSZN.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "EVNTSZN | Nights out, live games, concerts, and league nights",
    description:
      "One cleaner public guide to concerts, nightlife, sports, and league nights.",
    url: "/",
    siteName: "EVNTSZN",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EVNTSZN | Nights out, live games, concerts, and league nights",
    description:
      "Find what is happening next and move straight into the right event, ticket, or league page.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Script
          id="google-adsense-base"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7272606012835145"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          async
        />
        <SavedItemsProvider>{children}</SavedItemsProvider>
      </body>
    </html>
  );
}
