import type { Metadata, Viewport } from "next";
import { Caveat, Patrick_Hand } from "next/font/google";
import "./globals.css";

const hand = Patrick_Hand({ variable: "--nf-hand", subsets: ["latin"], weight: "400" });
const display = Caveat({ variable: "--nf-display", subsets: ["latin"], weight: ["600", "700"] });

const description =
  "Campus Buddy is where Goa College of Engineering students meet: make friends or find a date. Verified students only.";

export const metadata: Metadata = {
  title: { default: "Campus Buddy · GEC dating & friendship", template: "%s · Campus Buddy" },
  description,
  applicationName: "Campus Buddy",
  appleWebApp: { capable: true, title: "Campus Buddy", statusBarStyle: "default" },
  openGraph: {
    title: "Campus Buddy",
    description,
    type: "website",
    locale: "en_IN",
    siteName: "Campus Buddy",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fdfbf4",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${hand.variable} ${display.variable} antialiased`}>{children}</body>
    </html>
  );
}
