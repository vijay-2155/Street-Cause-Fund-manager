import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://streetcausefunds.vercel.app"),
  title: {
    default: "Street Cause Fund Manager — NGO Fund Management Platform",
    template: "%s | Street Cause Fund Manager",
  },
  description:
    "A purpose-built fund management platform for NGO chapters. Track donations, approve expenses, run events, and maintain full financial transparency — all in one place.",
  keywords: [
    "Street Cause",
    "NGO fund management",
    "donation tracker",
    "expense management",
    "nonprofit fundraising",
    "charity management",
    "volunteer management",
    "financial transparency",
    "India NGO",
  ],
  authors: [{ name: "Street Cause" }],
  creator: "Street Cause",
  publisher: "Street Cause",
  applicationName: "Street Cause Fund Manager",
  icons: {
    icon: "/icons/logo.png",
    apple: "/icons/logo.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SC Funds",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Street Cause Fund Manager",
    title: "Street Cause Fund Manager — NGO Fund Management Platform",
    description:
      "Track donations, approve expenses, run events, and maintain full financial transparency for your NGO chapter.",
    images: [
      {
        url: "/icons/logo.png",
        width: 512,
        height: 512,
        alt: "Street Cause Fund Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Street Cause Fund Manager",
    description:
      "Purpose-built fund management for NGO chapters. Track donations, approve expenses, and maintain financial transparency.",
    images: ["/icons/logo.png"],
  },
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} antialiased font-sans`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
