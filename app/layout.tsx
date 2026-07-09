import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";

const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const display = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Ариг Академи",
  description: "Онлайн сургалтын платформ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" className={`${body.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
