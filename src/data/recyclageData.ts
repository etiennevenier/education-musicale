/**
 * Données du module « Le Nuancier du Recyclage Musical »
 * (séquence « Musique et Recyclage »).
 *
 * Chaque scénario décrit une pratique de recyclage musical et les quatre
 * critères juridiques qui permettent de déterminer si elle est autorisée.
 */

import { shuffle } from '../utils/random';

export interface Scenario {
  id: string;
  texte: string; // Situation factuelle, sans mots-clés évidents
  technique: 'reprise' | 'sample' | 'remix';
  oeuvreLibre: boolean; // Auteur mort depuis plus de 70 ans
  enregistrementLibre: boolean; // Nouvel enregistrement (rejoué) ou droits voisins éteints
  exception: 'parodie' | 'citation' | null;
  accord: boolean; // Accord des ayants droit (auteur, producteur, interprète)
  explication: string; // Rétroaction pédagogique détaillée
}

export const estLegal = (s: Scenario): boolean =>
  s.exception !== null || (s.oeuvreLibre && s.enregistrementLibre) || s.accord;

export const TECHNIQUE_LABELS: Record<Scenario['technique'], string> = {
  reprise: 'Reprise (cover)',
  sample: 'Sample / Citation',
  remix: 'Remix / Adaptation',
};

export const SCENARIOS: Scenario[] = [
  // REPRISES (COVERS)
  {
    id: 'rep-1',
    texte:
      'Un groupe de pop réenregistre intégralement en studio une chanson de Clara Luciani en rejouant toutes les notes à la guitare et au chant, puis déclare la chanson à la SACEM.',
    technique: 'reprise',
    oeuvreLibre: false,
    enregistrementLibre: true,
    exception: null,
    accord: true,
    explication:
      "C'est une reprise légale. L'œuvre est rejouée (nouvel enregistrement) et la démarche administrative auprès de la SACEM est effectuée.",
  },
  {
    id: 'rep-2',
    texte:
      "Un pianiste réenregistre lui-même au piano La Lettre à Élise de Beethoven (mort en 1827) pour la publier sur son album.",
    technique: 'reprise',
    oeuvreLibre: true,
    enregistrementLibre: true,
    exception: null,
    accord: false,
    explication:
      "Légal. Beethoven étant mort depuis plus de 70 ans, l'œuvre est dans le domaine public, et le pianiste utilise son propre enregistrement.",
  },
  {
    id: 'rep-3',
    texte:
      "Un groupe enregistre en studio un album entier de reprises d'un artiste vivant, le vend en CD lors de ses concerts mais refuse de déclarer les titres et de verser les droits.",
    technique: 'reprise',
    oeuvreLibre: false,
    enregistrementLibre: true,
    exception: null,
    accord: false,
    explication:
      "Illégal (contrefaçon). Même si le groupe a joué lui-même la musique, l'œuvre originale est protégée et la diffusion commerciale sans déclaration à la SACEM est interdite.",
  },
  {
    id: 'rep-4',
    texte:
      "Un guitariste réenregistre à la batterie et au synthétiseur la mélodie exacte d'un hit de l'été actuel et la publie sur les plateformes en prétendant l'avoir composée.",
    technique: 'reprise',
    oeuvreLibre: false,
    enregistrementLibre: true,
    exception: null,
    accord: false,
    explication:
      "Illégal (contrefaçon). Réenregistrer soi-même une mélodie protégée sans créditer l'auteur et sans autorisation est une atteinte au droit d'auteur.",
  },

  {
    id: 'rep-5',
    texte:
      "Un groupe de musique traditionnelle réenregistre et interprète un chant populaire occitan du XVIe siècle dont l'auteur est inconnu et la musique transmise oralement.",
    technique: 'reprise',
    oeuvreLibre: true,
    enregistrementLibre: true,
    exception: null,
    accord: false,
    explication:
      "Légal. L'œuvre appartient au patrimoine traditionnel et au domaine public, et le groupe utilise son propre enregistrement.",
  },
  {
    id: 'rep-6',
    texte:
      "Un chanteur enregistre la traduction française exacte d'une ballade américaine récente, la publie sur YouTube et en tire des revenus publicitaires sans demander d'autorisation à l'auteur original.",
    technique: 'reprise',
    oeuvreLibre: false,
    enregistrementLibre: true,
    exception: null,
    accord: false,
    explication:
      "Illégal (contrefaçon). Traduire et adapter les paroles d'une œuvre protégée nécessite l'accord explicite de l'auteur d'origine.",
  },
  {
    id: 'rep-7',
    texte:
      "Une chorale de collège enregistre sa version d'un titre pop contemporain après que l'établissement a réglé le forfait d'autorisation de reproduction auprès de la SDRM/SACEM.",
    technique: 'reprise',
    oeuvreLibre: false,
    enregistrementLibre: true,
    exception: null,
    accord: true,
    explication:
      "Légal. L'œuvre est réenregistrée et les droits de reproduction mécanique ont été correctement réglés.",
  },

  // SAMPLES / CITATIONS
  {
    id: 'sam-1',
    texte:
      "Un producteur de hip-hop isole 2 secondes de batterie à partir du CD d'un morceau funk de 1975, signe un contrat d'autorisation (cleared sample) avec le label et l'utilise en boucle.",
    technique: 'sample',
    oeuvreLibre: false,
    enregistrementLibre: false,
    exception: null,
    accord: true,
    explication:
      "Légal. L'extrait sonore brut est protégé par les droits voisins, mais le producteur a obtenu l'autorisation officielle du label et des ayants droit.",
  },
  {
    id: 'sam-2',
    texte:
      "Un beatmaker découpe 3 secondes du solo de flûte d'un album récent de jazz, l'intègre brut sous un beat trap et le commercialise sans rien demander à l'artiste.",
    technique: 'sample',
    oeuvreLibre: false,
    enregistrementLibre: false,
    exception: null,
    accord: false,
    explication:
      "Illégal (contrefaçon). Prélever un extrait d'un enregistrement sonore protégé sans accord du producteur et de l'auteur est une atteinte aux droits d'auteur et droits voisins.",
  },
  {
    id: 'sam-3',
    texte:
      "Un artiste d'électro découpe 4 secondes d'un enregistrement symphonique de Vivaldi réalisé par un orchestre en 2015 pour en faire la boucle de son morceau.",
    technique: 'sample',
    oeuvreLibre: true,
    enregistrementLibre: false,
    exception: null,
    accord: false,
    explication:
      "Illégal (contrefaçon). L'œuvre de Vivaldi est dans le domaine public, MAIS l'enregistrement de 2015 est récent et protégé par les droits voisins du producteur et des musiciens.",
  },
  {
    id: 'sam-4',
    texte:
      "Un compositeur intègre un très court extrait sonore d'un chant traditionnel du XIXe siècle dont l'enregistrement original est tombé dans le domaine public.",
    technique: 'sample',
    oeuvreLibre: true,
    enregistrementLibre: true,
    exception: null,
    accord: false,
    explication:
      "Légal. L'œuvre comme l'enregistrement sont tous deux tombés dans le domaine public.",
  },
  {
    id: 'sam-5',
    texte:
      "Un humoriste crée une courte vidéo satirique dans laquelle il intègre 3 secondes d'une chanson connue pour appuyer sa caricature, en évitant toute confusion.",
    technique: 'sample',
    oeuvreLibre: false,
    enregistrementLibre: false,
    exception: 'citation',
    accord: false,
    explication:
      "Légal sous l'exception de courte citation ou de revue, sous réserve que la citation soit courte, justifiée et crédite l'auteur.",
  },

  {
    id: 'sam-6',
    texte:
      "Un beatmaker extrait une boucle de 2 secondes du riff de guitare d'une chanson afrobeat des années 80, l'utilise comme colonne vertébrale de son morceau et refuse de créditer le producteur d'origine.",
    technique: 'sample',
    oeuvreLibre: false,
    enregistrementLibre: false,
    exception: null,
    accord: false,
    explication:
      "Illégal (contrefaçon). Réutiliser un extrait sonore brut d'un enregistrement protégé sans accord est une atteinte aux droits voisins.",
  },
  {
    id: 'sam-7',
    texte:
      "Un producteur de musique électronique utilise un bref échantillon sonore tiré d'un disque 78 tours enregistré en 1920 dont les droits d'auteur et les droits voisins sont tous expirés.",
    technique: 'sample',
    oeuvreLibre: true,
    enregistrementLibre: true,
    exception: null,
    accord: false,
    explication:
      "Légal. L'œuvre et l'enregistrement sonore d'origine sont tous deux tombés dans le domaine public.",
  },
  {
    id: 'sam-8',
    texte:
      "Un artiste de hip-hop prépare un morceau en découpant 3 secondes du thème de La Flûte Enchantée de Mozart à partir d'un album CD enregistré par l'Orchestre Philharmonique en 2022.",
    technique: 'sample',
    oeuvreLibre: true,
    enregistrementLibre: false,
    exception: null,
    accord: false,
    explication:
      "Illégal (contrefaçon). Si l'œuvre de Mozart est dans le domaine public, l'enregistrement de 2022 est récent et protégé par les droits voisins de l'orchestre et du label.",
  },

  // REMIXES / ADAPTATIONS
  {
    id: 'rem-1',
    texte:
      "Un DJ reçoit les pistes séparées d'une chanson pop de la part du label officiel et retravaille le tempo, la structure et la basse pour une version club commerciale.",
    technique: 'remix',
    oeuvreLibre: false,
    enregistrementLibre: false,
    exception: null,
    accord: true,
    explication:
      "Légal. Le remix est réalisé avec l'accord explicite et l'accès aux pistes fournies par les ayants droit.",
  },
  {
    id: 'rem-2',
    texte:
      "Un créateur modifie le tempo à +20 % d'une chanson protégée (Sped Up) et la publie sur Spotify pour percevoir des revenus sans accord de la maison de disques.",
    technique: 'remix',
    oeuvreLibre: false,
    enregistrementLibre: false,
    exception: null,
    accord: false,
    explication:
      "Illégal (contrefaçon). Modifier la vitesse d'un enregistrement original et le distribuer sans contrat constitue une atteinte à l'intégrité de l'œuvre et aux droits voisins.",
  },
  {
    id: 'rem-3',
    texte:
      "Un humoriste réécrit entièrement les paroles d'un tube de l'été pour faire une caricature comique à la radio, sans dénigrer l'artiste et sans créer de confusion.",
    technique: 'remix',
    oeuvreLibre: false,
    enregistrementLibre: true,
    exception: 'parodie',
    accord: false,
    explication:
      "Légal grâce à l'exception de parodie prévue par la loi française (respect des lois du genre : but humoristique, absence de dénigrement et pas de risque de confusion).",
  },
  {
    id: 'rem-4',
    texte:
      "Un musicien retravaille L'Été de Vivaldi en gardant les notes mais en y ajoutant des synthétiseurs modernes et de gros beats électroniques réenregistrés par ses soins.",
    technique: 'remix',
    oeuvreLibre: true,
    enregistrementLibre: true,
    exception: null,
    accord: false,
    explication:
      "Légal. L'œuvre de Vivaldi est dans le domaine public et le musicien n'a utilisé aucun enregistrement sonore préexistant.",
  },
  {
    id: 'rem-5',
    texte:
      "Une entreprise prend la chanson originale d'un groupe indépendant, la réorganise et l'utilise comme bande-son pour sa publicité télévisée sans signer de contrat.",
    technique: 'remix',
    oeuvreLibre: false,
    enregistrementLibre: false,
    exception: null,
    accord: false,
    explication:
      'Illégal (contrefaçon). Exploiter et modifier un morceau commercial à des fins publicitaires sans licence est une contrefaçon lourde.',
  },
  {
    id: 'rem-6',
    texte:
      "Un vidéaste réécrit les paroles d'une chanson célèbre pour critiquer avec humour les habitudes alimentaires modernes dans une vidéo satirique, sans dénigrer l'artiste d'origine.",
    technique: 'remix',
    oeuvreLibre: false,
    enregistrementLibre: true,
    exception: 'parodie',
    accord: false,
    explication:
      "Légal. Cette modification entre dans le cadre de l'exception de parodie prévue par la loi (but humoristique, absence de confusion).",
  },
  {
    id: 'rem-7',
    texte:
      "Un DJ prend le fichier audio d'une chanson engagée contre la guerre, la transforme en hymne techno accéléré et l'utilise pour la publicité d'une marque sans accord.",
    technique: 'remix',
    oeuvreLibre: false,
    enregistrementLibre: false,
    exception: null,
    accord: false,
    explication:
      "Illégal (contrefaçon). Modifier et exploiter un enregistrement original à des fins commerciales sans autorisation est strictement interdit.",
  },
  {
    id: 'rem-8',
    texte:
      "Un artiste réalise un mashup officiel en superposant la voix d'un chanteur R&B et l'instrumentale d'un groupe de rock après signature d'un contrat de licence entre les deux labels.",
    technique: 'remix',
    oeuvreLibre: false,
    enregistrementLibre: false,
    exception: null,
    accord: true,
    explication:
      "Légal. Le mélange des pistes audio originales est encadré par un contrat d'accord entre les ayants droit.",
  },
  {
    id: 'rem-9',
    texte:
      "Un compositeur réorganise intégralement la structure de la Symphonie du Nouveau Monde de Dvořák (mort en 1904) en la réenregistrant lui-même avec des percussions électroniques.",
    technique: 'remix',
    oeuvreLibre: true,
    enregistrementLibre: true,
    exception: null,
    accord: false,
    explication:
      "Légal. L'œuvre de Dvořák est dans le domaine public et le compositeur a entièrement créé son propre enregistrement.",
  },
];

/**
 * Tire un deck équilibré pour une session :
 * au moins 2 cas illégaux, 1 œuvre du domaine public, 1 exception légale
 * et au moins une carte de chaque technique.
 */
export const getBalancedDeck = (
  scenarios: Scenario[] = SCENARIOS,
  count = 8,
): Scenario[] => {
  const shuffled = shuffle(scenarios);
  const selected: Scenario[] = [];

  const add = (scenario: Scenario | undefined) => {
    if (!scenario || selected.some((entry) => entry.id === scenario.id)) return;
    selected.push(scenario);
  };

  shuffled
    .filter((scenario) => !estLegal(scenario))
    .slice(0, 2)
    .forEach(add);

  add(shuffled.find((scenario) => scenario.oeuvreLibre));
  add(shuffled.find((scenario) => scenario.exception !== null));

  (['reprise', 'sample', 'remix'] as const).forEach((technique) => {
    if (!selected.some((scenario) => scenario.technique === technique)) {
      add(shuffled.find((scenario) => scenario.technique === technique));
    }
  });

  for (const scenario of shuffled) {
    if (selected.length >= count) break;
    add(scenario);
  }

  return shuffle(selected).slice(0, count);
};
