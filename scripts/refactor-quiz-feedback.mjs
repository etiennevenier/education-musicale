import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDryRun = process.argv.includes('--dry');
const FILE_PATH = path.resolve(__dirname, '../src/components/OperaQuiz.astro');

function fixEmptyFeedback() {
  console.log(`\n🤖 === MASQUAGE DES BANDEAUX DE FEEDBACK VIDES (${isDryRun ? 'DRY-RUN 🔍' : 'ÉCRITURE ✍️'}) ===\n`);

  if (!fs.existsSync(FILE_PATH)) {
    console.error(`❌ Fichier introuvable : ${FILE_PATH}`);
    return;
  }

  const originalContent = fs.readFileSync(FILE_PATH, 'utf8');

  // Remplace l'affectation directe de la classe par la vérification du contenu
  const updatedContent = originalContent.replace(
    /feedbackBox\.className\s*=\s*`feedback-msg \${isCorrect \? 'success' : 'error'}`;/g,
    `const hasContent = Boolean(question.explanation || question.clipTitle);
    feedbackBox.style.display = hasContent ? 'block' : 'none';
    feedbackBox.className = \`feedback-msg \${isCorrect ? 'success' : 'error'}\`;`
  );

  if (originalContent !== updatedContent) {
    console.log(`✅ [OperaQuiz.astro] Condition de masquage du feedback vide ajoutée.`);
    if (!isDryRun) {
      fs.writeFileSync(FILE_PATH, updatedContent, 'utf8');
      console.log(`   └─ Fichier mis à jour sur le disque.`);
    }
  } else {
    console.log(`ℹ️ [OperaQuiz.astro] Modification déjà présente ou motif introuvable.`);
  }
}

fixEmptyFeedback();