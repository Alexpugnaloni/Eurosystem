import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eurosystem",
  description: "Sistema gestione produzione e attività dipendenti",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          font-sans
          antialiased
          bg-zinc-50
          text-zinc-900
        `}
      >
        {children}
      </body>
    </html>
  );
}