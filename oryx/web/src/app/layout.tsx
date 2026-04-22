import "./globals.css"
import Script from "next/script"
import SavedItemsProvider from "@/components/evntszn/SavedItemsProvider"

export const metadata = {
  title: "EVNTSZN",
  description: "EVNTSZN Platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <Script
          id="google-adsense-base"
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7272606012835145"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <SavedItemsProvider>{children}</SavedItemsProvider>
      </body>
    </html>
  )
}
