export type GifId = 'triste' | 'joyeux' | 'neutre';
export type MusicId = 'triste' | 'joyeuse' | 'drole';
export type AnalysisId = 'empathique' | 'anempathique' | 'narrative';

export interface LaboGif {
  id: GifId;
  /** Texte alternatif neutre : ne doit pas révéler l'émotion du visuel. */
  alt: string;
  file: string;
  /** 'video' : mp4 muet en boucle (plus léger qu'un GIF). */
  kind: 'image' | 'video';
}

export interface LaboMusic {
  id: MusicId;
  file: string;
}

export interface LaboAnalysis {
  id: AnalysisId;
  label: string;
  desc: string;
  icon: string;
}

export const gifs: LaboGif[] = [
  {
    id: 'triste',
    alt: 'Visuel 1',
    file: 'giftriste.mp4',
    kind: 'video',
  },
  {
    id: 'joyeux',
    alt: 'Visuel 2',
    file: 'gifjoyeux.mp4',
    kind: 'video',
  },
  {
    id: 'neutre',
    alt: 'Visuel 3',
    file: 'gifneutre.mp4',
    kind: 'video',
  },
];

export const musics: LaboMusic[] = [
  { id: 'triste', file: 'musiquetriste.mp3' },
  { id: 'joyeuse', file: 'musiquejoyeuse.mp3' },
  { id: 'drole', file: 'musiquedrole.mp3' },
];

export const analyses: LaboAnalysis[] = [
  {
    id: 'empathique',
    label: 'Musique empathique',
    desc: "La musique renforce l'émotion de la scène.",
    icon: '💙',
  },
  {
    id: 'anempathique',
    label: 'Musique anempathique',
    desc: "La musique contraste avec l'émotion du visuel.",
    icon: '⚡',
  },
  {
    id: 'narrative',
    label: 'Musique narrative',
    desc: "La musique sert à donner le ton et l'émotion d'une scène, y compris une scène neutre à la base.",
    icon: '🏞️',
  },
];

export const analysisNames: Record<AnalysisId, string> = {
  empathique: 'Musique empathique',
  anempathique: 'Musique anempathique',
  narrative: 'Musique narrative',
};

export const explanations: Record<AnalysisId, string> = {
  empathique:
    "La musique et l'image expriment la même émotion : la musique renforce ce que l'on ressent devant la scène.",
  anempathique:
    "La musique contredit l'émotion du visuel : ce contraste crée une distance, un décalage ou un effet comique.",
  narrative:
    "La musique donne le ton et l'émotion de la scène, même quand rien dans le visuel ne l'indique. Elle raconte l'ambiance, le lieu ou l'action.",
};

export const asGifId = (value: string | undefined): GifId | null =>
  value === 'triste' || value === 'joyeux' || value === 'neutre' ? value : null;

export const asMusicId = (value: string | undefined): MusicId | null =>
  value === 'triste' || value === 'joyeuse' || value === 'drole' ? value : null;

export const asAnalysisId = (value: string | undefined): AnalysisId | null =>
  value === 'empathique' || value === 'anempathique' || value === 'narrative' ? value : null;

export const pairNotes: Record<string, string> = {
  'triste|triste':
    "Ici, la musique et le visuel vont dans le même sens : l'émotion de la scène est renforcée.",
  'joyeux|joyeuse':
    "Ici, la musique et le visuel se renforcent : l'énergie de la scène est décuplée.",
  'joyeux|drole':
    "Ici, la musique et le visuel partagent le même registre comique : le comique est renforcé.",
  'triste|joyeuse':
    'Ici, la musique joyeuse sur ce visuel crée un net contraste : le spectateur ressent un décalage.',
  'triste|drole':
    'Ici, la musique drôle sur ce visuel produit un effet de contraste, parfois grinçant.',
  'joyeux|triste':
    'Ici, la musique triste sur ce visuel crée un contraste inattendu.',
  'neutre|triste':
    "Ici, rien dans le visuel n'impose une émotion : la musique triste donne à elle seule le ton de la scène.",
  'neutre|joyeuse':
    "Ici, rien dans le visuel n'impose une émotion : la musique joyeuse donne à elle seule le ton de la scène.",
  'neutre|drole':
    "Ici, rien dans le visuel n'impose une émotion : la musique drôle donne à elle seule le ton de la scène.",
};

/**
 * Fonction de la musique attendue pour une association donnée.
 * - GIF neutre : narrative, quelle que soit la musique ;
 * - GIF triste + musique triste, ou GIF joyeux + musique joyeuse/drôle : empathique ;
 * - toutes les autres combinaisons : anempathique (contraste).
 */
export const getCorrectAnalysis = (gif: GifId, music: MusicId): AnalysisId => {
  if (gif === 'neutre') return 'narrative';
  if (gif === 'triste') return music === 'triste' ? 'empathique' : 'anempathique';
  return music === 'triste' ? 'anempathique' : 'empathique';
};
