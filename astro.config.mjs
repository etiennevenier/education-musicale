import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://etiennevenier.github.io',
  base: '/education-musicale',
  build: {
    // Intègre le CSS critique directement dans le HTML pour supprimer la requête bloquante
    inlineStylesheets: 'always', 
  },
});