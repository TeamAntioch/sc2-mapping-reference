import type { Metadata } from "next";
import { Chakra_Petch, Inter } from "next/font/google";
import "./globals.css";

import { SearchWarmup } from "@/app/components/search-warmup";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-chakra-petch",
});

export const metadata: Metadata = {
  title: "StarCraft 2 Mapping Reference",
  description:
    "Galleries of cliffs, doodads, terrain, tilesets, and sample maps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${chakraPetch.variable} hud-grid min-h-screen font-sans text-slate-300 antialiased`}
      >
        {children}
        <SearchWarmup />
      </body>
    </html>
  );
}
