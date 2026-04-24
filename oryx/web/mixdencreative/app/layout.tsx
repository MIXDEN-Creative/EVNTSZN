import type { Metadata } from "next";

import { getSiteOrigin } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  title: "MIXDEN Creative | Done-For-You Creative Systems",
  description:
    "Done-for-you creative systems, brand assets, content plans, and launch materials for creators, brands, and entrepreneurs.",
  metadataBase: getSiteOrigin(),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MIXDEN Creative | Done-For-You Creative Systems",
    description:
      "Done-for-you creative systems, brand assets, content plans, and launch materials for creators, brands, and entrepreneurs.",
    url: "/",
    siteName: "MIXDEN Creative",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MIXDEN Creative | Done-For-You Creative Systems",
    description:
      "Done-for-you creative systems, brand assets, content plans, and launch materials for creators, brands, and entrepreneurs.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
