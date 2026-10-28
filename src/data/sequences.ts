import { moyenAgeVideos } from './moyenAgeData';

export interface AudioTrack {
  title: string;
  subtitle?: string;
  src: string;
}

export interface VideoTrack {
  title: string;
  url: string;
  badge?: string;
  // Pas de description : standard d'affichage = badge + titre uniquement.
}

export interface ResourceLink {
  title: string;
  url: string;
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
  /** Liens d'écoute externes (podcasts, radios, plateformes). */
  resourceLinks?: ResourceLink[];
}

export interface LevelData {
  title: string;
  slug: string;
  forceActiveSequence?: number; // Ajouter (1 à 5) pour forcer une séquence, sans tenir compte du calendrier
  sequences: Sequence[];
}

/**
 * Séquence forcée d'un niveau (index 0 à 4), ou undefined pour la bascule
 * automatique selon le calendrier scolaire (voir src/utils/sequenceCalendar.ts).
 */
export function getForcedSequenceIndex(levelKey: string): number | undefined {
  const forced = siteData[levelKey]?.forceActiveSequence;
  return forced === undefined ? undefined : forced - 1;
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
        videos: [
          {
            badge: 'Notion de cours',
            title: 'Comprendre le tempo en musique',
            url: 'https://www.youtube.com/watch?v=0Hez5ZkMlUE'
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
            url: 'https://www.youtube.com/watch?v=gmOS8sYlbUg'
          }
        ]
      },
     {
        slug: 'musique-et-nuances',
        title: 'Musique et Nuances',
        description: 'Étude des intensités sonores du pianissimo au fortissimo.',
        videos: [
          {
            badge: 'Capsule',
            title: 'Les Nuances en musique',
            url: 'https://www.youtube.com/watch?v=t98t2gyS578'
          },
          {
            badge: 'Écoute 1',
            title: 'Carl Orff — Carmina Burana (O Fortuna)',
            url: 'https://www.youtube.com/watch?v=GZDLTN4xRUM'
          },
          {
            badge: 'Écoute 2',
            title: 'Anton Bruckner — Symphonie n°4 (Mouvement 4)',
            url: 'https://www.youtube.com/watch?v=xsctgL7U_Dc'
          },
          {
            badge: 'Écoute 3',
            title: 'Grieg — Peer Gynt (Dans le palais du roi de la montagne)',
            url: 'https://www.youtube.com/watch?v=OqP09dBt9R0'
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
            url: 'https://www.youtube.com/watch?v=g98D4HljeYE'
          },
         
          {
            badge: 'Projet Musical',
            title: 'The Beatles — Yellow Submarine',
            url: 'https://www.youtube.com/watch?v=rINa_BbHzZs'
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
      },
    ],
  },
  '5eme': {
    title: '5ème',
    slug: '5eme',
    sequences: [
      {
        slug: 'musique-et-voix',
        title: 'Musique et Voix',
        description: 'Comprendre le fonctionnement de l\'instrument vocal et classer les voix du plus grave au plus aigu.',
        videos: [
          {
            badge: 'Physiologie',
            title: 'La voix comment ça fonctionne (Jamy)',
            url: 'https://www.youtube.com/watch?v=rG7OxpgXcto'
          },
          {
            badge: 'Tessitures',
            title: 'Les différentes tessitures',
            url: 'https://www.youtube.com/watch?v=q9DOn3mb5mo'
          },
          {
            badge: 'Aigu féminin',
            title: 'La voix de soprano colorature',
            url: 'https://www.youtube.com/watch?v=Mrp-JoJuBwM'
          },
          {
            badge: 'Voix de femmes',
            title: 'Soprano, Mezzo et Alto',
            url: 'https://www.youtube.com/watch?v=gKp0nCeaKJU'
          },
          {
            badge: 'Cas particulier',
            title: 'Le contre-ténor',
            url: 'https://www.youtube.com/watch?v=tas8lTMR5Kw'
          },
          {
            badge: 'Aigu masculin',
            title: 'La voix de ténor',
            url: 'https://www.youtube.com/watch?v=sD9mR1RfXsw'
          },
          {
            badge: 'A cappella',
            title: 'Pentatonix - Daft Punk',
            url: 'https://www.youtube.com/watch?v=3MteSlpxCpo'
          },
          {
            badge: 'Projet musical',
            title: 'Projet musical : Le Café (Oldelaf)',
            url: 'https://www.youtube.com/watch?v=UGtKGX8B9hU'
          }
        ]
      },
      {
        slug: 'musique-et-repetition',
        title: 'Musique et Répétition',
        description: "L'ostinato est une formule musicale répétée qui structure une œuvre. Découvre ses formes rythmique, harmonique et mélodique à travers des exemples variés, puis entraîne ton oreille avec le quiz audio.",
        videos: [
          {
            badge: 'Capsule',
            title: "L'ostinato expliqué en vidéo",
            url: 'https://www.youtube.com/watch?v=YU64q9ijztE'
          },
          {
            badge: 'Ostinato rythmique',
            title: 'Queen — We Will Rock You',
            url: 'https://www.youtube.com/watch?v=46C5IHC_uo8'
          },
          {
            badge: 'Œuvre de référence',
            title: 'Maurice Ravel — Boléro',
            url: 'https://www.youtube.com/watch?v=02nwnxK5t0A'
          },
          {
            badge: 'Ostinato de basse',
            title: 'The Blues Brothers — Peter Gunn Theme',
            url: 'https://www.youtube.com/watch?v=9DgFOsEs-kE'
          },
          {
            badge: 'Musique actuelle',
            title: 'Stromae — Alors on danse',
            url: 'https://www.youtube.com/watch?v=VHoT4N43jK8'
          },
          {
            badge: 'Ostinato de basse',
            title: 'Ray Charles — Hit the Road Jack',
            url: 'https://www.youtube.com/watch?v=SrnWp5O0DEs'
          }
        ],
        resourceLinks: [
          {
            title: 'France Musique — Maxxi Classique : le Boléro, de Gilbert Bécaud aux Rolling Stones',
            url: 'https://www.radiofrance.fr/francemusique/podcasts/maxxi-classique/le-bolero-de-gilbert-becaud-aux-rolling-stones-8772600',
            description: 'Podcast France Musique consacré au Boléro de Ravel et à ses multiples reprises.'
          }
        ]
      },
      {
        slug: 'musique-et-moyen-age',
        title: 'Musique et Moyen-Âge',
        description:
          'Découvre la musique médiévale, ses instruments, ses chants et ses danses.',
        videos: moyenAgeVideos,
      },
      {
        slug: 'musique-et-jazz',
        title: 'Musique et Jazz',
        description: 'Le swing, le scat et l’improvisation à travers les œuvres et le projet musical.',
      },
      {
        slug: 'musique-et-heros',
        title: 'Musique et Héros',
        description:
          'C’est quoi une musique héroïque ? Pourquoi certains éléments la rendent héroïque ?',
      },
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
      { slug: 'musique-et-pub', title: 'Musique et Publicité' },
      { slug: 'musique-et-risques-auditifs', title: 'Musique et Risques Auditifs' },
      { slug: 'musique-et-rap', title: 'Musique et Rap' },
      { slug: 'musique-et-metissage', title: 'Musique et Métissage' },
    ],
  },
};
