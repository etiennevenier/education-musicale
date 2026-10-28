import type { RockStyle } from '../data/rockStageData';
import { plural } from './plural';

export interface Evaluation {
  style: RockStyle;
  score: number;
  matched: number;
  missing: number;
  extras: number;
}

export interface HeatLevel {
  min: number;
  heat: 'cold' | 'warm' | 'hot' | 'fire' | 'perfect';
  headline: string;
}

/** En dessous de ce nombre d'éléments, l'évaluation reste neutre. */
export const MIN_ITEMS_FOR_GAUGE = 3;

export const HEAT_LEVELS: readonly HeatLevel[] = [
  { min: 100, heat: 'perfect', headline: 'Match parfait !' },
  { min: 90, heat: 'fire', headline: 'Brûlant !' },
  { min: 60, heat: 'hot', headline: 'Ça chauffe sérieusement !' },
  { min: 1, heat: 'warm', headline: 'Tu chauffes !' },
  { min: 0, heat: 'cold', headline: 'Tu chauffes !' },
];

const COLD_LEVEL: HeatLevel = { min: 0, heat: 'cold', headline: 'Tu chauffes !' };

export const getHeat = (score: number): HeatLevel =>
  HEAT_LEVELS.find((entry) => score >= entry.min) ?? COLD_LEVEL;

export const evaluate = (style: RockStyle, selection: ReadonlySet<string>): Evaluation => {
  const required = new Set(style.requirements);
  let matched = 0;

  selection.forEach((id) => {
    if (required.has(id)) matched += 1;
  });

  const extras = selection.size - matched;

  return {
    style,
    score: matched === 0 ? 0 : Math.round((matched / (required.size + extras)) * 100),
    matched,
    missing: required.size - matched,
    extras,
  };
};

export const evaluateAll = (
  styles: readonly RockStyle[],
  selection: ReadonlySet<string>,
): { best: Evaluation; tied: Evaluation[] } | null => {
  const evaluations = styles.map((style) => evaluate(style, selection));
  if (evaluations.length === 0) return null;

  const topScore = evaluations.reduce((max, entry) => Math.max(max, entry.score), 0);
  const contenders = evaluations
    .filter((entry) => entry.score === topScore)
    .sort((a, b) => a.missing - b.missing || a.extras - b.extras);
  const best = contenders[0];
  if (!best) return null;

  return {
    best,
    tied: contenders.filter((entry) => entry.missing === best.missing && entry.extras === best.extras),
  };
};

export const getTargetNames = (best: Evaluation, tied: Evaluation[]): string =>
  tied.length > 1
    ? `${tied
        .slice(0, 2)
        .map((entry) => entry.style.name)
        .join(' ou ')}${tied.length > 2 ? ` (+${tied.length - 2} autres pistes)` : ''}`
    : best.style.name;

export const getGaugeDetail = (best: Evaluation): string => {
  if (best.score === 100) return 'Tous les ingrédients sont réunis, sans élément en trop.';
  const extrasLabel = best.extras > 0 ? `${plural(best.extras, 'élément')} en trop` : 'sans intrus';
  return `${best.matched} / ${best.style.requirements.length} ingrédients · ${extrasLabel}`;
};

export const getIntruderRemark = (extras: number): string | null => {
  if (extras === 0) return null;
  if (extras === 1) {
    return 'Il y a un passager clandestin dans ton groupe… L\'un de ces éléments n\'a rien à faire là ! 🕵️';
  }
  if (extras === 2) {
    return 'Oula ! Au moins deux éléments gâchent la synergie de ton groupe. 🥊';
  }

  return "C'est un joyeux bazar ! Plusieurs éléments n'ont absolument rien à faire ensemble. 💥";
};
