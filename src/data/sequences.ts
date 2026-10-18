export interface AudioTrack {
  title: string;
  subtitle?: string;
  src: string;
}

export interface VideoTrack {
  title: string;
  url: string;
  badge?: string;
  description?: string;
}

export interface Sequence {
  slug: string;
  title: string;
  description?: string;
  audios?: AudioTrack[];
  videos?: VideoTrack[]; // Nouveau tableau pour gérer plusieurs vidéos par séquence
  pdfUrl?: string;
  youtubeUrl?: string;
}

export interface LevelData {
  title: string;
  slug: string;
  forceActiveSequence?: number; // Décommenter pour forcer une séquence (1 à 5)
  sequences: Sequence[];
}

export function getAutoSequenceIndex(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Calendrier exact Zone A (Académie de Lyon)
  const exactCalendars: Record<number, [string, string, string, string]> = {
    2026: ['2026-10-17', '2026-12-19', '2027-02-06', '2027-04-03'],
    2027: ['2027-10-23', '2027-12-18', '2028-02-19', '2028-04-15'],
  };

  const currentKey = month >= 9 ? year : year - 1;
  if (exactCalendars[currentKey]) {
    const [p1, p2, p3, p4] = exactCalendars[currentKey].map(d => new Date(d));
    if (now <= p1) return 0;
    if (now <= p2) return 1;
    if (now <= p3) return 2;
    if (now <= p4) return 3;
    return 4;
  }

  // Bascule automatique universelle
  if (month === 9 || (month === 10 && day <= 24)) return 0;
  if (month === 10 || month === 11 || (month === 12 && day <= 24)) return 1;
  if (month === 1 || (month === 2 && day <= 15)) return 2;
  if (month === 3 || (month === 4 && day <= 15)) return 3;
  return 4;
}

export function getActiveSequenceIndex(levelKey: string): number {
  const level = siteData[levelKey];
  if (level && level.forceActiveSequence !== undefined) {
    return level.forceActiveSequence - 1;
  }
  return getAutoSequenceIndex();
}

export const siteData: Record<string, LevelData> = {
  '6eme': {
    title: '6ème',
    slug: '6eme',
    sequences: [
      {
        slug: 'musique-et-tempo',
        title: 'Musique et Tempo',
        description: 'Découverte de la vitesse en musique et des variations de tempo.',
        audios: [
          { title: 'Extrait n°1 — Presto', subtitle: 'Écoute comparative', src: '/audio/6eme/tempo-presto.mp3' },
          { title: 'Chant / Playback', subtitle: 'Accompagnement de travail', src: '/audio/6eme/tempo-playback.mp3' }
        ],
        videos: [
          {
            badge: 'Notion de cours',
            title: 'Comprendre le tempo en musique',
            url: 'https://www.youtube.com/watch?v=0Hez5ZkMlUE',
            description: 'Capsule sur la vitesse de la musique, le métronome et les BPM.'
          },
          {
            badge: 'Écoute 1',
            title: 'Le Sacre du Printemps — Extrait 1',
            url: 'https://www.youtube.com/watch?v=PkX5rJ8NsT8'
          },
          {
            badge: 'Écoute 2',
            title: 'Le Sacre du Printemps — Extrait 2',
            url: 'https://www.youtube.com/watch?v=mb36n034bA0'
          },
          {
            badge: 'Projet musical',
            title: "J'veux du soleil — Au P'tit Bonheur",
            url: 'https://www.youtube.com/watch?v=pR7HBDldgDE'
          },
          {
            badge: 'Projet Musical - Karaoké',
            title: "J'veux du soleil — Instrumental",
            url: 'https://www.youtube.com/watch?v=gmOS8sYlbUg',
            description: 'Support pour s’entraîner à chanter le texte en rythme.'
          }
        ],
        pdfUrl: '/docs/6eme/fiche-tempo.pdf'
      },
     {
        slug: 'musique-et-nuances',
        title: 'Musique et Nuances',
        description: 'Étude des intensités sonores du pianissimo au fortissimo.',
        videos: [
          {
            badge: 'Capsule',
            title: 'Les Nuances en musique',
            url: 'https://www.youtube.com/watch?v=t98t2gyS578',
            description: 'Présentation des nuances et des termes italiens (p, mp, mf, f, crescendo, decrescendo).'
          },
          {
            badge: 'Écoute 1',
            title: 'Carl Orff — Carmina Burana (O Fortuna)',
            url: 'https://www.youtube.com/watch?v=GZDLTN4xRUM',
            description: 'Illustration des contrastes de nuances p, f et crescendo.'
          },
          {
            badge: 'Écoute 2',
            title: 'Anton Bruckner — Symphonie n°4 (Mouvement 4)',
            url: 'https://www.youtube.com/watch?v=xsctgL7U_Dc',
            description: 'Exemple de dynamique et montée en puissance orchestrale.'
          },
          {
            badge: 'Écoute 3',
            title: 'Grieg — Peer Gynt (Dans le palais du roi de la montagne)',
            url: 'https://www.youtube.com/watch?v=OqP09dBt9R0',
            description: 'Accélération du tempo et crescendo d’intensité sonore.'
          },
          {
            badge: 'Écoute 4',
            title: 'Chant / Illustration — Nuances',
            url: 'https://www.youtube.com/watch?v=2oV1KwiTrdM'
          }
        ]
      },
      {
        slug: 'musique-et-timbre',
        title: 'Musique et Timbre',
        description: 'Découverte des familles d’instruments, de la couleur des sons et des modes de jeu.',
        videos: [
          
          {
            badge: 'Découverte',
            title: 'Les cordes frottées',
            url: 'https://www.youtube.com/watch?v=DPNBAaGRf6U'
          },
          {
            badge: 'Découverte',
            title: 'Les cuivres',
            url: 'https://www.youtube.com/watch?v=-6vnNOiblZI',
          },
          {
            badge: 'Découverte',
            title: 'Les bois',
            url: 'https://www.youtube.com/watch?v=UEloA8KVb2Q',
          },
           {
            badge: 'Découverte',
            title: 'Les percussions',
            url: 'https://www.youtube.com/watch?v=w-vyepJoQak'
          },
          {
            badge: 'Écoute 1',
            title: 'Britten — The Young Person’s Guide to the Orchestra',
            url: 'https://www.youtube.com/watch?v=4vbvhU22uAM',
          },
          {
            badge: 'Capsule',
            title: 'Les familles d’instruments',
            url: 'https://www.youtube.com/watch?v=CKry-hslMoM',
          },

          {
            badge: 'Atelier',
            title: 'Blind Test — Les instruments de musique',
            url: 'https://www.youtube.com/watch?v=g98D4HljeYE',
            description: 'Jeu d’écoute pour reconnaître le timbre des instruments.'
          },
         
          {
            badge: 'Projet Musical',
            title: 'The Beatles — Yellow Submarine',
            url: 'https://www.youtube.com/watch?v=rINa_BbHzZs',
            description: 'Version de travail et paroles.'
          },
        ]
      },
{
slug: 'musique-et-plans-sonores',
  title: 'Musique et Plans Sonores',
  description: 'Comprendre l’organisation des différentes couches musicales : mélodie principale, accompagnement, et contrechant.',
  videos: [
    {
      badge: 'Capsule',
      title: 'Les plans sonores (6 rôles)',
      url: 'https://www.youtube.com/watch?v=2S6DsY-X5rI',
    },
    {
      badge: 'Capsule',
      title: 'Les plans sonores (Thème, basse, contrechant)',
      url: 'https://www.youtube.com/watch?v=B8KqWPs4YXw',
    },
    {
      badge: 'Projet musical',
      title: 'Jean-Jacques Goldman – Souviens-toi',
      url: 'https://www.youtube.com/watch?v=WHrKX0rrzMY',
    },
    {
      badge: 'Écoute',
      title: 'All of Me – Standard de Jazz (Trio)',
      url: 'https://www.youtube.com/watch?v=NXKYTJHnqvw',
    },
    {
      badge: 'Visuel',
      title: 'Trio de Schubert – Analyse visuelle',
      url: 'https://www.youtube.com/watch?v=qUtYLWaIsjs',
    },
    {
      badge: 'Exercice',
      title: 'Exercice 1 : Où est le thème ?',
      url: 'https://www.youtube.com/watch?v=5cxEU56lrZE',
    },
    {
      badge: 'Exercice',
      title: 'Exercice 2 : Où est le thème ?',
      url: 'https://www.youtube.com/watch?v=3UnMcW8pUZ8',
    },
    {
      badge: 'Exercice',
      title: 'Exercice 3 : Où est le contrechant ?',
      url: 'https://www.youtube.com/watch?v=8Uvf4HKrCNc',
    },
  ]
},
{
  slug: 'musique-et-hymnes',
  title: 'Musique et Hymnes',
  description: 'Découvrir la fonction, l’histoire et les caractéristiques des hymnes officiels, nationaux et cérémoniaux.',
  videos: [
    {
      badge: 'Officiel',
      title: 'Hymne Officiel – JO de Rio (Samsung)',
      url: 'https://www.youtube.com/watch?v=wApd-hDzntc',
    },
    {
      badge: 'Hymne National',
      title: 'La Marseillaise',
      url: 'https://www.youtube.com/watch?v=pWemV6TiUZE',
    },
    {
      badge: 'Analyse',
      title: 'Le Son d’Alex – L’Analyse des Hymnes',
      url: 'https://www.youtube.com/watch?v=yDD9ay7Z2mY',
    },
    {
      badge: 'Couronnement',
      title: 'Händel – Zadok The Priest (Coronation Anthem)',
      url: 'https://www.youtube.com/watch?v=uhUHoI5rlMw',
    },
    {
      badge: 'Reprise',
      title: 'Serge Gainsbourg – Aux armes et cætera',
      url: 'https://www.youtube.com/watch?v=egHsU2zBgKI',
    },
  ]
}    ],
  },
  '5eme': {
    title: '5ème',
    slug: '5eme',
    sequences: [
      { slug: 'musique-et-voix', title: 'Musique et Voix' },
      { slug: 'musique-et-repetition', title: 'Musique et Répétition' },
      { slug: 'musique-et-moyen-age', title: 'Musique et Moyen-Âge' },
      { slug: 'musique-et-jazz', title: 'Musique et Jazz' },
      { slug: 'musique-et-heros', title: 'Musique et Héros' },
    ],
  },
  '4eme': {
    title: '4ème',
    slug: '4eme',
    sequences: [
      { slug: 'musique-et-opera', title: 'Musique et Opéra' },
      { slug: 'musique-et-cinema', title: 'Musique et Cinéma' },
      { slug: 'musique-et-bruits', title: 'Musique et Bruits' },
      { slug: 'musique-et-rock', title: 'Musique et Rock' },
      { slug: 'musique-et-recyclage', title: 'Musique et Recyclage' },
    ],
  },
  '3eme': {
    title: '3ème',
    slug: '3eme',
    sequences: [
      { slug: 'musique-et-engagement', title: 'Musique et Engagement' },
      { slug: 'musique-et-pub', title: 'Musique et Pub' },
      { slug: 'musique-et-risques-auditifs', title: 'Musique et Risques Auditifs' },
      { slug: 'musique-et-rap', title: 'Musique et Rap' },
      { slug: 'musique-et-metissage', title: 'Musique et Métissage' },
    ],
  },
  'autres': {
    title: 'Entraînement',
    slug: 'autres',
    sequences: [
      { slug: 'exercices', title: 'Exercices' },
      { slug: 'les-instruments', title: 'Les instruments' },
      { slug: 'notions', title: 'Lecture de notes' },
      { slug: 'tadaaaaa', title: 'Numérique' },
      { slug: 'echauffements-vocaux', title: 'Échauffements vocaux' },
    ],
  },
};