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
    default: "EVNTSZN | Premium nightlife, sports, and city energy",
    template: "%s | EVNTSZN",
  },
  description:
    "Discover the city's strongest moves. EVNTSZN connects you to headline concerts, exclusive nightlife, and high-stakes sports through a premium discovery experience.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "EVNTSZN | Premium nightlife, sports, and city energy",
    description:
      "A premium event discovery platform for headline concerts, exclusive nightlife, and high-stakes sports.",
    url: "/",
    siteName: "EVNTSZN",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EVNTSZN | Premium nightlife, sports, and city energy",
    description:
      "Find your next move. Access exclusive city energy and the strongest live plans first.",
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
