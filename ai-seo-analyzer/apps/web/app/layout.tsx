import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sitewell",
  description: "Know what's holding your website back — in plain language.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
