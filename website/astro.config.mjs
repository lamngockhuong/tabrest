import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://tabrest.ohnice.app',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'vi', 'ja', 'zh_CN'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        // Map internal locale keys to BCP-47 hreflang codes (zh_CN -> zh-CN).
        locales: {
          en: 'en',
          vi: 'vi',
          ja: 'ja',
          zh_CN: 'zh-CN',
        },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
