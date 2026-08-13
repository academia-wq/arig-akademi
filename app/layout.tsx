import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const body = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});
const display = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["600"],
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
