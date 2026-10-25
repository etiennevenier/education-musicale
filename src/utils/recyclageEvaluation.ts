import { estLegal, TECHNIQUE_LABELS, type Scenario } from '../data/recyclageData';

export const CARDS_PER_GAME = 8;

export const CRITERION_IDS = [
  'oeuvreLibre',
  'enregistrementLibre',
  'exception',
  'accord',
] as const;

export type CriterionId = (typeof CRITERION_IDS)[number];
export type TechniqueId = Scenario['technique'];
export type Criteria = Record<CriterionId, boolean>;

export interface Answer {
  technique: TechniqueId | null;
  criteria: Criteria;
  validated: boolean;
  success: boolean;
}

export interface Validation {
  techniqueOk: boolean;
  verdictOk: boolean;
  criteriaOk: boolean;
  success: boolean;
  actualLegal: boolean;
  studentLegal: boolean;
}

const TECHNIQUE_IDS = Object.keys(TECHNIQUE_LABELS) as TechniqueId[];

export const isCriterionId = (value: string | undefined): value is CriterionId =>
  value !== undefined && (CRITERION_IDS as readonly string[]).includes(value);

export const isTechniqueId = (value: string | undefined): value is TechniqueId =>
  value !== undefined && (TECHNIQUE_IDS as string[]).includes(value);

const labelFor = (technique: TechniqueId): string => TECHNIQUE_LABELS[technique];

export const createAnswer = (): Answer => ({
  technique: null,
  criteria: { oeuvreLibre: false, enregistrementLibre: false, exception: false, accord: false },
  validated: false,
  success: false,
});

export const getStudentVerdict = (criteria: Criteria): boolean =>
  criteria.exception || (criteria.oeuvreLibre && criteria.enregistrementLibre) || criteria.accord;

export const getExpectedCriteria = (scenario: Scenario): Criteria => ({
  oeuvreLibre: scenario.oeuvreLibre,
  enregistrementLibre: scenario.enregistrementLibre,
  exception: scenario.exception !== null,
  accord: scenario.accord,
});

export const validateAnswer = (scenario: Scenario, answer: Answer): Validation => {
  const actualLegal = estLegal(scenario);
  const studentLegal = getStudentVerdict(answer.criteria);
  const expected = getExpectedCriteria(scenario);
  const techniqueOk = answer.technique === scenario.technique;
  const verdictOk = studentLegal === actualLegal;
  const criteriaOk = CRITERION_IDS.every((id) => answer.criteria[id] === expected[id]);
  return { techniqueOk, verdictOk, criteriaOk, success: techniqueOk && verdictOk, actualLegal, studentLegal };
};

export const getFeedbackTitle = (v: Validation): string => {
  if (v.success && v.criteriaOk) return 'Analyse complète : technique et raisonnement justes.';
  if (v.success) return 'Bon verdict, mais certains critères sont mal identifiés.';
  if (!v.verdictOk) {
    return v.actualLegal
      ? "Cette situation était légale : tu l'as jugée interdite."
      : "Cette situation est illégale : tu l'as crue autorisée.";
  }
  return "Le verdict est bon, mais la technique n'est pas la bonne.";
};

export const buildNotes = (
  scenario: Scenario,
  answer: Answer,
  validation: Validation,
): string[] => {
  const notes: string[] = [];

  if (!validation.techniqueOk && answer.technique) {
    notes.push(
      `Technique : tu as choisi « ${labelFor(answer.technique)} », or la bonne réponse est « ${labelFor(scenario.technique)} ».`,
    );
  }

  if (!validation.verdictOk) {
    notes.push(
      validation.actualLegal
        ? 'Verdict : cette situation est légale, mais ton diagnostic la déclare interdite.'
        : 'Verdict : cette situation est illégale, mais ton diagnostic la déclare autorisée.',
    );

    if (!validation.actualLegal) {
      if (scenario.oeuvreLibre && !scenario.enregistrementLibre) {
        notes.push(
          "L'œuvre était dans le domaine public, MAIS l'enregistrement utilisé est récent : il reste protégé par les droits voisins.",
        );
      } else if (!scenario.oeuvreLibre && scenario.enregistrementLibre) {
        notes.push(
          "L'enregistrement est bien le tien, MAIS l'œuvre originale reste protégée : il faut l'accord des ayants droit (ou une déclaration à la SACEM).",
        );
      } else if (scenario.exception !== null) {
        notes.push(
          `Seule l'exception de ${scenario.exception} autorise cet usage, et elle ne s'applique pas à ta copie.`,
        );
      } else if (scenario.accord) {
        notes.push(
          'Les ayants droit avaient donné leur accord, mais pas pour cet usage commercial.',
        );
      }
    } else if (scenario.exception !== null) {
      notes.push(
        `L'exception de ${scenario.exception} rend ici l'usage légal, même sans accord des ayants droit.`,
      );
    } else if (scenario.accord) {
      notes.push('Les ayants droit avaient bien donné leur accord : ce recyclage est autorisé.');
    } else if (scenario.oeuvreLibre && scenario.enregistrementLibre) {
      notes.push(
        "L'œuvre et l'enregistrement utilisés sont tous deux libres : il n'y a rien à demander.",
      );
    }
  }

  if (answer.criteria.oeuvreLibre !== scenario.oeuvreLibre) {
    notes.push(
      scenario.oeuvreLibre
        ? "Critère « œuvre dans le domaine public » : c'est vrai, l'auteur est mort depuis plus de 70 ans."
        : "Critère « œuvre dans le domaine public » : c'est faux, l'œuvre est encore protégée.",
    );
  }

  if (answer.criteria.enregistrementLibre !== scenario.enregistrementLibre) {
    notes.push(
      scenario.enregistrementLibre
        ? "Critère « enregistrement libre » : c'est vrai (réenregistré ou droits voisins éteints)."
        : "Critère « enregistrement libre » : c'est faux, cet enregistrement est encore protégé.",
    );
  }

  if (answer.criteria.exception !== (scenario.exception !== null)) {
    notes.push(
      scenario.exception !== null
        ? `Critère « exception légale » : l'exception de ${scenario.exception} s'applique bien.`
        : "Critère « exception légale » : aucune parodie ni citation ne s'applique ici.",
    );
  }

  if (answer.criteria.accord !== scenario.accord) {
    notes.push(
      scenario.accord
        ? "Critère « accord des ayants droit » : un accord a bien été obtenu."
        : "Critère « accord des ayants droit » : aucun accord n'a été obtenu.",
    );
  }

  return notes;
};
