import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://etiennevenier.github.io',
  base: '/education-musicale',
  build: {
    inlineStylesheets: 'always',
  },
});