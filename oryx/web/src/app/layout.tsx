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
    default: "EVNTSZN | Premium event discovery, nightlife, sports, and things to do",
    template: "%s | EVNTSZN",
  },
  description:
    "Discover premium EVNTSZN events, host experiences, nightlife, sports, music, and city-level things to do through a cinematic event platform built for real momentum.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "EVNTSZN | Premium event discovery, nightlife, sports, and things to do",
    description:
      "A premium event discovery platform for EVNTSZN-native events, hosted experiences, nightlife, sports, music, and city energy.",
    url: "/",
    siteName: "EVNTSZN",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EVNTSZN | Premium event discovery, nightlife, sports, and things to do",
    description:
      "Discover EVNTSZN-native events first, then expand into broader city discovery without losing clarity, trust, or momentum.",
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
