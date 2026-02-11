import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PaySwitch Credit Scoring Platform",
    template: "%s | PaySwitch Credit",
  },
  description:
    "AI-powered enterprise credit scoring for financial institutions across Ghana. Real-time risk assessment and decisioning engine.",
  keywords: [
    "credit scoring",
    "AI",
    "fintech",
    "Ghana",
    "PaySwitch",
    "risk management",
    "loan origination",
  ],
  authors: [{ name: "PaySwitch Ltd" }],
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://credit.payswitch.com.gh",
    siteName: "PaySwitch Credit Scoring",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PaySwitch Credit Scoring Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PaySwitch Credit Scoring Platform",
    description:
      "Enterprise-grade AI credit scoring for Ghanaian financial institutions.",
    creator: "@payswitch",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${urbanist.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
