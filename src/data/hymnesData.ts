export interface HymneQuizItem {
  id: string;
  text: string;
  isHymn: boolean;
  explanation: string;
}

export interface HymneVideoItem {
  id: string;
  title: string;
  url: string;
  subject: 'single' | 'group'; // Un individu vs Un groupe
  goal: 'personal' | 'unite';   // Raconter sa vie vs Unir/Représenter
  isHymn: boolean;             // Résultat final
  explanation: string;
}

// 1. Les 15 questions du Tri "Hymne ou Pas Hymne ?"
export const hymneQuizList: HymneQuizItem[] = [
  { id: '1', text: "Un chant entonné par 60 000 personnes dans un stade avant un match national.", isHymn: true, explanation: "Un hymne rassemble une communauté autour de valeurs communes." },
  { id: '2', text: "Une chanson où un artiste raconte son histoire d'amour de l'été.", isHymn: false, explanation: "C'est une chanson personnelle centrée sur un seul individu." },
  { id: '3', text: "La musique jouée lors de la remise d'une médaille d'or aux Jeux Olympiques.", isHymn: true, explanation: "Elle représente toute une nation lors d'une cérémonie officielle." },
  { id: '4', text: "Un morceau pop où le chanteur explique ce qu'il a mangé au petit-déjeuner.", isHymn: false, explanation: "Aucun rôle collectif ou symbolique ici !" },
  { id: '5', text: "Un chant d'établissement entonné par tous les élèves lors de la fête de fin d'année.", isHymn: true, explanation: "Il représente et réunit l'ensemble des membres du collège." },
  { id: '6', text: "Une comptine chantée par une maman pour endormir son bébé.", isHymn: false, explanation: "C'est une berceuse intime, pas un symbole de groupe." },
  { id: '7', text: "L'Ode à la joie de Beethoven jouée pour représenter l'Union Européenne.", isHymn: true, explanation: "C'est l'hymne officiel qui rassemble plusieurs pays européens." },
  { id: '8', text: "Une chanson de rap où un artiste vante ses qualités personnelles.", isHymn: false, explanation: "Le sujet est centré uniquement sur une seule personne." },
  { id: '9', text: "Le chant des supporters d'un club de football entonné en chœur.", isHymn: true, explanation: "Il sert à unir tous les fans derrière une même équipe." },
  { id: '10', text: "Un morceau instrumental joué pour le couronnement d'un roi devant tout un peuple.", isHymn: true, explanation: "Il officialise et rassemble un royaume autour d'un événement majeur." },
  { id: '11', text: "Un poème mis en musique écrit par un élève pour déclarer sa flamme.", isHymn: false, explanation: "C'est un message individuel et privé." },
  { id: '12', text: "Un chant historique entonné par les soldats pour se donner du courage ensemble.", isHymn: true, explanation: "Il fédère et réunit un groupe face à une épreuve." },
  { id: '13', text: "La musique du générique d'une série télévisée sur la vie d'un super-héros.", isHymn: false, explanation: "C'est un thème musical pour un personnage fictionnel." },
  { id: '14', text: "Un hymne de la paix chanté lors d'un rassemblement mondial humanitaire.", isHymn: true, explanation: "Il exprime un message universel qui concerne l'humanité entière." },
  { id: '15', text: "Un morceau joué au piano par un musicien tout seul dans sa chambre.", isHymn: false, explanation: "C'est un moment d'expression personnelle." }
];

// 2. Les 15 vidéos YouTube pour l'Analyseur de "Pouvoir de Rassemblement"
export const hymneVideosList: HymneVideoItem[] = [
  { id: 'v1', title: 'La Marseillaise (Hymne National Français)', url: 'https://www.youtube.com/watch?v=pWemV6TiUZE', subject: 'group', goal: 'unite', isHymn: true, explanation: "La Marseillaise représente tout le peuple français." },
  { id: 'v2', title: 'Stromae – Papaoutai', url: 'https://www.youtube.com/watch?v=oiKj0Z_Xnjc', subject: 'single', goal: 'personal', isHymn: false, explanation: "Stromae raconte une histoire personnelle d'absence paternelle." },
  { id: 'v3', title: 'Hymne Européen (Ode à la Joie - Beethoven)', url: 'https://www.youtube.com/watch?v=X6s6hTL_bUg', subject: 'group', goal: 'unite', isHymn: true, explanation: "L'Ode à la joie symbolise l'union des peuples européens." },
  { id: 'v4', title: 'Angèle – Balance ton quoi', url: 'https://www.youtube.com/watch?v=Hi7Rx3En7-w', subject: 'single', goal: 'personal', isHymn: false, explanation: "C'est une chanson engagée personnelle, pas un symbole d'État." },
  { id: 'v5', title: 'Händel – Zadok The Priest (Couronnement)', url: 'https://www.youtube.com/watch?v=uhUHoI5rlMw', subject: 'group', goal: 'unite', isHymn: true, explanation: "C'est l'hymne officiel joué pour le couronnement des souverains." },
  { id: 'v6', title: 'Soprano – Roule', url: 'https://www.youtube.com/watch?v=8K2s3uNPl6A', subject: 'single', goal: 'personal', isHymn: false, explanation: "Un hommage personnel à un ami disparu." },
  { id: 'v7', title: 'Hymne Officiel des JO de Rio (Samsung)', url: 'https://www.youtube.com/watch?v=wApd-hDzntc', subject: 'group', goal: 'unite', isHymn: true, explanation: "Il rassemble les athlètes de toutes les nations." },
  { id: 'v8', title: 'Gims – Bella', url: 'https://www.youtube.com/watch?v=r325pYQd2A8', subject: 'single', goal: 'personal', isHymn: false, explanation: "L'histoire d'une attirance pour une personne." },
  { id: 'v9', title: 'You’ll Never Walk Alone (Liverpool FC)', url: 'https://www.youtube.com/watch?v=GOn3S5s068c', subject: 'group', goal: 'unite', isHymn: true, explanation: "C'est l'hymne emblématique qui réunit les supporters du club." },
  { id: 'v10', title: 'Renan Luce – La Lettre', url: 'https://www.youtube.com/watch?v=QZ3L8B7ETo4', subject: 'single', goal: 'personal', isHymn: false, explanation: "Une histoire fictive racontée par un seul narrateur." },
  { id: 'v11', title: 'The Star-Spangled Banner (Hymne USA)', url: 'https://www.youtube.com/watch?v=vPKp29Luryc', subject: 'group', goal: 'unite', isHymn: true, explanation: "L'hymne américain célébrant la nation entière." },
  { id: 'v12', title: 'Aldebert – Pour louper l’école', url: 'https://www.youtube.com/watch?v=4x-PThC06_k', subject: 'single', goal: 'personal', isHymn: false, explanation: "Une chanson humoristique sur le quotidien d'un enfant." },
  { id: 'v13', title: 'Chant des Partisans (Résistance)', url: 'https://www.youtube.com/watch?v=sUZWlf_vuKg', subject: 'group', goal: 'unite', isHymn: true, explanation: "L'hymne de la Résistance française rassemblant les combattants." },
  { id: 'v14', title: 'Vianney – Beau-papa', url: 'https://www.youtube.com/watch?v=aG-80_5Nsc8', subject: 'single', goal: 'personal', isHymn: false, explanation: "Une chanson intime sur la famille." },
  { id: 'v15', title: 'Hymne de la Ligue des Champions (UEFA)', url: 'https://www.youtube.com/watch?v=0Qqd6T_A9LY', subject: 'group', goal: 'unite', isHymn: true, explanation: "La musique officielle qui rassemble le football européen." }
];