/** Données du séquenceur Bruitomatic (familles, pistes, modèles). */

export interface BruitomaticCategory {
  id: string;
  label: string;
  icon: string;
}

export interface BruitomaticTrack {
  id: string;
  name: string;
  file: string;
  category: string;
}

export interface BruitomaticPreset {
  id: string;
  name: string;
  icon: string;
  desc: string;
  pattern: Record<string, number[]>;
}

export const categories: BruitomaticCategory[] = [
  { id: 'metal', label: 'Corps & métal', icon: '🔩' },
  { id: 'objets', label: 'Objets du quotidien', icon: '🧰' },
  { id: 'eau', label: 'Verre & eau', icon: '💧' },
  { id: 'signal', label: 'Signal & carillon', icon: '🔔' },
];

export const tracks: BruitomaticTrack[] = [
  { id: 'paslourd', name: 'Pas lourd', file: 'paslourd.mp3', category: 'metal' },
  {
    id: 'boitedeconserve',
    name: 'Boîte de conserve',
    file: 'boitedeconserve.mp3',
    category: 'metal',
  },
  { id: 'enclume', name: 'Enclume', file: 'enclume.mp3', category: 'metal' },
  {
    id: 'tubeplastique',
    name: 'Tube plastique',
    file: 'tubeplastiquequitombe.mp3',
    category: 'metal',
  },
  {
    id: 'grincementportail',
    name: 'Portail métal',
    file: 'grincementportailmetal.mp3',
    category: 'metal',
  },
  { id: 'briquet', name: 'Briquet', file: 'briquetallumage.mp3', category: 'objets' },
  {
    id: 'trousseau',
    name: 'Trousseau de clés',
    file: 'trousseaucle.mp3',
    category: 'objets',
  },
  {
    id: 'potyaourt',
    name: 'Pot de yaourt',
    file: 'potyaourtplastique.mp3',
    category: 'objets',
  },
  {
    id: 'bouchon',
    name: 'Bouchon bouteille',
    file: 'bouchonbouteilleouverture.mp3',
    category: 'objets',
  },
  { id: 'balai', name: 'Balai', file: 'balaiquiessuie.mp3', category: 'objets' },
  { id: 'porte', name: 'Porte', file: 'ouvertureporte.mp3', category: 'objets' },
  {
    id: 'tchintchin',
    name: 'Tchin Champagne',
    file: 'tchintchinchampagne.mp3',
    category: 'eau',
  },
  { id: 'verre', name: 'Verre qui éclate', file: 'verrequieclate.mp3', category: 'eau' },
  {
    id: 'verredeau',
    name: "Verre d'eau",
    file: 'remplissageverredeau.mp3',
    category: 'eau',
  },
  {
    id: 'paille',
    name: 'Aspiration paille',
    file: 'aspirationpaille.mp3',
    category: 'eau',
  },
  {
    id: 'goutte',
    name: "Goutte d'eau",
    file: 'gouttedeaucasserole.mp3',
    category: 'eau',
  },
  {
    id: 'carillon',
    name: 'Carillon',
    file: 'carillondentree.mp3',
    category: 'signal',
  },
  {
    id: 'sifflet',
    name: 'Sifflet',
    file: 'siffletplastique.mp3',
    category: 'signal',
  },
];

export const presets: BruitomaticPreset[] = [
  {
    id: 'groove',
    name: 'Groove STOMP',
    icon: '🥾',
    desc: 'Grosse caisse et contretemps bien marqués.',
    pattern: {
      paslourd: [0, 4, 8, 12],
      enclume: [4, 12],
      boitedeconserve: [2, 6, 10, 14],
      potyaourt: [1, 5, 9, 13],
      tchintchin: [15],
    },
  },
  {
    id: 'samba',
    name: 'Samba Métallique',
    icon: '🥫',
    desc: 'Enclume et verres qui tintent en syncope.',
    pattern: {
      paslourd: [0, 8],
      enclume: [0, 3, 6, 10, 13],
      boitedeconserve: [2, 5, 9, 12, 15],
      tchintchin: [1, 4, 7, 11, 14],
      potyaourt: [0, 2, 4, 6, 8, 10, 12, 14],
      grincementportail: [8],
      sifflet: [15],
    },
  },
  {
    id: 'funk',
    name: 'Funk de Cuisine',
    icon: '🍳',
    desc: 'Bouchons, briquets et yaourts bien placés.',
    pattern: {
      paslourd: [0, 3, 6, 10],
      potyaourt: [2, 4, 8, 12, 14],
      bouchon: [3, 7, 11, 15],
      briquet: [1, 5, 9, 13],
      boitedeconserve: [4, 12],
      paille: [6, 14],
      carillon: [8],
    },
  },
  {
    id: 'machine',
    name: 'Machine à laver',
    icon: '🧺',
    desc: 'Balai, gouttes et portes qui grincent.',
    pattern: {
      briquet: [0, 4, 8, 12],
      balai: [2, 6, 10, 14],
      goutte: [1, 3, 5, 7, 9, 11, 13, 15],
      verredeau: [0, 8],
      tubeplastique: [3, 11],
      porte: [12],
      verre: [15],
    },
  },
];

export const steps = Array.from({ length: 16 }, (_, index) => index);
/** Index de ligne dans l'ordre d'affichage (familles, puis pistes). */
export const rowIndexById: Record<string, number> = Object.fromEntries(
  categories
    .flatMap((category) => tracks.filter((track) => track.category === category.id))
    .map((track, index) => [track.id, index]),
);
