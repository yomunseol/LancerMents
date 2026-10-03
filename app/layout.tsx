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
    <html lang="en" className="dark">
      <body className="bg-[#F8F4F7] text-[#151115] transition-colors duration-300 dark:bg-[#151115] dark:text-[#F8F4F7]">
        {children}
      </body>
    </html>
  );
}
