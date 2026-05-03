import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

function minifyDataJson() {
  return {
    name: 'terroir:minify-data-json',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const dataDir = path.join(fileURLToPath(dir), 'data');
        let entries;
        try {
          entries = await readdir(dataDir);
        } catch {
          return;
        }
        for (const name of entries) {
          if (!name.endsWith('.json')) continue;
          const file = path.join(dataDir, name);
          const raw = await readFile(file, 'utf-8');
          const minified = JSON.stringify(JSON.parse(raw)) + '\n';
          await writeFile(file, minified);
          logger.info(
            `minified data/${name} (${raw.length} → ${minified.length} bytes)`,
          );
        }
      },
    },
  };
}

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
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'fr',
        locales: { fr: 'fr', en: 'en-GB' },
      },
    }),
    minifyDataJson(),
  ],
});
