import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Growth Engine",
  description: "Business growth foundation for Professional Studio"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
