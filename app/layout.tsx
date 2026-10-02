import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LancerMents",
  description: "Tactical Configuration Blueprint",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-primary-text">{children}</body>
    </html>
  );
}
