export interface PlansSonoresItem {
  id: string;
  audioUrl: string;
  type: 'theme-instrument' | 'plan-sonore'; // Type de question
  correctAnswer: string; // Soit le nom de l'instrument, soit le type de plan
}

export const plansSonoresList: PlansSonoresItem[] = [
  // Serie 1 : Qui fait le thème ? (1er instrument)
  { id: '33', audioUrl: '/plans-sonores/33-saxophone-piano-contrebasse-batterie.mp3', type: 'theme-instrument', correctAnswer: 'Saxophone' },
  { id: '32', audioUrl: '/plans-sonores/32-flute-a-bec-irish.mp3', type: 'theme-instrument', correctAnswer: 'Flûte à bec' },
  { id: '31', audioUrl: '/plans-sonores/31-clarinette-guitare-contrebasse-batterie.mp3', type: 'theme-instrument', correctAnswer: 'Clarinette' },
  { id: '30', audioUrl: '/plans-sonores/30-violon-guitare.mp3', type: 'theme-instrument', correctAnswer: 'Violon' },
  { id: '29', audioUrl: '/plans-sonores/29-clarinette-contrebasse-piano-cymbales.mp3', type: 'theme-instrument', correctAnswer: 'Clarinette' },
  { id: '26', audioUrl: '/plans-sonores/26-saxophone-accordeon-contrebasse.mp3', type: 'theme-instrument', correctAnswer: 'Saxophone' },
  { id: '23', audioUrl: '/plans-sonores/23-flute-traversiere-guitare-triangle.mp3', type: 'theme-instrument', correctAnswer: 'Flûte traversière' },
  { id: '20', audioUrl: '/plans-sonores/20-cor-guitare.mp3', type: 'theme-instrument', correctAnswer: 'Cor' },
  { id: '19', audioUrl: '/plans-sonores/19-trompette-clavecin.mp3', type: 'theme-instrument', correctAnswer: 'Trompette' },
  { id: '17', audioUrl: '/plans-sonores/17-violoncelle-harpe.mp3', type: 'theme-instrument', correctAnswer: 'Violoncelle' },

  // Serie 2 : Thème identifié
  { id: 'a-clarinette', audioUrl: '/plans-sonores/a-clarinette-theme.mp3', type: 'theme-instrument', correctAnswer: 'Clarinette' },
  { id: 'b-violon', audioUrl: '/plans-sonores/b-violon-theme.mp3', type: 'theme-instrument', correctAnswer: 'Violon' },
  { id: 'g-violoncelle', audioUrl: '/plans-sonores/g-violoncelle-th.mp3', type: 'theme-instrument', correctAnswer: 'Violoncelle' },

  // Serie 3 : Identification du plan sonore
  { id: 'a-acc', audioUrl: '/plans-sonores/a-accompagnement.mp3', type: 'plan-sonore', correctAnswer: 'Un accompagnement seul' },
  { id: 'b-th', audioUrl: '/plans-sonores/b-theme.mp3', type: 'plan-sonore', correctAnswer: 'Un thème seul' },
  { id: 'c-th-acc', audioUrl: '/plans-sonores/c-th-acc.mp3', type: 'plan-sonore', correctAnswer: 'Un thème et un accompagnement' },
  { id: 'd-acc', audioUrl: '/plans-sonores/d-accompagnement.mp3', type: 'plan-sonore', correctAnswer: 'Un accompagnement seul' },
  { id: 'e-th-acc', audioUrl: '/plans-sonores/e-th-acc.mp3', type: 'plan-sonore', correctAnswer: 'Un thème et un accompagnement' },
  { id: 'f-th', audioUrl: '/plans-sonores/f-theme.mp3', type: 'plan-sonore', correctAnswer: 'Un thème seul' },
];

// Liste des 36 instruments pour l'autocomplétion
export const allInstrumentsList = [
  'Accordéon', 'Alto', 'Basse électrique', 'Batterie', 'Bongo', 'Clarinette', 'Clavecin',
  'Contrebasse', 'Cor', 'Cymbales', 'Djembé', 'Flûte à bec', 'Flûte traversière', 'Guitare',
  'Guitare électrique', 'Glockenspiel', 'Gong', 'Harpe', 'Hautbois', 'Maracas', 'Orgues',
  'Piano', 'Saxophone', 'Trombone', 'Trompette', 'Tuba', 'Triangle', 'Timbale', 'Ukulélé',
  'Violon', 'Violoncelle', 'Xylophone'
];