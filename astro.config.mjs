import { defineConfig } from 'astro/config';

// Deux adresses possibles pour le même site :
// - par défaut : GitHub Pages, https://etiennevenier.github.io/education-musicale
// - SITE_TARGET=cloudflare (commande « npm run build:cloudflare ») :
//   https://musique.etiennevenier.com, à la racine.
const cloudflare = process.env.SITE_TARGET === 'cloudflare';

export default defineConfig({
  site: cloudflare ? 'https://musique.etiennevenier.com' : 'https://etiennevenier.github.io',
  base: cloudflare ? '/' : '/education-musicale',
  build: {
    inlineStylesheets: 'always',
  },
  // Préchargement des liens internes au survol : navigation plus fluide.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
});
