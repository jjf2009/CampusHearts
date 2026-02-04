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
  title: "Campus Heart — Slow Dating for College Students in Goa",
  description: "Write letters, not swipes. Campus Heart is a thoughtful dating space for college students in Goa. Connect through handwritten-style digital letters that take time to arrive.",
  keywords: ["dating app", "college dating", "Goa", "slow dating", "letter dating", "campus heart"],
  openGraph: {
    title: "Campus Heart — Slow Dating for College Students in Goa",
    description: "Write letters, not swipes. Connect through thoughtful letters that take time to arrive.",
    type: "website",
    locale: "en_IN",
    siteName: "Campus Heart",
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Heart — Slow Dating for College Students",
    description: "Write letters, not swipes. Thoughtful dating for college students in Goa.",
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
