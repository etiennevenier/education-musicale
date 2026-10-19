/**
 * Données du mini-quiz « Musique et Jazz ».
 *
 * Chaque question et chaque explication sont directement issues de la fiche
 * de cours affichée dans l'onglet « L'Histoire & le Style ».
 */

export interface JazzQuizQuestion {
  id: string;
  question: string;
  options: readonly string[];
  correctAnswer: string;
  explanation: string;
}

/** Nombre de questions d'une partie : le quiz est noté sur 10. */
export const JAZZ_QUESTIONS_PER_GAME = 10;

export const jazzQuizQuestions: JazzQuizQuestion[] = [
  {
    id: 'sextet',
    question: 'Combien de musiciens compte-t-on dans un sextet ?',
    options: ['3', '4', '5', '6', '7'],
    correctAnswer: '6',
    explanation: 'Un sextet réunit six musiciens.',
  },
  {
    id: 'trio',
    question: 'Quelle formation réunit trois musiciens ?',
    options: ['Le trio', 'Le quartet', 'Le quintet', 'Le septet'],
    correctAnswer: 'Le trio',
    explanation:
      'Le trio compte 3 musiciens, le quartet 4, le quintet 5 et le septet 7.',
  },
  {
    id: 'naissance',
    question: 'Où et quand est né le jazz ?',
    options: [
      'À La Nouvelle-Orléans, au début des années 1900',
      'À Chicago, entre 1930 et 1940',
      'À New York, entre 1950 et 1960',
      'À Paris, dans les années 1920',
    ],
    correctAnswer: 'À La Nouvelle-Orléans, au début des années 1900',
    explanation:
      'Le jazz, et plus particulièrement le Jazz New Orleans, naît au début des années 1900 à La Nouvelle-Orléans, où il se développe entre 1910 et 1920.',
  },
  {
    id: 'caracteristiques',
    question: 'Quelles sont les deux caractéristiques principales du jazz ?',
    options: [
      "L'improvisation et le swing",
      "L'improvisation et le scat",
      "Le swing et le chorus",
      "L'improvisation et le combo",
    ],
    correctAnswer: "L'improvisation et le swing",
    explanation: "Le jazz repose avant tout sur l'improvisation et le swing.",
  },
  {
    id: 'section-melodique',
    question: 'Quel est le rôle de la section mélodique ?',
    options: [
      'Jouer le thème et la plupart des chorus',
      'Tenir la pulsation et le tempo',
      'Improviser uniquement des solos',
      'Accompagner sans jamais jouer le thème',
    ],
    correctAnswer: 'Jouer le thème et la plupart des chorus',
    explanation: 'La section mélodique joue le thème et la plupart des chorus.',
  },
  {
    id: 'section-rythmique',
    question: 'Quels instruments composent la section rythmique ?',
    options: [
      'Piano, contrebasse et batterie',
      'Trompette, saxophone et clarinette',
      'Trombone, banjo et piano',
      'Batterie, guitare et trompette',
    ],
    correctAnswer: 'Piano, contrebasse et batterie',
    explanation:
      'La section rythmique réunit le piano, la contrebasse et la batterie.',
  },
  {
    id: 'chorus',
    question: "Qu'appelle-t-on un chorus en jazz ?",
    options: [
      'Un solo improvisé',
      'Un refrain chanté par tous',
      'Un roulement de batterie',
      'Une pause entre deux thèmes',
    ],
    correctAnswer: 'Un solo improvisé',
    explanation:
      'Le chorus est un solo improvisé, joué sur la grille du morceau.',
  },
  {
    id: 'scat',
    question: "Qu'est-ce que le scat ?",
    options: [
      'Une improvisation vocale sur des onomatopées',
      'Un solo de trompette bouchée',
      'Un chant religieux collectif',
      'Une danse née à La Nouvelle-Orléans',
    ],
    correctAnswer: 'Une improvisation vocale sur des onomatopées',
    explanation:
      'Le scat est une improvisation vocale chantée sur des syllabes et des onomatopées sans sens.',
  },
  {
    id: 'armstrong',
    question:
      "Qui est considéré comme l'inventeur du scat en 1926 sur « Heebie Jeebies » ?",
    options: ['Louis Armstrong', 'Duke Ellington', 'Charlie Parker', 'Ella Fitzgerald'],
    correctAnswer: 'Louis Armstrong',
    explanation:
      "Louis Armstrong est considéré comme l'inventeur du scat, enregistré en 1926 sur « Heebie Jeebies ».",
  },
  {
    id: 'improvisation',
    question:
      'Pour improviser, quel paramètre le musicien doit-il impérativement respecter en plus du tempo ?',
    options: [
      'La tonalité (la gamme)',
      'La nuance',
      "Le nombre d'instruments",
      "La vitesse du chef d'orchestre",
    ],
    correctAnswer: 'La tonalité (la gamme)',
    explanation:
      'Pour improviser, le musicien respecte le tempo et la tonalité, c’est-à-dire la gamme du morceau.',
  },
];
