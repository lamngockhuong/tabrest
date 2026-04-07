// i18n utility functions for locale detection and path generation

import { translations, type Locale, languages } from './translations';

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
 * Get localized path
 * - EN: /docs/getting-started
 * - VI: /vi/docs/getting-started
 */
export function getLocalizedPath(path: string, locale: Locale): string {
  // Remove leading slash for processing
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Remove existing locale prefix if any
  const pathWithoutLocale = cleanPath.replace(/^(en|vi)\//, '');

  if (locale === 'en') {
    return `/${pathWithoutLocale}`;
  }
  return `/${locale}/${pathWithoutLocale}`;
}

/**
 * Get alternate language URL for current page
 */
export function getAlternateLocale(currentLocale: Locale): Locale {
  return currentLocale === 'en' ? 'vi' : 'en';
}

/**
 * Get all locales
 */
export function getLocales(): Locale[] {
  return Object.keys(languages) as Locale[];
}
