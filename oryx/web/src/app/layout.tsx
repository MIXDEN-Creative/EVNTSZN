import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getWebOrigin } from "@/lib/domains";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getWebOrigin()),
  title: {
    default: "EVNTSZN | Nights out, live games, concerts, and league nights",
    template: "%s | EVNTSZN",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
