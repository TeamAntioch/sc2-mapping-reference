import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { SearchWarmup } from "@/app/components/search-warmup";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        {children}
        <SearchWarmup />
      </body>
    </html>
  );
}
