import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ⚙️ METTEZ VOTRE URL ICI (sans slash à la fin)
const SITE_URL = 'https://etiennevenier.github.io/education-musicale'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossier où Astro génère son build (par défaut 'dist')
const DIST_DIR = path.join(__dirname, 'dist');
const SITEMAP_PATH = path.join(DIST_DIR, 'sitemap.xml');

// Fonction récursive pour trouver tous les fichiers HTML dans le dossier dist
function getHtmlFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function generateSitemap() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error("❌ Le dossier 'dist/' n'existe pas. Lancez d'abord votre build Astro !");
    return;
  }

  const htmlFiles = getHtmlFiles(DIST_DIR);
  
  const urls = htmlFiles.map(file => {
    // Transforme le chemin du fichier HTML en URL relative
    let relativePath = path.relative(DIST_DIR, file)
      .replace(/\\/g, '/')
      .replace(/\/index\.html$/, '/')
      .replace(/^index\.html$/, '');

    // Évite les doublons de slash
    const loc = relativePath === '' ? `${SITE_URL}/` : `${SITE_URL}/${relativePath}`;
    
    return `  <url>
    <loc>${loc}</loc>
    <changefreq>weekly</changefreq>
  </url>`;
  });

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  fs.writeFileSync(SITEMAP_PATH, sitemapContent, 'utf8');
  console.log(`✅ Sitemap généré avec succès dans dist/sitemap.xml (${urls.length} pages trouvées) !`);
}

generateSitemap();