import type { Metadata, Viewport } from "next";
import { Anton, Instrument_Serif, Space_Grotesk, Caveat } from "next/font/google";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "DIBS — my closet, temporarily available to the public",
    template: "%s · DIBS",
  },
  description:
    "I'm moving. You're not. A private, shareable closet where friends call dibs on the good stuff — gifted or for sale. No group chat required.",
  openGraph: {
    title: "DIBS",
    description: "My closet, temporarily available to the public. Call dibs before someone else does.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#14110f",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${instrumentSerif.variable} ${spaceGrotesk.variable} ${caveat.variable} h-full`}
    >
      <body className="grain min-h-full">{children}</body>
    </html>
  );
}
