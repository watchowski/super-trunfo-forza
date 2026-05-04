import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Super Trunfo Forza",
  description: "Two-player Super Trunfo inspired by Forza Horizon cars"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
