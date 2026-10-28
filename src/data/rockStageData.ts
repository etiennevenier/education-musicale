/**
 * Données du « Studio Rock » (RockStageBuilder).
 * Importé par le composant (markup) ET par son script client : les recettes
 * (requirements) ne sont plus sérialisées dans le DOM.
 * Les URL d'images sont résolues côté composant (relativeUrl) à partir de `file`.
 */

export interface StageItem {
  id: string;
  label: string;
  file: string;
  kind: 'instrument' | 'tag';
}

export interface ItemGroup {
  id: string;
  title: string;
  hint: string;
  items: StageItem[];
}

export interface RockStyle {
  id: string;
  name: string;
  file: string;
  signature: string;
  requirements: string[];
}

export const groups: ItemGroup[] = [
  {
    id: 'instruments',
    title: '🎷 Instruments',
    hint: 'Tous les instruments au même niveau : à toi de choisir.',
    items: [
      // Ordre volontairement mélangé : aucune catégorie ne révèle le rôle d'un instrument.
      { id: 'guitare', label: 'Guitare électrique', file: 'guitare.jpg', kind: 'instrument' },
      { id: 'violon', label: 'Violon', file: 'violon.jpg', kind: 'instrument' },
      { id: 'basse', label: 'Basse', file: 'basse.jpg', kind: 'instrument' },
      { id: 'synthetiseur', label: 'Synthétiseur', file: 'synthetiseur.jpg', kind: 'instrument' },
      { id: 'contrebasse', label: 'Contrebasse', file: 'contrebasse.jpg', kind: 'instrument' },
      { id: 'batterie', label: 'Batterie', file: 'batterie.jpg', kind: 'instrument' },
      { id: 'trompette', label: 'Trompette', file: 'trompette.jpg', kind: 'instrument' },
      { id: 'piano', label: 'Piano', file: 'piano.jpg', kind: 'instrument' },
      { id: 'chant', label: 'Chant', file: 'chant.jpg', kind: 'instrument' },
      { id: 'trombone', label: 'Trombone', file: 'trombone.jpg', kind: 'instrument' },
      { id: 'saxophone', label: 'Saxophone', file: 'saxophone.jpg', kind: 'instrument' },
      { id: 'clarinette', label: 'Clarinette', file: 'clarinette.jpg', kind: 'instrument' },
      { id: 'harpe', label: 'Harpe', file: 'harpe.jpg', kind: 'instrument' },
      { id: 'fluteabec', label: 'Flûte à bec', file: 'fluteabec.jpg', kind: 'instrument' },
      { id: 'basson', label: 'Basson', file: 'basson.jpg', kind: 'instrument' },
    ],
  },
  {
    id: 'etiquettes',
    title: '🏷️ Étiquettes & Contexte',
    hint: 'Les ingrédients qui donnent sa couleur au morceau.',
    items: [
      { id: 'grilledeblues', label: 'Grille de blues', file: 'grilledeblues.jpg', kind: 'tag' },
      { id: 'annees50', label: 'Années 50', file: 'annees50.jpg', kind: 'tag' },
      { id: 'jazzinfluence', label: 'Influence du jazz', file: 'jazzinfluence.jpg', kind: 'tag' },
      {
        id: 'ecritureinfluencedrogue',
        label: 'Écriture sous influence de drogues',
        file: 'ecritureinfluencedrogue.jpg',
        kind: 'tag',
      },
      {
        id: 'saturation',
        label: 'Saturation poussée à l’extrême',
        file: 'saturation.jpg',
        kind: 'tag',
      },
      { id: 'formatcourt', label: 'Format court', file: 'formatcourt.jpg', kind: 'tag' },
      { id: '3accords', label: '3 accords', file: '3accords.jpg', kind: 'tag' },
      { id: 'textesrebelles', label: 'Textes rebelles', file: 'textesrebelles.jpg', kind: 'tag' },
      {
        id: 'harmoniesvocales',
        label: 'Harmonies vocales très travaillées',
        file: 'harmoniesvocales.jpg',
        kind: 'tag',
      },
      { id: 'sonsale', label: 'Son sale', file: 'sonsale.jpg', kind: 'tag' },
      {
        id: 'alternancecalmeexplosion',
        label: 'Alternance calme / explosion',
        file: 'alternancecalmeexplosion.jpg',
        kind: 'tag',
      },
      {
        id: 'paillettesmaquillage',
        label: 'Paillettes et maquillage',
        file: 'paillettesmaquillage.jpg',
        kind: 'tag',
      },
    ],
  },
];

export const items: StageItem[] = groups.flatMap((group) => group.items);

export const styles: RockStyle[] = [
  {
    id: 'rocknroll',
    name: "Rock 'n' Roll",
    file: 'rocknroll.jpg',
    signature:
      '1954 : Rock Around The Clock par Bill Haley and His Comets. La secousse qui invente le rock.',
    requirements: [
      'guitare',
      'batterie',
      'chant',
      'contrebasse',
      'saxophone',
      'grilledeblues',
      'annees50',
      'jazzinfluence',
    ],
  },
  {
    id: 'rockpsychedelique',
    name: 'Rock Psychédélique',
    file: 'rockpsychedelique.jpg',
    signature:
      'La basse remplace la contrebasse, les morceaux s’allongent et l’écriture sous influence ouvre de nouveaux mondes sonores.',
    requirements: ['guitare', 'basse', 'batterie', 'chant', 'ecritureinfluencedrogue'],
  },
  {
    id: 'hardrock',
    name: 'Hard Rock',
    file: 'hardrock.jpg',
    signature:
      'Le même groupe, mais avec une saturation poussée à l’extrême : plus lourd, plus fort, plus agressif.',
    requirements: ['guitare', 'basse', 'batterie', 'chant', 'saturation'],
  },
  {
    id: 'punkrock',
    name: 'Punk Rock',
    file: 'punkrock.jpg',
    signature:
      'Trois accords, format court, textes rebelles : l’énergie brute contre les solos interminables.',
    requirements: [
      'guitare',
      'basse',
      'batterie',
      'chant',
      'formatcourt',
      '3accords',
      'textesrebelles',
    ],
  },
  {
    id: 'poprock',
    name: 'Pop-Rock',
    file: 'poprock.jpg',
    signature:
      'Des harmonies vocales très travaillées et un format court : la mélodie passe avant la puissance.',
    requirements: ['guitare', 'basse', 'batterie', 'chant', 'harmoniesvocales', 'formatcourt'],
  },
  {
    id: 'grunge',
    name: 'Grunge',
    file: 'grunge.jpg',
    signature:
      'Un son sale et des alternances calme / explosion : l’énergie de Seattle au début des années 90.',
    requirements: ['guitare', 'basse', 'batterie', 'chant', 'sonsale', 'alternancecalmeexplosion'],
  },
  {
    id: 'glamrock',
    name: 'Glam Rock',
    file: 'glamrock.jpg',
    signature:
      'Paillettes et maquillage : le rock devient un spectacle total, flamboyant et théâtral.',
    requirements: ['guitare', 'basse', 'batterie', 'chant', 'paillettesmaquillage'],
  },
  {
    id: 'newwave',
    name: 'New Wave',
    file: 'newwave.jpg',
    signature:
      'Le synthétiseur entre dans le groupe : le rock rencontre l’électronique des années 80.',
    requirements: ['guitare', 'basse', 'batterie', 'chant', 'synthetiseur'],
  },
];
