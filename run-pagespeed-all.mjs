const API_KEY = process.env.PSI_API_KEY;
const SITEMAP_URL = 'https://etiennevenier.github.io/education-musicale/sitemap.xml';
const STRATEGY = 'mobile'; // Ou 'desktop'
const SITE_URL = 'https://etiennevenier.github.io/education-musicale';

// Fonction utilitaire pour marquer une pause entre chaque analyse
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  if (!API_KEY) {
    console.error(
      "❌ PSI_API_KEY manquante : définir la variable d'environnement (export PSI_API_KEY=...) puis relancer.",
    );
    process.exit(1);
  }

  console.log("🔍 Récupération du sitemap...");
  
  try {
    const res = await fetch(SITEMAP_URL);
    if (!res.ok) {
      throw new Error(`Impossible de récupérer le sitemap (statut HTTP: ${res.status})`);
    }
    
    const xml = await res.text();
    
    // Extraction des URLs du sitemap
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
    
    if (urls.length === 0) {
      console.log("⚠️ Aucune URL trouvée dans le sitemap.xml");
      return;
    }

    console.log(`🚀 ${urls.length} pages trouvées. Lancement de l'analyse PageSpeed (${STRATEGY})...\n`);

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`⏳ [${i + 1}/${urls.length}] Analyse en cours : ${url}`);

      const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${API_KEY}&strategy=${STRATEGY}`;
      
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.error) {
          console.error(`❌ [Erreur API] ${url} : ${data.error.message}`);
        } else {
          const score = Math.round((data.lighthouseResult?.categories?.performance?.score || 0) * 100);
          const color = score >= 90 ? '🟢' : score >= 50 ? '🟠' : '🔴';
          
          console.log(`${color} [Perf: ${score}/100] ➔ ${url}\n`);
        }
      } catch (err) {
        console.error(`❌ Échec réseau pour ${url}:`, err.message);
      }

      // Petite pause pour éviter de surcharger l'API
      await sleep(1500);
    }

    console.log("✨ Analyse terminée pour toutes les pages !");
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution du script :", error.message);
  }
}

run();