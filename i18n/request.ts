import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { LOCALE_ORDER } from "../lib/i18n/vocab";

export const DEFAULT_LOCALE = "en";
export const LOCALE_COOKIE = "lm_locale";

export function resolveLocale(value: string | undefined): string {
  return value && LOCALE_ORDER.includes(value) ? value : DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = resolveLocale(store.get(LOCALE_COOKIE)?.value);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
