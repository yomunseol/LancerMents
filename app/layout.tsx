import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { RTL_LOCALES } from "@/lib/i18n/vocab";
import { ProfileProvider } from "@/app/dashboard/ProfileContext";
import GlobalNav from "@/app/components/GlobalNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "LancerMents",
  description: "Tactical Configuration Blueprint",
};

export const viewport: Viewport = {
  themeColor: "#151115",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className="dark">
      <body className="bg-[#F8F4F7] text-[#151115] transition-colors duration-300 dark:bg-[#151115] dark:text-[#F8F4F7]">
        <NextIntlClientProvider>
          <ProfileProvider>
            <GlobalNav />
            {children}
          </ProfileProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
