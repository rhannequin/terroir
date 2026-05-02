import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://rhannequin.github.io',
  base: '/terroir',
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
