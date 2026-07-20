// i18n utility functions for locale detection and path generation

import { translations, type Locale, languages } from './translations';

// Regex that matches a leading "<locale>/" prefix for any known locale.
// Built from the languages map so adding a locale needs no change here.
// Case-insensitive: URL paths keep the locale key casing (e.g. "zh_CN/") while
// Astro's content collection lowercases doc ids (e.g. "zh_cn/"); both must strip.
const LOCALE_PREFIX_RE = new RegExp(`^(${Object.keys(languages).join('|')})/`, 'i');

/**
 * Get locale from URL path
 */
export function getLocaleFromUrl(url: URL): Locale {
  const [, lang] = url.pathname.split('/');
  if (lang in languages) {
    return lang as Locale;
  }
  return 'en';
}

/**
 * Get translations for a locale
 */
export function useTranslations(locale: Locale) {
  return translations[locale];
}

/**
 * Strip a leading locale prefix (e.g. "vi/", "zh_CN/") from a path or doc id.
 */
export function stripLocalePrefix(path: string): string {
  return path.replace(LOCALE_PREFIX_RE, '');
}

/**
 * Get localized path
 * - EN (default): /docs/getting-started
 * - Others: /<locale>/docs/getting-started
 */
export function getLocalizedPath(path: string, locale: Locale): string {
  // Remove leading slash for processing
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Remove existing locale prefix if any
  const pathWithoutLocale = stripLocalePrefix(cleanPath);

  if (locale === 'en') {
    return `/${pathWithoutLocale}`;
  }
  return `/${locale}/${pathWithoutLocale}`;
}

/**
 * Get all locales
 */
export function getLocales(): Locale[] {
  return Object.keys(languages) as Locale[];
}

/**
 * Get all locales except the given one (for the language switcher).
 */
export function getOtherLocales(current: Locale): Locale[] {
  return getLocales().filter((l) => l !== current);
}
