export interface MoyenAgeVideo {
  badge: string;
  title: string;
  url: string;
}

export interface TimelineStep {
  period: string;
  title: string;
  text: string;
}

export interface HymnLine {
  note: string;
  syllable: string;
  rest: string;
}

/**
 * Médias associés à l'hymne « Ut queant laxis » : l'extrait grégorien
 * et la reproduction de la partition d'origine.
 */
export interface HymnMedia {
  /** Extrait MP3 local (relatif à /public). */
  audioUrl: string;
  /** Titre affiché dans le mini-lecteur. */
  audioTitle: string;
  /** Image de la partition (relatif à /public). */
  scoreImage: string;
  /** Texte alternatif de la partition. */
  scoreAlt: string;
  /** Légende affichée sous la partition. */
  scoreCaption: string;
}

/**
 * Illustration affichée dans la modale d'un terme de la notation médiévale.
 */
export interface NotationGlossaryEntry {
  /** Titre explicatif de la modale. */
  title: string;
  /** Image (relative à /public). */
  image: string;
  /** Texte alternatif de l'image. */
  alt: string;
  /** Légende affichée sous l'image. */
  caption: string;
  /** Largeur intrinsèque de l'image, pour réserver la place. */
  width: number;
  /** Hauteur intrinsèque de l'image, pour réserver la place. */
  height: number;
}

export type NotationGlossaryTerm = 'neumes' | 'tetragramme';

export interface MusicTypeFact {
  label: string;
  value: string;
}

export interface MusicType {
  id: string;
  place: string;
  name: string;
  icon: string;
  accent: string;
  lead: string;
  facts: MusicTypeFact[];
  listeningFocus: string;
  /** Extrait MP3 local (relatif à /public). */
  audioUrl: string;
  /** Titre affiché dans le mini-lecteur. */
  audioTitle: string;
  /** Lien d'écoute intégrale sur YouTube. */
  youtubeUrl: string;
}

export interface MedievalInstrument {
  id: string;
  name: string;
  family: string;
  accent: string;
  image: string;
  description: string;
}

/**
 * Toutes les vidéos de la séquence, regroupées dans une seule section
 * « Ressources Vidéos » en bas de page.
 *
 * Les trois chants (grégorien, profane, traditionnel) ne figurent pas ici :
 * ils sont écoutables directement dans l'onglet « Les types de musique ».
 */
export const moyenAgeVideos: MoyenAgeVideo[] = [
  {
    badge: 'Capsule',
    title: 'Musique et Moyen-Âge — Capsule',
    url: 'https://www.youtube.com/watch?v=L-aoygQIMt4',
  },
  {
    badge: 'Pour aller plus loin',
    title: "L'origine du nom des notes",
    url: 'https://www.youtube.com/watch?v=JK2MAR-MIAo',
  },
  {
    badge: 'Traditionnel',
    title: 'À la volette',
    url: 'https://www.youtube.com/watch?v=VC6Iy7rtmw0',
  },
  {
    badge: 'Traditionnel',
    title: 'À la volette - Kaamelott',
    url: 'https://www.youtube.com/watch?v=A9V1CRtQ1jk',
  },
  {
    badge: "Capsule Instruments",
    title: "Les instruments au Moyen Âge",
    url: 'https://www.youtube.com/watch?v=2qSb-z_5boE',
  },
  {
    badge: 'Traditionnel',
    title: "J'ai vu le loup, le r'nard, le lièvre",
    url: 'https://www.youtube.com/watch?v=uz_pJD4zk4k',
  },
  {
    badge: 'Traditionnel',
    title: "Choeur de collège - J'ai vu le loup, le r'nard, le lièvre",
    url: 'https://www.youtube.com/watch?v=8YCGXN9Npl8',
  },
];

export const notationTimeline: TimelineStep[] = [
  {
    period: 'Avant le IXᵉ siècle',
    title: 'Tout se transmet de mémoire',
    text: "Les mélodies passent d'une personne à l'autre par l'écoute et la répétition. Il n'existe pas encore de signes capables de noter précisément la musique.",
  },
  {
    period: 'IXᵉ – Xᵉ siècle',
    title: 'Les neumes',
    text: 'Pour conserver les chants religieux, les moines placent de petits signes au-dessus des paroles. Les neumes indiquent le contour de la mélodie, mais pas encore sa hauteur exacte.',
  },
  {
    period: 'XIᵉ siècle',
    title: 'Guido d’Arezzo et le tétragramme',
    text: 'Le moine italien Guido d’Arezzo dispose les neumes sur quatre lignes : le tétragramme. Chaque ligne correspond désormais à une hauteur précise.',
  },
  {
    period: 'XIIIᵉ – XVᵉ siècle',
    title: 'Vers la portée moderne',
    text: 'Les lignes se multiplient, les clés apparaissent et la forme des notes se précise. La musique peut être conservée, copiée et apprise sans avoir été entendue.',
  },
  {
    period: 'XVIIᵉ siècle',
    title: 'Ut devient Do, le Si complète la gamme',
    text: 'Le nom « ut », difficile à chanter, est remplacé par « do ». Le « si », formé plus tard avec les initiales de « Sancte Iohannes », complète la gamme à sept notes.',
  },
];

export const utQueantLaxis: HymnLine[] = [
  { note: 'ut', syllable: 'Ut', rest: 'queant laxis' },
  { note: 'ré', syllable: 'Re', rest: 'sonare fibris' },
  { note: 'mi', syllable: 'Mi', rest: 'ra gestorum' },
  { note: 'fa', syllable: 'Fa', rest: 'muli tuorum' },
  { note: 'sol', syllable: 'Sol', rest: 've polluti' },
  { note: 'la', syllable: 'La', rest: 'bii reatum' },
  { note: 'si*', syllable: 'Sancte', rest: 'Iohannes' },
];

export const utQueantLaxisMedia: HymnMedia = {
  audioUrl: '/moyen-age/ChantGregorienUtQueantLaxis.mp3',
  audioTitle: 'Ut queant laxis',
  scoreImage: '/moyen-age/UtQueantLaxis.jpg',
  scoreAlt:
    "Partition de l'hymne « Ut queant laxis » en notation carrée sur tétragramme, avec le texte latin : Ut queant laxis, resonare fibris, mira gestorum famuli tuorum, solve polluti labii reatum, sancte Iohannes.",
  scoreCaption:
    "La partition de l'hymne « Ut queant laxis », en notation carrée sur tétragramme. Chaque vers commence une note plus haut que le précédent.",
};

/**
 * Illustrations des termes de la notation médiévale, ouvertes dans une modale
 * depuis la section « La notation musicale ».
 */
export const notationGlossary: Record<NotationGlossaryTerm, NotationGlossaryEntry> = {
  neumes: {
    title: 'Les neumes — les premiers signes musicaux',
    image: '/moyen-age/neumes.jpg',
    alt:
      "Manuscrit médiéval où de petits signes, les neumes, sont tracés au-dessus des paroles latines du chant « Jubilate Deo universa terra ».",
    caption:
      "Les neumes suivent le contour de la mélodie sans indiquer encore une hauteur précise : ils aident la mémoire plus qu'ils ne fixent la note exacte.",
    width: 1184,
    height: 740,
  },
  tetragramme: {
    title: 'Le tétragramme — quatre lignes pour la hauteur',
    image: '/moyen-age/tetragramme.jpg',
    alt:
      "Notation carrée sur quatre lignes formant le tétragramme, avec le texte latin « Puer natus est nobis ».",
    caption:
      "Avec le tétragramme de Guido d’Arezzo, chaque ligne fixe une hauteur : la mélodie devient lisible même sans l'avoir entendue.",
    width: 463,
    height: 449,
  },
};

export const musicTypes: MusicType[] = [
  {
    id: 'gregorien',
    place: "À l'église",
    name: 'Chant grégorien',
    icon: '⛪',
    accent: '#c084fc',
    lead: "La musique sacrée accompagne la prière et la liturgie. Les moines chantent en latin, à l'unisson et sans instruments : c'est une monodie.",
    facts: [
      { label: 'Rôle', value: 'Prier et accompagner les offices religieux' },
      { label: 'Lieu', value: "L'église, l'abbaye, le monastère" },
      { label: 'Langue', value: 'Le latin' },
      { label: 'Texture', value: "Monodie : une seule ligne mélodique chantée à l'unisson" },
      { label: 'Interprètes', value: 'Les moines et les clercs' },
      { label: 'Transmission', value: 'Manuscrits, neumes puis notation sur portée' },
    ],
    listeningFocus: "Repère la voix unique, le texte latin et l'absence d'accompagnement instrumental.",
    audioUrl: '/moyen-age/ChantGregorienUtQueantLaxis.mp3',
    audioTitle: 'Ut queant laxis',
    youtubeUrl: 'https://youtu.be/B0D2Rly51Cs?si=y3IzoayQSK5h_VRg',
  },
  {
    id: 'profane',
    place: 'Au château',
    name: 'Chant profane',
    icon: '🏰',
    accent: '#f59e0b',
    lead: "Loin de l'église, troubadours et trouvères chantent l'amour, la guerre et la nature pour la noblesse. Cette musique n'est pas religieuse : elle est dite profane.",
    facts: [
      { label: 'Rôle', value: 'Divertir, raconter, séduire et célébrer les exploits' },
      { label: 'Lieu', value: 'Le château, la cour seigneuriale' },
      { label: 'Langue', value: "Langue d'oc au sud (troubadours), langue d'oïl au nord (trouvères)" },
      { label: 'Texture', value: 'Voix souvent accompagnée par des instruments' },
      { label: 'Interprètes', value: 'Troubadours, trouvères et jongleurs' },
      { label: 'Transmission', value: 'Souvent orale, parfois fixée par écrit' },
    ],
    listeningFocus: "Écoute la langue ancienne, la prononciation et la présence éventuelle d'instruments.",
    audioUrl: '/moyen-age/ChantProfaneMultEstesGuariz.mp3',
    audioTitle: 'Mult estes guariz',
    youtubeUrl: 'https://youtu.be/rbjFZuHA008?si=Y3KkT6u6ZLw6ll6J',
  },
  {
    id: 'traditionnel',
    place: 'À la ferme et au village',
    name: 'Chant traditionnel',
    icon: '🌾',
    accent: '#34d399',
    lead: "Les paysans chantent pour travailler, danser et fêter les saisons. Ces chants circulent oralement et se transmettent de génération en génération.",
    facts: [
      { label: 'Rôle', value: 'Rythmer le travail, la danse et les fêtes' },
      { label: 'Lieu', value: 'La ferme, la place du village, les champs' },
      { label: 'Langue', value: 'Français et langues régionales' },
      { label: 'Texture', value: 'Souvent monodique, parfois accompagné par des instruments' },
      { label: 'Interprètes', value: 'Les villageois, le peuple' },
      { label: 'Transmission', value: 'Orale, de génération en génération' },
    ],
    listeningFocus: 'Repère le rythme de danse, les répétitions et les moments où le groupe reprend le chant en chœur.',
    audioUrl: '/moyen-age/ChantTraditionneljaivuleloup.mp3',
    audioTitle: "J'ai vu le loup, le r'nard, le lièvre",
    youtubeUrl: 'https://youtu.be/pJ9JmcYTE1g?si=HRLBTo7U6qIFTEfL',
  },
];


export const medievalInstruments: MedievalInstrument[] = [
  {
    id: 'vielle-archet',
    name: 'Vièle à archet',
    family: 'Cordes frottées',
    accent: '#38bdf8',
    image: '/moyen-age/vieleaarchet.jpg',
    description: "Ancêtre du violon, elle se joue avec un archet. Sa forme et sa taille variaient selon les régions.",
  },
  {
    id: 'vielle-roue',
    name: 'Vièle à roue',
    family: 'Cordes frottées',
    accent: '#38bdf8',
    image: '/moyen-age/vielearoue.jpg',
    description: "Une roue entraînée par une manivelle frotte les cordes. La main gauche joue les notes sur des touches.",
  },
  {
    id: 'harpe',
    name: 'Harpe',
    family: 'Cordes pincées',
    accent: '#a78bfa',
    image: '/moyen-age/harpe.jpg',
    description: 'Les doigts pincent les cordes. Très répandue au Moyen Âge, elle accompagne les chants et les danses.',
  },
  {
    id: 'luth',
    name: 'Luth',
    family: 'Cordes pincées',
    accent: '#a78bfa',
    image: '/moyen-age/luth.jpg',
    description: "Instrument à manche et caisse en forme de poire, il accompagne notamment les chants des troubadours.",
  },
  {
    id: 'tournebout',
    name: 'Tournebout',
    family: 'Vents',
    accent: '#fbbf24',
    image: '/moyen-age/tournebout.jpg',
    description: "Instrument à vent en Vents au tube courbé, muni d'une anche double et d'un pavillon recourbé.",
  },
  {
    id: 'flute-bec',
    name: 'Flûte à bec',
    family: 'Vents',
    accent: '#fbbf24',
    image: '/moyen-age/fluteabec.jpg',
    description: 'On souffle dans le bec et les doigts bouchent les trous. Elle est très utilisée pour jouer des danses.',
  },
  {
    id: 'cornemuse',
    name: 'Cornemuse',
    family: 'Vents',
    accent: '#fbbf24',
    image: '/moyen-age/cornemuse.jpg',
    description: "Un sac d'air alimente plusieurs tuyaux : le chalumeau joue la mélodie, les bourdons tiennent une note continue.",
  },
  {
    id: 'tambour',
    name: 'Tambour / Bendir',
    family: 'Percussions',
    accent: '#f87171',
    image: '/moyen-age/tambourbendir.jpg',
    description: 'On frappe la peau avec les mains ou des baguettes. Il donne le rythme des danses, des marches et des fêtes.',
  },
];

