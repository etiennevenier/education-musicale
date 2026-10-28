import { relativeUrl } from '../utils/navigation';

export type Cause =
  | 'paix_guerre'
  | 'antiracisme_droits_civiques'
  | 'ecologie'
  | 'libertes_censure'
  | 'justice_sociale'
  | 'egalite_discriminations'
  | 'memoire';

export type Posture =
  | 'colere'
  | 'tristesse_lassitude'
  | 'ironie_satire'
  | 'hommage'
  | 'espoir_rassemblement';

export interface EngagementSong {
  id: string;
  titre: string;
  artiste: string;
  annee: number;
  contexte: string;
  causePrincipale: Cause;
  causesAcceptees?: Cause[];
  posturePrincipale: Posture;
  posturesAcceptees?: Posture[];
  indicesMusicaux: string[];
  leurresMusicaux: string[];
  indicesTextuels: string[];
  leurresTextuels: string[];
  illustrationUrl?: string;
  explication: string;
  ambiguite?: string;
}

export const CAUSE_LABELS: Record<Cause, { label: string; icon: string }> = {
  paix_guerre: { label: 'Paix & Anti-guerre', icon: '☮️' },
  antiracisme_droits_civiques: { label: 'Antiracisme & Droits civiques', icon: '✊' },
  ecologie: { label: 'Écologie & Planète', icon: '🌿' },
  libertes_censure: { label: 'Liberté d’expression & Censure', icon: '🗽' },
  justice_sociale: { label: 'Justice sociale & Précarité', icon: '⚖️' },
  egalite_discriminations: { label: 'Égalité & Anti-discriminations', icon: '🚻' },
  memoire: { label: 'Mémoire & Histoire', icon: '🕯️' },
};

const SONGS_DATA: EngagementSong[] = [
  {
    id: 'renaud-hexagone',
    titre: 'Hexagone',
    artiste: 'Renaud',
    annee: 1975,
    contexte: 'France des années 70, critique satirique de la société et du conformisme.',
    causePrincipale: 'libertes_censure',
    causesAcceptees: ['justice_sociale'],
    posturePrincipale: 'ironie_satire',
    posturesAcceptees: ['colere'],
    indicesMusicaux: [
      'Débit de parole rapide style chanson à texte',
      'Accompagnement épuré à la guitare acoustique et harmonica',
      'Voix gouailleuse au ton faussement détaché'
    ],
    leurresMusicaux: [
      'Orchestration symphonique majestueuse',
      'Riff de guitare Hard-Rock hyper saturé'
    ],
    indicesTextuels: [
      '« La France est un pays bourgeois »',
      '« Ils se complaisent dans leur médiocrité »'
    ],
    leurresTextuels: [
      '« Tu bosses toute ta vie pour payer ton enterrement »',
      '« Imagine all the people livin’ life in peace »'
    ],
    illustrationUrl: '/engagement/renaudhexagone.jpg',
    explication: 'Renaud brosse un portrait au vitriol de la société française mois par mois, en maniant l’ironie pour dénoncer l’individualisme et l’indifférence.'
  },
  {
    id: 'brassens-reputation',
    titre: 'La Mauvaise Réputation',
    artiste: 'Georges Brassens',
    annee: 1952,
    contexte: 'France de l’après-guerre et pesanteur du regard social.',
    causePrincipale: 'libertes_censure',
    causesAcceptees: ['egalite_discriminations'],
    posturePrincipale: 'ironie_satire',
    posturesAcceptees: ['espoir_rassemblement'],
    indicesMusicaux: [
      'Rythmique sautillante à la guitare et contrebasse (pompe manouche)',
      'Mélodie claire et faussement naïve',
      'Diction poétique et voix posée'
    ],
    leurresMusicaux: [
      'Caisse claire militaire battant le rappel',
      'Synthétiseurs sombres et oppressants'
    ],
    indicesTextuels: [
      '« Au village, sans prétention »',
      '« Les braves gens n’aiment pas que... »'
    ],
    leurresTextuels: [
      '« Un p’tit afghan, comme les enfants, n’a jamais voulu ça »',
      '« Balance ton quoi, un jour peut-être ça changera »'
    ],
    illustrationUrl: '/engagement/brassensreputation.jpg',
    explication: 'Un hymne libertaire à la marge et à l’individualisme. Brassens revendique le droit de ne pas suivre la foule sans subir d’intolérance.'
  },
  {
    id: 'vian-deserteur',
    titre: 'Le Déserteur',
    artiste: 'Boris Vian',
    annee: 1954,
    contexte: 'Fin de la guerre d’Indochine et début de la guerre d’Algérie (chanson censurée).',
    causePrincipale: 'libertes_censure',
    causesAcceptees: ['paix_guerre'],
    posturePrincipale: 'colere',
    posturesAcceptees: ['tristesse_lassitude', 'espoir_rassemblement'],
    indicesMusicaux: [
      'Tempo de marche paisible en contraste avec la gravité du texte',
      'Accompagnement sobre à la guitare',
      'Diction solennelle et voix posée'
    ],
    leurresMusicaux: [
      'Chœur gospel puissant et imposant',
      'Nappe de synthétiseurs futuristes'
    ],
    indicesTextuels: [
      '« Monsieur le Président, je vous fais une lettre »',
      '« Prévenez vos gendarmes que je n’aurai pas d’armes »'
    ],
    leurresTextuels: [
      '« Broken bottles under children’s feet »',
      '« Un jour peut-être ça changera »'
    ],
    illustrationUrl: '/engagement/borisviandeserteur.jpg',
    explication: 'Une lettre ouverte antimilitariste d’un homme refusant d’obéir à l’ordre de mobiliser. Censurée à sa sortie pour son appel ouvert à la désertion.'
  },
  {
    id: 'ferrat-nuit',
    titre: 'Nuit et Brouillard',
    artiste: 'Jean Ferrat',
    annee: 1963,
    contexte: 'Déportation dans les camps de concentration nazis durant la Seconde Guerre mondiale.',
    causePrincipale: 'memoire',
    causesAcceptees: ['paix_guerre'],
    posturePrincipale: 'hommage',
    posturesAcceptees: ['tristesse_lassitude'],
    indicesMusicaux: [
      'Son de clarinette dramatique et grave',
      'Pression rythmique évoquant la marche mécanique des trains',
      'Montée en puissance orchestrale progressive'
    ],
    leurresMusicaux: [
      'Sifflement léger et pop',
      'Guitares électriques saturées style grunge'
    ],
    indicesTextuels: [
      '« Ils étaient vingt et cent, ils étaient des milliers »',
      '« Nul ne sait aujourd’hui ce qu’ils sont devenus »'
    ],
    leurresTextuels: [
      '« Approche-toi, regarde-moi, puis tais-toi »',
      '« Mes mains d’or travaillent encore »'
    ],
    illustrationUrl: '/engagement/jeanferratnuitetbrouillard.jpg',
    explication: 'Hommage solennel aux victimes de la déportation. Ferrat rappelle le devoir de mémoire indispensable pour préserver la dignité humaine.'
  },
  {
    id: 'leforestier-arbre',
    titre: 'Comme un arbre dans la ville',
    artiste: 'Maxime Le Forestier',
    annee: 1973,
    contexte: 'Bétonnage et urbanisation galopante des années 70, quête de liberté individuelle.',
    causePrincipale: 'ecologie',
    causesAcceptees: ['libertes_censure'],
    posturePrincipale: 'tristesse_lassitude',
    posturesAcceptees: ['espoir_rassemblement'],
    indicesMusicaux: [
      'Arpèges de guitare acoustique Folk doux et mélancoliques',
      'Tempo fluide et chant posé très intimiste',
      'Entrée discrète de la basse et des cordes'
    ],
    leurresMusicaux: [
      'Batterie punk frénétique à la boîte à rythmes',
      'Riff de guitare métal lourd et agressif'
    ],
    indicesTextuels: [
      '« Comme un arbre dans la ville, j’ai grandi entre deux pavés »',
      '« Cacher le ciel et couper le vent »'
    ],
    leurresTextuels: [
      '« Tu leur diras que c’est beau, la Terre avec de l’eau »',
      '« Au village, sans prétention »'
    ],
    illustrationUrl: '/engagement/maximeleforestierarbredansmaville.jpg',
    explication: 'Métaphore poétique de l’arbre coincé dans le béton pour exprimer le besoin de nature et la résistance individuelle face à la norme.'
  },
  {
    id: 'ferre-afficherouge',
    titre: 'L’Affiche rouge',
    artiste: 'Léo Ferré',
    annee: 1959,
    contexte: 'Hommage d’Aragon aux 23 résistants étrangers du groupe Manouchian fusillés en 1944.',
    causePrincipale: 'memoire',
    causesAcceptees: ['paix_guerre'],
    posturePrincipale: 'hommage',
    posturesAcceptees: ['tristesse_lassitude'],
    indicesMusicaux: [
      'Récitatif théâtral et déclamation poétique très solennelle',
      'Accompagnement de piano sombre et sobre',
      'Voix habitée, vibrante et poignante'
    ],
    leurresMusicaux: [
      'Guitares Hard-Rock très saturées et incisives',
      'Cuivres funk et tempo très rapide'
    ],
    indicesTextuels: [
      '« Vingt et trois qui criaient la France en s’abattant »',
      '« Vous aviez cherché vos armes dans le reflet »'
    ],
    leurresTextuels: [
      '« Ils étaient vingt et cent, ils étaient des milliers »',
      '« Un 737 s’est écrasé sur l’architecture »'
    ],
    illustrationUrl: '/engagement/ferrelafficherouge.jpg',
    explication: 'Léo Ferré met en musique le poème de Louis Aragon pour immortaliser la mémoire des résistants étrangers mort pour la France.'
  },
  {
    id: 'trust-antisocial',
    titre: 'Antisocial',
    artiste: 'Trust',
    annee: 1980,
    contexte: 'Crise économique du début des années 80, précarité et condition ouvrière.',
    causePrincipale: 'justice_sociale',
    causesAcceptees: ['libertes_censure'],
    posturePrincipale: 'colere',
    indicesMusicaux: [
      'Guitares Hard-Rock très saturées et incisives',
      'Tempo rapide et battement de batterie survolté',
      'Chant hurlé véhiculant la rage et l’urgence'
    ],
    leurresMusicaux: [
      'Arpèges de guitare classique doucement égrénés',
      'Accordéon nostalgique du folklore parisien'
    ],
    indicesTextuels: [
      '« Tu bosses toute ta vie pour payer ton enterrement »',
      '« Antisocial, tu perds ton sang-froid »'
    ],
    leurresTextuels: [
      '« Imagine all the people livin’ life in peace »',
      '« Ils étaient vingt et cent, ils étaient des milliers »'
    ],
    illustrationUrl: '/engagement/trustantisocial.jpg',
    explication: 'Symbole du Hard-Rock français, ce morceau crie la révolte contre la déshumanisation du travail et le mépris des élites envers la classe populaire.'
  },
  {
    id: 'berurier-porcherie',
    titre: 'Porcherie',
    artiste: 'Bérurier Noir',
    annee: 1989,
    contexte: 'Montée de l’extrême droite et émergence du mouvement punk alternatif français.',
    causePrincipale: 'egalite_discriminations',
    causesAcceptees: ['libertes_censure', 'justice_sociale'],
    posturePrincipale: 'colere',
    posturesAcceptees: ['ironie_satire'],
    indicesMusicaux: [
      'Boîte à rythmes punk ultra-rapide (débit binaire)',
      'Guitares saturées et boîte à meuh/fanfare cuivrée',
      'Slogan collectif scandé en chœur'
    ],
    leurresMusicaux: [
      'Piano romantique au tempo rubato',
      'Sintir traditionnel et chants soufis'
    ],
    indicesTextuels: [
      '« La jeunesse emmerde le Front National »',
      '« Monde de merde, monde de flics »'
    ],
    leurresTextuels: [
      '« You bosses toute ta vie pour payer ton enterrement »',
      '« Au village, sans prétention »'
    ],
    illustrationUrl: '/engagement/berurierporcherie.jpg',
    explication: 'Hymne punk antifasciste majeur, scandant le rejet des idéologies de haine et revendiquant une liberté festive et contestataire.'
  },
  {
    id: 'lavilliers-mains',
    titre: 'Les Mains d’or',
    artiste: 'Bernard Lavilliers',
    annee: 2001,
    contexte: 'Fermeture des usines sidérurgiques et crise du monde ouvrier.',
    causePrincipale: 'justice_sociale',
    causesAcceptees: ['memoire'],
    posturePrincipale: 'hommage',
    posturesAcceptees: ['tristesse_lassitude'],
    indicesMusicaux: [
      'Rythmique chaleureuse d’inspiration latin-jazz/reggae',
      'Accordéon nostalgique et expressif',
      'Voix chaude et fraternelle'
    ],
    leurresMusicaux: [
      'Synthétiseurs stridents d’électro-club',
      'Envolée lyrique suraiguë à l’opéra'
    ],
    indicesTextuels: [
      '« Un grand haut-fourneau fendu au milieu des ronces »',
      '« Mes mains d’or travaillent encore »'
    ],
    leurresTextuels: [
      '« Nul ne sait aujourd’hui ce qu’ils sont devenus »',
      '« God save the queen, the fascist regime »'
    ],
    illustrationUrl: '/engagement/lavillierslesmainsdor.jpg',
    explication: 'Un hommage poignant à la fierté du travail manuel et à la mémoire ouvrière confrontée au déclin industriel.'
  },
  {
    id: 'mickey3d-respire',
    titre: 'Respire',
    artiste: 'Mickey 3D',
    annee: 2002,
    contexte: 'Prise de conscience du réchauffement climatique et crise environnementale.',
    causePrincipale: 'ecologie',
    posturePrincipale: 'ironie_satire',
    posturesAcceptees: ['tristesse_lassitude'],
    indicesMusicaux: [
      'Guitare acoustique répétitive et entêtante',
      'Ligne de basse lourde et étouffante',
      'Voix parlée-chantée désabusée'
    ],
    leurresMusicaux: [
      'Batterie militaire au rythme d’une marche',
      'Accordéon nostalgique et joyeux'
    ],
    indicesTextuels: [
      '« Approche-toi, regarde-moi, puis tais-toi »',
      '« Tu leur diras que c’est beau, la Terre avec de l’eau »'
    ],
    leurresTextuels: [
      '« Ils étaient vingt et cent, ils étaient des milliers »',
      '« La France est un pays bourgeois »'
    ],
    illustrationUrl: '/engagement/mickey3drespire.jpg',
    explication: 'Conte poétique et sombre adressé à un enfant pour dénoncer l’héritage écologique désastreux laissé par les générations précédentes.'
  },
  {
    id: 'renaud-manhattan',
    titre: 'Manhattan-Kaboul',
    artiste: 'Renaud & Axelle Red',
    annee: 2002,
    contexte: 'Attentats du 11 septembre 2001 et guerre en Afghanistan.',
    causePrincipale: 'paix_guerre',
    causesAcceptees: ['justice_sociale'],
    posturePrincipale: 'tristesse_lassitude',
    posturesAcceptees: ['hommage'],
    indicesMusicaux: [
      'Duo vocal alterné incarnant deux victimes d’horizons opposés',
      'Envolée de violons mélancoliques',
      'Tempo lent et rythmique pop-rock solennelle'
    ],
    leurresMusicaux: [
      'Solo de guitare punk agressif',
      'Chœur joyeux et dansant'
    ],
    indicesTextuels: [
      '« Un 737 s’est écrasé sur l’architecture »',
      '« Un p’tit afghan, comme les enfants, n’a jamais voulu ça »'
    ],
    leurresTextuels: [
      '« La France est un pays bourgeois »',
      '« Antisocial, tu perds ton sang-froid »'
    ],
    illustrationUrl: '/engagement/renaudaxelleredmanhattankaboul.jpg',
    explication: 'Chanson mettant en parallèle un trader new-yorkais et une jeune fille afghane pour dénoncer les victimes innocentes des fanatismes et de la guerre.'
  },
  {
    id: 'orelsan-suicide',
    titre: 'Suicide social',
    artiste: 'Orelsan',
    annee: 2011,
    contexte: 'Fractures sociales, crise du vivre-ensemble et tensions identitaires en France.',
    causePrincipale: 'justice_sociale',
    causesAcceptees: ['egalite_discriminations', 'libertes_censure'],
    posturePrincipale: 'colere',
    posturesAcceptees: ['tristesse_lassitude'],
    indicesMusicaux: [
      'Flow rap accéléré exprimant une tension étouffante',
      'Instrumental orchestral au piano et violons de plus en plus lourds',
      'Montée dramatique continue vers l’implosion'
    ],
    leurresMusicaux: [
      'Clarinette klezmer joyeuse',
      'Section de cuivres funk ultra-dansante'
    ],
    indicesTextuels: [
      '« Adieu la France de la bien-pensance »',
      '« Tout le monde a son opinion sur tout »'
    ],
    leurresTextuels: [
      '« Un 737 s’est écrasé sur l’architecture »',
      '« Imagine all the people livin’ life in peace »'
    ],
    illustrationUrl: '/engagement/orelsansuicidesocial.jpg',
    explication: 'Un réquisitoire percutant où le personnage détruit un à un tous les stéréotypes de la société avant de sombrer, illustrant l’impasse du rejet généralisé.'
  },
  {
    id: 'angele-balance',
    titre: 'Balance ton quoi',
    artiste: 'Angèle',
    annee: 2018,
    contexte: 'Mouvement #MeToo et prise de parole contre le sexisme et le harcèlement.',
    causePrincipale: 'egalite_discriminations',
    posturePrincipale: 'ironie_satire',
    posturesAcceptees: ['espoir_rassemblement'],
    indicesMusicaux: [
      'Production pop/électro moderne et dansante',
      'Mélodie accrocheuse contrastant avec le sujet grave',
      'Sifflement léger et enfantin'
    ],
    leurresMusicaux: [
      'Clarinette basse au son sombre et tragique',
      'Caisse claire martelée au tempo militaire'
    ],
    indicesTextuels: [
      '« Balance ton quoi, un jour peut-être ça changera »',
      '« Tu m’as regardée comme si j’étais une chose »'
    ],
    leurresTextuels: [
      '« How long, how long must we sing this song? »',
      '« Un grand haut-fourneau fendu au milieu des ronces »'
    ],
    illustrationUrl: '/engagement/angelebalance.jpg',
    explication: 'Angèle utilise l’humour et des sonorités pop pour rendre accessible la lutte contre le sexisme quotidien et prôner le respect mutuel.'
  },
  {
    id: 'lennon-imagine',
    titre: 'Imagine',
    artiste: 'John Lennon',
    annee: 1971,
    contexte: 'Guerre du Vietnam et mouvement pacifiste mondial.',
    causePrincipale: 'paix_guerre',
    causesAcceptees: ['justice_sociale'],
    posturePrincipale: 'espoir_rassemblement',
    posturesAcceptees: ['hommage'],
    indicesMusicaux: [
      'Accompagnement épuré au piano doux et répétitif',
      'Tempo lent et serein apportant de l’apaisement',
      'Entrée progressive de cordes enveloppantes'
    ],
    leurresMusicaux: [
      'Batterie punk très rapide et déstructurée',
      'Tirs d’armes à feu intégrés au rythme'
    ],
    indicesTextuels: [
      '« Imagine all the people livin’ life in peace »',
      '« You may say I’m a dreamer, but I’m not the only one »'
    ],
    leurresTextuels: [
      '« How long, how long must we sing this song? »',
      '« Tu bosses toute ta vie pour payer ton enterrement »'
    ],
    illustrationUrl: '/engagement/johnlennonimagine.jpg',
    explication: 'Un hymne utopique universel appelant à la paix globale, à la suppression des frontières et au dépassement des divisions.'
  },
  {
    id: 'gaye-whatsgoingon',
    titre: 'What’s Going On',
    artiste: 'Marvin Gaye',
    annee: 1971,
    contexte: 'Guerre du Vietnam, protestations sociales et violences policières aux USA.',
    causePrincipale: 'paix_guerre',
    causesAcceptees: ['antiracisme_droits_civiques', 'justice_sociale'],
    posturePrincipale: 'tristesse_lassitude',
    posturesAcceptees: ['espoir_rassemblement'],
    indicesMusicaux: [
      'Groove Soul/Funk suave avec percussions douces (congas)',
      'Ligne de basse fluide et nappes de saxophones mélancoliques',
      'Voix de tête vibrante et chœurs conversationnels'
    ],
    leurresMusicaux: [
      'Guitares métal lourdes et agressives',
      'Rhythme de marche militaire binaire'
    ],
    indicesTextuels: [
      '« Mother, mother, there’s too many of you crying »',
      '« War is not the answer, for only love can conquer hate »'
    ],
    leurresTextuels: [
      '« God save the queen, the fascist regime »',
      '« In your head, in your head, zombie »'
    ],
    illustrationUrl: '/engagement/marvingayewhatsgoinon.jpg',
    explication: 'Un chef-d’œuvre de la Soul d’une grande douceur musicale, portant un regard attristé sur la violence du monde et appelant à la fraternité.'
  },
  {
    id: 'marley-war',
    titre: 'War',
    artiste: 'Bob Marley & The Wailers',
    annee: 1976,
    contexte: 'Lutte contre l’Apartheid en Afrique du Sud et discriminations raciales globales.',
    causePrincipale: 'antiracisme_droits_civiques',
    causesAcceptees: ['paix_guerre'],
    posturePrincipale: 'colere',
    posturesAcceptees: ['espoir_rassemblement'],
    indicesMusicaux: [
      'Rythmique Reggae stricte avec accentuation du contretemps (one drop)',
      'Ligne de basse lourde et hypnotique',
      'Chant déclamatoire solennel'
    ],
    leurresMusicaux: [
      'Arpèges de guitare classique flamenca',
      'Synthesiseurs techno très rapides'
    ],
    indicesTextuels: [
      '« Until the philosophy which holds one race superior... »',
      '« Until that day, the dream of lasting peace... »'
    ],
    leurresTextuels: [
      '« Imagine all the people livin’ life in peace »',
      '« What’s so civil about war anyway? »'
    ],
    illustrationUrl: '/engagement/bobmarleywar.jpg',
    explication: 'Bob Marley met directement en musique un discours de 1963 d’Haïlé Sélassié à l’ONU pour dénoncer le racisme comme cause première des guerres.'
  },
  {
    id: 'sexpistols-godsave',
    titre: 'God Save the Queen',
    artiste: 'Sex Pistols',
    annee: 1977,
    contexte: 'Jubilé de la Reine Élisabeth II, crise économique et détresse de la jeunesse britannique.',
    causePrincipale: 'justice_sociale',
    causesAcceptees: ['libertes_censure'],
    posturePrincipale: 'colere',
    posturesAcceptees: ['ironie_satire'],
    indicesMusicaux: [
      'Son Punk-Rock brut et guitares saturées au son crasseux',
      'Tempo frénétique et chant nargueur/provocateur',
      'Production volontairement abrasive'
    ],
    leurresMusicaux: [
      'Chœur d’église solennel avec orgue',
      'Trompettes royales de cérémonie'
    ],
    indicesTextuels: [
      '« God save the queen, the fascist regime »',
      '« No future, no future for you »'
    ],
    leurresTextuels: [
      '« Mother, mother, there’s too many of you crying »',
      '« Celle qui répondait au nom de Glorieuse »'
    ],
    illustrationUrl: '/engagement/sexpistolsgodsavethequeen.jpg',
    explication: 'Un coup d’éclat Punk qui détourne l’hymne royal pour exprimer le désespoir et la colère d’une jeunesse sans perspectives d’avenir.'
  },
  {
    id: 'u2-sunday',
    titre: 'Sunday Bloody Sunday',
    artiste: 'U2',
    annee: 1983,
    contexte: 'Conflit en Irlande du Nord et massacre du Dimanche Sanglant de 1972 à Derry.',
    causePrincipale: 'paix_guerre',
    posturePrincipale: 'tristesse_lassitude',
    posturesAcceptees: ['colere'],
    indicesMusicaux: [
      'Batterie martelant un rythme militaire (caisse claire)',
      'Arpèges de guitare répétitifs exprimant la tension',
      'Chant aigu dramatique appelant à l’arrêt des combats'
    ],
    leurresMusicaux: [
      'Solo de saxophone mélancolique style jazz',
      'Sintir traditionnel et percussions orientales'
    ],
    indicesTextuels: [
      '« How long, how long must we sing this song? »',
      '« Broken bottles under children’s feet »'
    ],
    leurresTextuels: [
      '« Don’t catch you slippin’ now »',
      '« Monsieur le Président, je vous fais une lettre »'
    ],
    illustrationUrl: '/engagement/u2sundaybloodysunday.jpg',
    explication: 'U2 dénonce la spirale de la violence en Irlande du Nord. Le rythme militaire de la batterie contraste avec le message profondément pacifiste du texte.'
  },
  {
    id: 'gnr-civilwar',
    titre: 'Civil War',
    artiste: 'Guns N’ Roses',
    annee: 1990,
    contexte: 'Requisitoire général contre toutes les formes de guerres et le militarisme.',
    causePrincipale: 'paix_guerre',
    causesAcceptees: ['libertes_censure'],
    posturePrincipale: 'colere',
    posturesAcceptees: ['tristesse_lassitude'],
    indicesMusicaux: [
      'Introduction acoustique au sifflement mélancolique',
      'Éruption Hard-Rock avec solos de guitare expressifs',
      'Chant écorché d’Axl Rose oscillant entre plainte et rage'
    ],
    leurresMusicaux: [
      'Accordéon guinguette parisien',
      'Rythmique électro-disco dansante'
    ],
    indicesTextuels: [
      '« Look at the shoes we’re wearing, look at the blood we’re spilling »',
      '« What’s so civil about war anyway? »'
    ],
    leurresTextuels: [
      '« No future, no future for you »',
      '« Tu bosses toute ta vie pour payer ton enterrement »'
    ],
    illustrationUrl: '/engagement/gunsnroses.jpg',
    explication: 'Une grande ballade Hard-Rock qui questionne l’absurdité des guerres en soulignant l’hypocrisie du terme « guerre civile ».'
  },
  {
    id: 'cranberries-zombie',
    titre: 'Zombie',
    artiste: 'The Cranberries',
    annee: 1994,
    contexte: 'Attentat de Warrington en Angleterre par l’IRA ayant tué deux enfants.',
    causePrincipale: 'paix_guerre',
    posturePrincipale: 'colere',
    posturesAcceptees: ['tristesse_lassitude', 'hommage'],
    indicesMusicaux: [
      'Guitares grunge saturées explosives',
      'Voix de Dolores O’Riordan avec yodel (sauts de voix) agressive',
      'Rythmique lourde et obsédante'
    ],
    leurresMusicaux: [
      'Nappe éthérée de synthétiseurs',
      'Clarinette solo très douce'
    ],
    indicesTextuels: [
      '« In your head, in your head, zombie »',
      '« Another mother’s breaking heart is taking over »'
    ],
    leurresTextuels: [
      '« Imagine all the people livin’ life in peace »',
      '« Balance ton quoi, un jour peut-être ça changera »'
    ],
    illustrationUrl: '/engagement/cranberrieszombie.jpg',
    explication: 'Une dénonciation rageuse du terrorisme qui transforme les hommes en "zombies" aveuglés par des haines historiques.'
  }
];

/**
 * Les illustrations sont stockées dans `public/engagement`. On préfixe leur URL
 * avec le BASE_URL Astro (/education-musicale) pour qu'elles restent accessibles
 * en développement comme sur GitHub Pages.
 */
export const SONGS: EngagementSong[] = SONGS_DATA.map((song) => ({
  ...song,
  illustrationUrl: song.illustrationUrl ? relativeUrl(song.illustrationUrl) : undefined
}));
