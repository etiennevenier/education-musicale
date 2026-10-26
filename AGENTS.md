## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Conventions de contenu

- La section vidéos s'intitule toujours **« Ressources Vidéos »** (ne jamais utiliser « Œuvres et exemples » ni une autre variante).
- Les cartes vidéo affichent uniquement le lecteur et le badge de catégorie (ex. « Capsule ») : ni titre ni description sous la vidéo.
- Le composant `src/components/VideoCard.astro` ne possède volontairement pas de prop `description` ; ne pas la réintroduire.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Conventions des quiz

- Tout quiz utilise le gabarit `quiz-card` (`src/styles/quiz-card.css`) et les helpers de `src/utils/quizUi.ts` / `quiz.ts` / `quizConfig.ts` : pas de CSS ni de HTML de progression, de boutons ou d'écran de fin réinventés.
- Écran de fin identique partout (`showQuizResult`) : emoji, « Partie terminée ! », « X / N », « 🔄 Rejouer ». Aucun texte de bilan.
- Feedback : jamais de « Bravo », « Dommage », « X bonne(s) réponse(s) sur N » ni de rappel d'une bonne réponse déjà visible (vert/rouge). Un panneau `feedback-msg` n'existe que s'il apporte une information non visible : explication pédagogique issue des données, ou bonne réponse d'une saisie libre/numérique. Sinon, pas de panneau.
- Pas de message d'avertissement évitable : griser « Valider » tant que la réponse est incomplète.
- Après une bonne réponse, enchaînement automatique via `scheduleAutoNext` ; après une mauvaise, l'élève avance lui-même.
