/**
 * Source unique des outils d'entraînement : hub, pages (ToolPage) et tests.
 */
export interface ToolInfo {
  slug: string;
  title: string;
  icon: string;
  description: string;
  /** Chemin sans base : à passer à relativeUrl(). */
  path: string;
}

const RAW = [
  { slug: 'lecture-notes', title: 'Lecture de Notes', icon: '🎼', description: 'Lis des notes sur la portée, en clé de sol et en clé de fa.' },
  { slug: 'lecture-rythmique', title: 'Lecture Rythmique', icon: '🥁', description: 'Reproduis des rythmes en tapant en mesure avec le métronome.' },
  { slug: 'piano-interactif', title: 'Piano Interactif', icon: '🎹', description: 'Joue sur un clavier de 88 touches et vois la note sur la portée.' },
  { slug: 'dessiner-clefs', title: 'Dessiner les Clefs', icon: '✒️', description: 'Apprends à tracer la clef de sol et la clef de fa, étape par étape.' },
  { slug: 'clavier-notes', title: 'Identification Clavier', icon: '🔴', description: 'Retrouve le nom de la note indiquée sur le clavier du piano.' },
  { slug: 'oreille-nom', title: 'Oreille — Noms', icon: '👂', description: 'Écoute une note et retrouve son nom.' },
  { slug: 'oreille-clavier', title: 'Oreille — Clavier', icon: '🔔', description: 'Écoute une note et retrouve sa touche sur le clavier.' },
] as const;

export type ToolSlug = (typeof RAW)[number]['slug'];

export const tools: ToolInfo[] = RAW.map((tool) => ({ ...tool, path: '/entrainement/' + tool.slug }));

export function getTool(slug: ToolSlug): ToolInfo {
  const tool = tools.find((item) => item.slug === slug);
  if (!tool) throw new Error('Outil inconnu : ' + slug);
  return tool;
}
