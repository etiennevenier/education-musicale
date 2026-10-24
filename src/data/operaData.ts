/**
 * Données du quiz « Musique et Opéra » (4ème).
 *
 * Banque de 45 questions ; chaque partie en tire 10 au hasard :
 * - 1 à 17  : théorie (QCM, dont 2 questions à choix multiples) ;
 * - 18 à 33 : écoute « air ou récitatif ? » ;
 * - 34 à 39 : blindtest « grands airs » ;
 * - 40 à 45 : blindtest « aria et blind » (extraits mixtes).
 *
 * Les MP3 sont dans /public/opera et sont référencés par leur nom d'origine.
 * Les chemins sont passés à relativeUrl() au moment de la lecture, pour tenir
 * compte du BASE_URL Astro (/education-musicale). audioManager() réessaie
 * automatiquement l'URL en NFD en cas de 404 : les accents (é, è, û) passent.
 */

export type OperaQuestionKind = 'theory' | 'ecoute' | 'blindtest';

export interface OperaQuestion {
  /** Numéro de la question dans la banque (1 à 45). */
  number: number;
  kind: OperaQuestionKind;
  prompt: string;
  options: readonly string[];
  /** Une ou plusieurs bonnes réponses (plusieurs = question à choix multiples). */
  correctAnswers: readonly string[];
  explanation: string;
  /** MP3 dans public/opera (chemin public). Absent = question théorique. */
  audioUrl?: string;
  /** Œuvre et compositeur, révélés dans le feedback. */
  clipTitle?: string;
}

const audio = (file: string) => `/opera/${file}`;

const AIR_OU_RECIT_PROMPT =
  "Écoute cet extrait. Indique s'il s'agit d'un air ou d'un récitatif.";
const AIR_OU_RECIT_OPTIONS = ['Air', 'Récitatif'] as const;

const BLINDTEST_PROMPT = 'Écoute cet extrait. Quel est le titre de cet opéra / air ?';
const BLINDTEST_OPTIONS = [
  'Habanera (Opera : Carmen)',
  'Nessun Dorma (Opera : Turandot)',
  'La donna è mobile (Opera : Rigoletto)',
  "Barcarolle (Opera : Les contes d'Hoffmann)",
  "L'air de la reine de la nuit (Opera : La flûte enchantée)",
  'Libiamo ne lieti calici (Opera : La traviata)',
] as const;

/** Titres des extraits « Aria et blind » (fichiers 11 à 15). */
const ARIA_BLIND_OPTIONS = [
  'Voi che sapete (Les Noces de Figaro - Mozart)',
  'Air de la folie (Lucia di Lammermoor - Donizetti)',
  "Libiamo ne' lieti calici (La Traviata - Verdi)",
  'Duo des fleurs (Lakmé - Delibes)',
  'La donna è mobile (Rigoletto - Verdi)',
] as const;

/** Options de la question 45 : les airs « aria et blind » + La Bohème. */
const LA_BOHEME_OPTIONS = [
  ...ARIA_BLIND_OPTIONS,
  "Quando me'n vo' (La Bohème - Puccini)",
] as const;

export const operaQuestions: readonly OperaQuestion[] = [
  {
    number: 1,
    kind: 'theory',
    prompt: 'Comment se divise un opéra ?',
    options: [
      'En actes et en scènes',
      'En airs et en récitatifs',
      'En mouvements et en scènes',
      'En interludes et en sections vocales',
      'En préludes et en épisodes',
    ],
    correctAnswers: ['En actes et en scènes'],
    explanation:
      "Un opéra est une pièce de théâtre en musique : il se découpe en actes, eux-mêmes divisés en scènes. Airs et récitatifs sont des formes musicales jouées à l'intérieur de ces scènes.",
  },
  {
    number: 2,
    kind: 'theory',
    prompt: "Qu'est-ce qu'un air ?",
    options: [
      'Une partie chantée solo où le personnage exprime ses émotions',
      "Une partie parlée de l'opéra",
      'Une scène où tous les personnages chantent en chœur',
      'Une introduction orchestrale',
    ],
    correctAnswers: [
      'Une partie chantée solo où le personnage exprime ses émotions',
    ],
    explanation:
      "L'air est une page lyrique chantée en solo : le personnage s'arrête pour exprimer ses émotions. Le récitatif, lui, fait avancer l'action.",
  },
  {
    number: 3,
    kind: 'theory',
    prompt: "À quelle époque est apparu l'opéra ?",
    options: [
      'Moyen Âge',
      'Renaissance',
      'Baroque',
      'Classique',
      'Romantique',
      'Moderne',
      'Contemporaine',
    ],
    correctAnswers: ['Baroque'],
    explanation:
      "L'opéra naît en Italie vers 1600, à l'époque baroque : on cherche alors à faire revivre le théâtre grec antique en musique.",
  },
  {
    number: 4,
    kind: 'theory',
    prompt:
      "Coche tout ce qui correspond à la définition de l'opéra. Attention il y a un intrus.",
    options: [
      'Un genre musical qui combine musique, chant, et théâtre',
      'Une œuvre scénique où une partie des dialogues est chantée',
      'Une œuvre dramatique avec des passages chantés et orchestraux, souvent accompagnée de danse',
      'Un spectacle où tous les dialogues sont chantés',
      'Une œuvre musicale qui se joue uniquement dans des salles de concert',
    ],
    correctAnswers: [
      'Un genre musical qui combine musique, chant, et théâtre',
      'Une œuvre scénique où une partie des dialogues est chantée',
      'Une œuvre dramatique avec des passages chantés et orchestraux, souvent accompagnée de danse',
      'Un spectacle où tous les dialogues sont chantés',
    ],
    explanation:
      "Les quatre premières propositions décrivent l'opéra. L'intrus est : « Une œuvre musicale qui se joue uniquement dans des salles de concert » — un opéra est un spectacle scénique (costumes, décors, mise en scène), pas un simple concert.",
  },
  {
    number: 5,
    kind: 'theory',
    prompt: 'Par quoi commence systématiquement un opéra ?',
    options: [
      'Une ouverture',
      'Un prélude orchestral',
      'Un prologue dramatique',
      'Une symphonie',
      "Une scène d'exposition chantée",
      'Un interlude instrumental',
    ],
    correctAnswers: ['Une ouverture'],
    explanation:
      "L'ouverture est la pièce orchestrale qui ouvre le spectacle, avant le lever de rideau.",
  },
  {
    number: 6,
    kind: 'theory',
    prompt: 'En quelle année est apparu le premier opéra ?',
    options: ['1580', '1590', '1600', '1610', '1620', '1630'],
    correctAnswers: ['1600'],
    explanation:
      "L'Euridice de Jacopo Peri, créée à Florence, date de 1600 : c'est le plus ancien opéra conservé (la Dafne de 1598 est perdue).",
  },
  {
    number: 7,
    kind: 'theory',
    prompt: `Qui a écrit l'opéra "Carmen" ?`,
    options: [
      'Jacopo Peri',
      'Wolfgang Amadeus Mozart',
      'Giuseppe Verdi',
      'Georges Bizet',
      'Giacomo Puccini',
      'Jacques Offenbach',
    ],
    correctAnswers: ['Georges Bizet'],
    explanation:
      "Carmen (1875) est de Georges Bizet, d'après la nouvelle de Prosper Mérimée. Les autres compositeurs cités ont écrit d'autres opéras.",
  },
  {
    number: 8,
    kind: 'theory',
    prompt:
      "Qu'est-ce qui distingue un récitatif d'un air dans un opéra ?",
    options: [
      "Le récitatif est proche du langage parlé, tandis que l'air est purement chanté",
      "Le récitatif est accompagné par un orchestre, tandis que l'air est accompagné par un seul instrument",
      "Le récitatif se joue en groupe, tandis que l'air est en solo",
      "Le récitatif est une forme musicale utilisée seulement au début de l'opéra",
    ],
    correctAnswers: [
      "Le récitatif est proche du langage parlé, tandis que l'air est purement chanté",
    ],
    explanation:
      "Le récitatif suit le rythme de la parole : il fait avancer l'action. L'air est une mélodie plus développée où le personnage exprime ses sentiments.",
  },
  {
    number: 9,
    kind: 'theory',
    prompt: "Quelle est la fonction principale de l'ouverture dans un opéra ?",
    options: [
      "Introduire les thèmes musicaux qui seront développés pendant l'opéra",
      'Présenter les personnages principaux',
      "Résumer l'histoire avant qu'elle ne commence",
      "Permettre à l'orchestre de s'accorder",
    ],
    correctAnswers: [
      "Introduire les thèmes musicaux qui seront développés pendant l'opéra",
    ],
    explanation:
      "L'ouverture est purement orchestrale : elle installe l'ambiance et présente souvent les thèmes musicaux que l'on entendra ensuite.",
  },
  {
    number: 10,
    kind: 'theory',
    prompt:
      "Quelle est l'une des principales différences entre l'opéra et la comédie musicale ?",
    options: [
      "L'opéra utilise des voix lyriques travaillées, tandis que la comédie musicale utilise des voix amplifiées par un micro",
      "La comédie musicale utilise un orchestre, tandis que l'opéra utilise une bande-son",
      "La comédie musicale est jouée dans des salles spécifiques, tandis que l'opéra peut être joué partout",
      "L'opéra inclut des scènes de danse, tandis que la comédie musicale n'en a pas",
    ],
    correctAnswers: [
      "L'opéra utilise des voix lyriques travaillées, tandis que la comédie musicale utilise des voix amplifiées par un micro",
    ],
    explanation:
      "À l'opéra, les chanteurs projettent leur voix sans micro, grâce à une technique travaillée. Dans la comédie musicale, les voix sont amplifiées et le spectacle intègre souvent danse et esthétique plus populaire.",
  },
  {
    number: 11,
    kind: 'theory',
    prompt: "Dans quel pays est né le genre de l'opéra ?",
    options: [
      'Italie',
      'France',
      'Allemagne',
      'Angleterre',
      'Espagne',
      'Portugal',
      'Algérie',
    ],
    correctAnswers: ['Italie'],
    explanation:
      "Le genre naît en Italie, à Florence, autour de 1600, avec les membres de la Camerata florentine.",
  },
  {
    number: 12,
    kind: 'theory',
    prompt:
      "Quelle est la particularité des dialogues dans un opéra par rapport à une comédie musicale ?",
    options: [
      'Ils sont souvent chantés sous forme de récitatifs',
      'Ils sont entièrement chantés en chœur',
      'Ils sont tous accompagnés par un orchestre',
      'Ils sont improvisés par les chanteurs',
    ],
    correctAnswers: ['Ils sont souvent chantés sous forme de récitatifs'],
    explanation:
      "Dans un opéra, les dialogues sont le plus souvent chantés en récitatif : le texte avance sur un chant proche de la parole. La comédie musicale alterne plutôt chant, dialogues parlés et danse.",
  },
  {
    number: 13,
    kind: 'theory',
    prompt: "Quel est le premier opéra de l'histoire ?",
    options: [
      'Euridice',
      'Don Giovanni',
      'Carmen',
      'La Traviata',
      'Turandot',
      'La flûte enchantée',
    ],
    correctAnswers: ['Euridice'],
    explanation:
      "Euridice de Jacopo Peri (1600) est considéré comme le premier opéra de l'histoire : c'est le plus ancien qui nous soit parvenu.",
  },
  {
    number: 14,
    kind: 'theory',
    prompt: 'Qui a écrit le tout premier opéra ?',
    options: [
      'Jacopo Peri',
      'Wolfgang Amadeus Mozart',
      'Giuseppe Verdi',
      'Georges Bizet',
      'Giacomo Puccini',
      'Jacques Offenbach',
    ],
    correctAnswers: ['Jacopo Peri'],
    explanation:
      "Jacopo Peri compose Euridice en 1600 ; il est souvent présenté comme l'auteur du premier opéra.",
  },
  {
    number: 15,
    kind: 'theory',
    prompt:
      'Comment se termine généralement un opéra, par rapport à une comédie musicale ?',
    options: [
      "L'opéra a souvent un dénouement dramatique, tandis que la comédie musicale se termine plutôt de façon heureuse",
      'Les deux se terminent toujours par un mariage',
      "L'opéra se termine par un acte de danse, tandis que la comédie musicale se termine par un chant en chœur",
      "L'opéra et la comédie musicale ont des fins similaires",
    ],
    correctAnswers: [
      "L'opéra a souvent un dénouement dramatique, tandis que la comédie musicale se termine plutôt de façon heureuse",
    ],
    explanation:
      "L'opéra se termine souvent par un dénouement tragique (la mort de Carmen, de Mimi…), alors que la comédie musicale privilégie une fin heureuse.",
  },
  {
    number: 16,
    kind: 'theory',
    prompt:
      "Quel est l'élément commun entre l'opéra et la comédie musicale ?",
    options: [
      'Ils sont tous les deux des genres scéniques avec une histoire racontée en musique',
      'Ils se déroulent tous les deux sans costumes',
      'Les chanteurs utilisent toujours un micro pour amplifier leur voix',
      'Ils sont tous accompagnés par une bande sonore',
    ],
    correctAnswers: [
      'Ils sont tous les deux des genres scéniques avec une histoire racontée en musique',
    ],
    explanation:
      "Les deux sont des spectacles qui racontent une histoire en musique, sur scène, avec des chanteurs-comédiens.",
  },
  {
    number: 17,
    kind: 'theory',
    prompt:
      "Quelles sont les caractéristiques d'une voix utilisée dans l'opéra ?",
    options: [
      'Elle est puissante et projetée naturellement pour remplir la salle',
      'Elle nécessite un entraînement rigoureux et technique',
      'Elle est capable de maintenir une grande intensité sur des notes tenues',
      'Elle est généralement amplifiée par des micros pour être entendue dans la salle',
      'Elle est souvent plus faible et douce que dans les autres genres musicaux',
    ],
    correctAnswers: [
      'Elle est puissante et projetée naturellement pour remplir la salle',
      'Elle nécessite un entraînement rigoureux et technique',
      'Elle est capable de maintenir une grande intensité sur des notes tenues',
    ],
    explanation:
      "La voix lyrique est puissante, projetée sans micro, et repose sur un travail technique poussé (souffle, résonances) qui permet de tenir de longues notes. Les deux dernières propositions sont fausses : on ne chante pas avec un micro à l'opéra et la voix n'y est pas douce.",
  },
  // --- 18 à 25 : air ou récitatif (les airs) -------------------------------
  {
    number: 18,
    kind: 'ecoute',
    prompt: AIR_OU_RECIT_PROMPT,
    options: AIR_OU_RECIT_OPTIONS,
    correctAnswers: ['Air'],
    explanation:
      "La voix déploie une mélodie continue, avec des notes tenues, sur un accompagnement orchestral régulier : c'est un air.",
    audioUrl: audio('09 Aria lascia chio pianga.mp3'),
    clipTitle: 'Rinaldo — Haendel',
  },
  {
    number: 19,
    kind: 'ecoute',
    prompt: AIR_OU_RECIT_PROMPT,
    options: AIR_OU_RECIT_OPTIONS,
    correctAnswers: ['Air'],
    explanation:
      "La voix chante une mélodie suivie et expressive, soutenue par l'orchestre : c'est un air, et non une déclamation proche de la parole.",
    audioUrl: audio('10 Aria et blind puccini la boheme quando soletto.mp3'),
    clipTitle: 'La Bohème — Puccini',
  },
  {
    number: 20,
    kind: 'ecoute',
    prompt: AIR_OU_RECIT_PROMPT,
    options: AIR_OU_RECIT_OPTIONS,
    correctAnswers: ['Air'],
    explanation:
      "Courte aria à la mélodie régulière, accompagnée par l'orchestre : c'est un air.",
    audioUrl: audio('11 Aria et blind voi che sapete.mp3'),
    clipTitle: 'Les Noces de Figaro — Mozart',
  },
  {
    number: 21,
    kind: 'ecoute',
    prompt: AIR_OU_RECIT_PROMPT,
    options: AIR_OU_RECIT_OPTIONS,
    correctAnswers: ['Air'],
    explanation:
      "Grand air virtuose de la scène de la folie : longues phrases chantées et vocalises, sans déclamation parlée.",
    audioUrl: audio('12 Aria et blind lucia di lamermoor air de la folie.mp3'),
    clipTitle: 'Lucia di Lammermoor — Donizetti',
  },
  {
    number: 22,
    kind: 'ecoute',
    prompt: AIR_OU_RECIT_PROMPT,
    options: AIR_OU_RECIT_OPTIONS,
    correctAnswers: ['Air'],
    explanation:
      "Mélodie chantée et mesurée, avec un accompagnement orchestral continu : c'est un air (un numéro chanté).",
    audioUrl: audio('13 Aria et blind libiamo ne lieti calici.mp3'),
    clipTitle: 'La traviata — Verdi',
  },
  {
    number: 23,
    kind: 'ecoute',
    prompt: AIR_OU_RECIT_PROMPT,
    options: AIR_OU_RECIT_OPTIONS,
    correctAnswers: ['Air'],
    explanation:
      "Duo lyrique aux mélodies suspendues : c'est un air, par opposition au récitatif qui fait avancer l'action.",
    audioUrl: audio('14 Aria et blind duo des fleurs.mp3'),
    clipTitle: 'Lakmé — Delibes',
  },
  {
    number: 24,
    kind: 'ecoute',
    prompt: AIR_OU_RECIT_PROMPT,
    options: AIR_OU_RECIT_OPTIONS,
    correctAnswers: ['Air'],
    explanation:
      "Mélodie légère et mémorable chantée par le ténor : c'est un air.",
    audioUrl: audio('15 Aria et blind la donna e mobile.mp3'),
    clipTitle: 'Rigoletto — Verdi',
  },
  {
    number: 25,
    kind: 'ecoute',
    prompt: AIR_OU_RECIT_PROMPT,
    options: AIR_OU_RECIT_OPTIONS,
    correctAnswers: ['Air'],
    explanation:
      "Air chanté, avec une mélodie construite et un accompagnement orchestral : ce n'est pas un récitatif.",
    audioUrl: audio('16 Aria et blind flute enchantee.mp3'),
    clipTitle: 'La Flûte enchantée — Mozart',
  },
  // --- 26 à 33 : air ou récitatif (les récitatifs) -------------------------
  {
    number: 26,
    kind: 'ecoute',
    prompt: AIR_OU_RECIT_PROMPT,
    options: AIR_OU_RECIT_OPTIONS,
    correctAnswers: ['Récitatif'],
    explanation:
      "La voix suit le rythme de la parole, presque comme au théâtre, sur un accompagnement discret : c'est un récitatif.",
    audioUrl: audio('01 recitatif Cosi Fan Tutte.mp3'),
    clipTitle: 'Così fan tutte — Mozart',
  },
  {
    number: 27,
    kind: 'ecoute',
    prompt: AIR_OU_RECIT_PROMPT,
    options: AIR_OU_RECIT_OPTIONS,
    correctAnswers: ['Récitatif'],
    explanation:
      "Le texte est déclamé et l'action progresse : c'est un récitatif.",
    audioUrl: audio('02 recitatif Le barbier de Seville.mp3'),
    clipTitle: 'Le Barbier de Séville — Rossini',
  },
  {
    number: 28,
    kind: 'ecoute',
    prompt: AIR_OU_RECIT_PROMPT,
    options: AIR_OU_RECIT_OPTIONS,
    correctAnswers: ['Récitatif'],
    explanation:
      "La déclamation sert le drame, sans mélodie régulière : c'est un récitatif.",
    audioUrl: audio('03 recitatif Orphee.mp3'),
    clipTitle: 'Orfeo ed Euridice — Gluck',
  },
  {
    number: 29,
    kind: 'ecoute',
    prompt: AIR_OU_RECIT_PROMPT,
    options: AIR_OU_RECIT_OPTIONS,
    correctAnswers: ['Récitatif'],
    explanation:
      "La voix parle presque, sur une basse continue discrète : c'est un récitatif.",
    audioUrl: audio('04 recitatif Giulio Cesare.mp3'),
    clipTitle: 'Giulio Cesare — Haendel',
  },
  {
    number: 30,
    kind: 'ecoute',
    prompt: AIR_OU_RECIT_PROMPT,
    options: AIR_OU_RECIT_OPTIONS,
    correctAnswers: ['Récitatif'],
    explanation:
      "Le texte est déclamé pour faire avancer l'intrigue : c'est un récitatif.",
    audioUrl: audio('05 recitatif La clemenza di Tito.mp3'),
    clipTitle: 'La clemenza di Tito — Mozart',
  },
  {
    number: 31,
    kind: 'ecoute',
    prompt: AIR_OU_RECIT_PROMPT,
    options: AIR_OU_RECIT_OPTIONS,
    correctAnswers: ['Récitatif'],
    explanation:
      "Ce passage parlé-chanté amène le duo « Là ci darem la mano » : c'est un récitatif.",
    audioUrl: audio('06 recitatif La ci darem la mano.mp3'),
    clipTitle: 'Don Giovanni — Mozart',
  },
  {
    number: 32,
    kind: 'ecoute',
    prompt: AIR_OU_RECIT_PROMPT,
    options: AIR_OU_RECIT_OPTIONS,
    correctAnswers: ['Récitatif'],
    explanation:
      "Les personnages se parlent en chantant et l'action avance : c'est un récitatif.",
    audioUrl: audio('07 recitatif Le nozze di Figaro.mp3'),
    clipTitle: 'Les Noces de Figaro — Mozart',
  },
  {
    number: 33,
    kind: 'ecoute',
    prompt: AIR_OU_RECIT_PROMPT,
    options: AIR_OU_RECIT_OPTIONS,
    correctAnswers: ['Récitatif'],
    explanation:
      "Déclamation continue, proche de la parole : c'est un récitatif.",
    audioUrl: audio('08 recitatif Orlando.mp3'),
    clipTitle: 'Orlando — Haendel',
  },
  // --- 34 à 39 : blindtest « grands airs » --------------------------------
  {
    number: 34,
    kind: 'blindtest',
    prompt: BLINDTEST_PROMPT,
    options: BLINDTEST_OPTIONS,
    correctAnswers: ["L'air de la reine de la nuit (Opera : La flûte enchantée)"],
    explanation:
      "L'air de la Reine de la Nuit (« Der Hölle Rache ») est célèbre pour ses vocalises très aiguës.",
    audioUrl: audio('17 Blind Flute enchantee.mp3'),
  },
  {
    number: 35,
    kind: 'blindtest',
    prompt: BLINDTEST_PROMPT,
    options: BLINDTEST_OPTIONS,
    correctAnswers: ["Barcarolle (Opera : Les contes d'Hoffmann)"],
    explanation:
      "La Barcarolle « Belle nuit, ô nuit d'amour » est un duo de sopranos.",
    audioUrl: audio('18 Blind Barcarolle.mp3'),
  },
  {
    number: 36,
    kind: 'blindtest',
    prompt: BLINDTEST_PROMPT,
    options: BLINDTEST_OPTIONS,
    correctAnswers: ['Habanera (Opera : Carmen)'],
    explanation:
      "L'Habanera « L'amour est un oiseau rebelle » est chantée par Carmen, mezzo-soprano.",
    audioUrl: audio('19 Blind Carmen Habanera.mp3'),
  },
  {
    number: 37,
    kind: 'blindtest',
    prompt: BLINDTEST_PROMPT,
    options: BLINDTEST_OPTIONS,
    correctAnswers: ['Libiamo ne lieti calici (Opera : La traviata)'],
    explanation:
      "« Libiamo ne' lieti calici » est le brindisi (chant à boire) de La traviata.",
    audioUrl: audio('20 Blind La traviata libiamo.mp3'),
  },
  {
    number: 38,
    kind: 'blindtest',
    prompt: BLINDTEST_PROMPT,
    options: BLINDTEST_OPTIONS,
    correctAnswers: ['La donna è mobile (Opera : Rigoletto)'],
    explanation:
      "« La donna è mobile » est l'air du Duc de Mantoue, au début du dernier acte.",
    audioUrl: audio('21 Blind rigoletto la donna.mp3'),
  },
  {
    number: 39,
    kind: 'blindtest',
    prompt: BLINDTEST_PROMPT,
    options: BLINDTEST_OPTIONS,
    correctAnswers: ['Nessun Dorma (Opera : Turandot)'],
    explanation:
      "« Nessun dorma » est l'air de Calaf, au troisième acte de Turandot.",
    audioUrl: audio('22 Blind nessun dorma turandot.mp3'),
  },
  // --- 40 à 45 : blindtest « aria et blind » -------------------------------
  {
    number: 40,
    kind: 'blindtest',
    prompt: BLINDTEST_PROMPT,
    options: ARIA_BLIND_OPTIONS,
    correctAnswers: ['Voi che sapete (Les Noces de Figaro - Mozart)'],
    explanation:
      "« Voi che sapete » est l'air de Chérubin, page de la comtesse, dans Les Noces de Figaro.",
    audioUrl: audio('11 Aria et blind voi che sapete.mp3'),
    clipTitle: 'Voi che sapete — Les Noces de Figaro (Mozart)',
  },
  {
    number: 41,
    kind: 'blindtest',
    prompt: BLINDTEST_PROMPT,
    options: ARIA_BLIND_OPTIONS,
    correctAnswers: ['Air de la folie (Lucia di Lammermoor - Donizetti)'],
    explanation:
      "L'air de la folie (« Il dolce suono ») clôt le deuxième acte de Lucia di Lammermoor : vocalises et notes très aiguës.",
    audioUrl: audio('12 Aria et blind lucia di lamermoor air de la folie.mp3'),
    clipTitle: 'Air de la folie — Lucia di Lammermoor (Donizetti)',
  },
  {
    number: 42,
    kind: 'blindtest',
    prompt: BLINDTEST_PROMPT,
    options: ARIA_BLIND_OPTIONS,
    correctAnswers: ["Libiamo ne' lieti calici (La Traviata - Verdi)"],
    explanation:
      "« Libiamo ne' lieti calici » est le brindisi (chant à boire) qui ouvre La Traviata.",
    audioUrl: audio('13 Aria et blind libiamo ne lieti calici.mp3'),
    clipTitle: "Libiamo ne' lieti calici — La Traviata (Verdi)",
  },
  {
    number: 43,
    kind: 'blindtest',
    prompt: BLINDTEST_PROMPT,
    options: ARIA_BLIND_OPTIONS,
    correctAnswers: ['Duo des fleurs (Lakmé - Delibes)'],
    explanation:
      "Le Duo des fleurs (« Sous le dôme épais ») réunit Lakmé et Mallika au premier acte.",
    audioUrl: audio('14 Aria et blind duo des fleurs.mp3'),
    clipTitle: 'Duo des fleurs — Lakmé (Delibes)',
  },
  {
    number: 44,
    kind: 'blindtest',
    prompt: BLINDTEST_PROMPT,
    options: ARIA_BLIND_OPTIONS,
    correctAnswers: ['La donna è mobile (Rigoletto - Verdi)'],
    explanation:
      "« La donna è mobile » est l'air du Duc de Mantoue, au début du dernier acte de Rigoletto.",
    audioUrl: audio('15 Aria et blind la donna e mobile.mp3'),
    clipTitle: 'La donna è mobile — Rigoletto (Verdi)',
  },
  {
    number: 45,
    kind: 'blindtest',
    prompt: BLINDTEST_PROMPT,
    options: LA_BOHEME_OPTIONS,
    correctAnswers: ["Quando me'n vo' (La Bohème - Puccini)"],
    explanation:
      "« Quando me'n vo' », souvent appelé la valse de Musette, est l'air que Musetta chante au deuxième acte de La Bohème.",
    audioUrl: audio('10 Aria et blind puccini la boheme quando soletto.mp3'),
    clipTitle: "Quando me'n vo' — La Bohème (Puccini)",
  },
];

/** Nombre de questions tirées pour chaque partie. */
export const OPERA_QUIZ_LENGTH = 10;

/**
 * Tire `count` questions au hasard dans la banque (mélange de Fisher-Yates).
 * Un même extrait audio n'est jamais proposé deux fois dans la même partie,
 * même s'il sert à deux questions différentes (air/récitatif et blindtest).
 * `random` permet de rendre le tirage déterministe dans les tests.
 */
export function drawOperaQuestions(
  count = OPERA_QUIZ_LENGTH,
  random: () => number = Math.random,
): OperaQuestion[] {
  const pool = [...operaQuestions];

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const current = pool[i];
    const other = pool[j];
    if (current === undefined || other === undefined) continue;
    pool[i] = other;
    pool[j] = current;
  }

  const picked: OperaQuestion[] = [];
  const usedAudio = new Set<string>();

  for (const question of pool) {
    if (picked.length >= count) break;
    if (question.audioUrl && usedAudio.has(question.audioUrl)) continue;
    picked.push(question);
    if (question.audioUrl) usedAudio.add(question.audioUrl);
  }

  // Filet de sécurité : si le filtre audio empêchait d'atteindre `count`.
  if (picked.length < count) {
    for (const question of pool) {
      if (picked.length >= count) break;
      if (picked.includes(question)) continue;
      picked.push(question);
    }
  }

  return picked;
}
