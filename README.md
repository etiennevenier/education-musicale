# Éducation Musicale

Site d'éducation musicale pour le collège (6ème à 3ème), construit avec [Astro](https://astro.build)
et publié sur GitHub Pages : https://etiennevenier.github.io/education-musicale

## Développement

```sh
npm install
npm run dev      # serveur local
npm run build    # génère dist/
npx astro check  # vérifie les types et les composants
```

## Organisation du projet

- `src/data/` : contenu des séquences et des quiz (`sequences.ts` = liste des niveaux et séquences).
- `src/components/` : un composant par séquence (`…Course`) ou par activité (`…Quiz`, etc.).
- `src/components/entrainement/` : outils d'entraînement (lecture de notes, clavier, piano…).
- `src/utils/` : fonctions communes (`audioManager`, `navigation`, `random`, `musicNotes`…).
- `public/<thème>/` : fichiers audio et images, un dossier par séquence.

## Conventions pour les ressources

- Noms de fichiers **sans accent** (`Melodique`, pas `Mélodique`) : macOS et Linux n'encodent pas
  les accents de la même façon, ce qui provoque des 404 en ligne.
- Les URLs de `public/` passent par `relativeUrl()` (`src/utils/navigation.ts`) pour inclure le
  préfixe `/education-musicale`.
- Le mélange aléatoire se fait avec `shuffle` de `src/utils/random.ts` (ne pas le recopier).
