import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://etiennevenier.github.io',
  base: '/education-musicale',
  build: {
    inlineStylesheets: 'always',
  },
  // Préchargement des liens internes au survol : navigation plus fluide.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
});