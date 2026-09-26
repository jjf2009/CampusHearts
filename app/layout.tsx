import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Campus Heart — Dating for College Students in Goa",
  description: "Campus Heart is a dating app just for verified college students in Goa. Women send love requests, men choose who to accept, and numbers are shared only when you both say yes.",
  keywords: ["dating app", "college dating", "Goa", "student dating", "campus heart"],
  openGraph: {
    title: "Campus Heart — Dating for College Students in Goa",
    description: "Verified students only. She sends the love request, he accepts, you both say hi.",
    type: "website",
    locale: "en_IN",
    siteName: "Campus Heart",
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Heart — Dating for College Students in Goa",
    description: "Verified students only. She sends the love request, he accepts, you both say hi.",
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
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${plusJakartaSans.variable} antialiased bg-cream text-charcoal`}
      >
        {children}
      </body>
    </html>
  );
}
