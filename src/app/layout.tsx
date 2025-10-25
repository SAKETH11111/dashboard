import type { Metadata } from "next"

import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: {
    default: "Iowa Water Quality Dashboard",
    template: "%s — Iowa Water Quality Dashboard",
  },
  description:
    "Trusted Iowa water data to track nitrate, PFAS, bacteria, and other contaminant trends for public systems and recreation sites.",
  metadataBase: new URL("https://iowa-water-dashboard.local"),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/iowa-water/logo-mark.svg",
  },
  openGraph: {
    title: "Iowa Water Quality Dashboard",
    description:
      "Track nitrate, nitrite, E. coli, PFAS, arsenic, DBPs, and fluoride levels across Iowa's water systems.",
    url: "https://iowa-water-dashboard.local",
    siteName: "Iowa Water Quality Dashboard",
    images: [
      {
        url: "/iowa-water/logo-horizontal.svg",
        width: 1200,
        height: 630,
        alt: "Iowa Water Quality Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Iowa Water Quality Dashboard",
    description:
      "See contaminant trends and advisories for Iowa communities powered by state & federal datasets.",
    images: ["/iowa-water/logo-horizontal.svg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
