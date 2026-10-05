import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "LancerMents",
  description: "Tactical Configuration Blueprint",
  icons: { icon: "/LancerMents-Light.png" },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="dark">
      <body className="bg-[#F8F4F7] text-[#151115] transition-colors duration-300 dark:bg-[#151115] dark:text-[#F8F4F7]">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
