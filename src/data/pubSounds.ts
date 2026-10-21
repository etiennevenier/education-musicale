import { relativeUrl } from '../utils/navigation';

export type PubCategory =
  | 'automobile'
  | 'retail'
  | 'tech'
  | 'food'
  | 'media'
  | 'services';

export interface PubSound {
  id: string;
  /** Nom exact du fichier dans public/pub. */
  file: string;
  label: string;
  category: PubCategory;
}

export interface PubSoundEntry extends PubSound {
  /** URL publique finale, base Astro comprise. */
  audioUrl: string;
}

export const PUB_QUIZ_LENGTH = 10;

export const PUB_CATEGORIES: Record<PubCategory, { label: string; icon: string }> = {
  automobile: { label: 'Automobile', icon: '🚗' },
  retail: { label: 'Enseignes & Supermarchés', icon: '🛒' },
  tech: { label: 'Tech, Consoles & Opérateurs', icon: '💻' },
  food: { label: 'Alimentation & Restauration', icon: '🍔' },
  media: { label: 'Médias, Streaming & Cinéma', icon: '🎬' },
  services: { label: 'Services & Divers', icon: '🧩' },
};

const PUB_SOUNDS_DATA: readonly PubSound[] = [
  // Automobile
  { id: 'citroen', file: 'citroen.mp3', label: 'Citroën', category: 'automobile' },
  { id: 'peugeot', file: 'peugeot.mp3', label: 'Peugeot', category: 'automobile' },
  { id: 'renault', file: 'renault.mp3', label: 'Renault', category: 'automobile' },
  { id: 'speedy', file: 'speedy.mp3', label: 'Speedy', category: 'automobile' },
  {
    id: 'direct-assurance',
    file: 'directassurance.mp3',
    label: 'Direct Assurance',
    category: 'automobile',
  },

  // Enseignes & retail
  { id: 'carrefour', file: 'carrefour.mp3', label: 'Carrefour', category: 'retail' },
  { id: 'leclerc', file: 'leclerc.mp3', label: 'E.Leclerc', category: 'retail' },
  { id: 'intermarche', file: 'intermarche.mp3', label: 'Intermarché', category: 'retail' },
  { id: 'darty', file: 'Darty.mp3', label: 'Darty', category: 'retail' },
  { id: 'ikea', file: 'Ikea.mp3', label: 'Ikea', category: 'retail' },
  { id: 'decathlon', file: 'decathlon.mp3', label: 'Décathlon', category: 'retail' },
  {
    id: 'generale-optique',
    file: 'generaledoptique.mp3',
    label: "Générale d'Optique",
    category: 'retail',
  },
  {
    id: 'optical-center',
    file: 'opticalcenter.mp3',
    label: 'Optical Center',
    category: 'retail',
  },

  // Tech, consoles & opérateurs
  { id: 'apple', file: 'applesonnerie.mp3', label: 'Apple', category: 'tech' },
  { id: 'intel', file: 'intel.mp3', label: 'Intel', category: 'tech' },
  {
    id: 'samsung',
    file: 'samsungnotification.mp3',
    label: 'Samsung',
    category: 'tech',
  },
  { id: 'lg', file: 'lg.mp3', label: 'LG', category: 'tech' },
  {
    id: 'nintendo-switch',
    file: 'nintendoswitch.mp3',
    label: 'Nintendo Switch',
    category: 'tech',
  },
  { id: 'playstation-5', file: 'ps5startup.mp3', label: 'PlayStation 5', category: 'tech' },
  { id: 'xbox-360', file: 'xbox360.mp3', label: 'Xbox 360', category: 'tech' },
  {
    id: 'windows-xp',
    file: 'windowsxpstartup.mp3',
    label: 'Windows XP',
    category: 'tech',
  },
  { id: 'orange', file: 'Orange.mp3', label: 'Orange', category: 'tech' },
  { id: 'sfr', file: 'sfr.mp3', label: 'SFR', category: 'tech' },
  {
    id: 'bouygues-telecom',
    file: 'bouyguestelecom.mp3',
    label: 'Bouygues Telecom',
    category: 'tech',
  },

  // Alimentation & restauration
  { id: 'haribo', file: 'haribo.mp3', label: 'Haribo', category: 'food' },
  { id: 'kinder', file: 'kinder.mp3', label: 'Kinder', category: 'food' },
  {
    id: 'mcdonalds',
    file: 'mcdonaldsjingle.mp3',
    label: "McDonald's",
    category: 'food',
  },
  { id: 'nespresso', file: 'nespresso.mp3', label: 'Nespresso', category: 'food' },
  { id: 'lactel', file: 'lactel.mp3', label: 'Lactel', category: 'food' },

  // Médias, streaming & cinéma
  {
    id: '20th-century-fox',
    file: '20thcenturyfoxdrumonly.mp3',
    label: '20th Century Fox',
    category: 'media',
  },
  {
    id: 'amazon-prime-video',
    file: 'amazonprimevideo.mp3',
    label: 'Amazon Prime Video',
    category: 'media',
  },
  { id: 'canal-plus', file: 'Canal+.mp3', label: 'Canal+', category: 'media' },
  { id: 'disney-plus', file: 'disneyplus.mp3', label: 'Disney+', category: 'media' },
  { id: 'dreamworks', file: 'Dreamworks.mp3', label: 'DreamWorks', category: 'media' },
  {
    id: 'netflix',
    file: 'nouveau-jingle-netflix.mp3',
    label: 'Netflix',
    category: 'media',
  },
  {
    id: 'walt-disney-pictures',
    file: 'waltdisneypicture.mp3',
    label: 'Walt Disney Pictures',
    category: 'media',
  },
  { id: 'france-info', file: 'franceinfo.mp3', label: 'France Info', category: 'media' },
  { id: 'jt-tf1', file: 'JTTF1.mp3', label: 'JT TF1', category: 'media' },
  { id: 'rtl', file: 'rtl.mp3', label: 'RTL', category: 'media' },
  { id: 'tiktok', file: 'tiktok.mp3', label: 'TikTok', category: 'media' },

  // Divers & services
  { id: 'sncf', file: 'sncfjingle.mp3', label: 'SNCF', category: 'services' },
  { id: 'ratp', file: 'ratp.mp3', label: 'RATP', category: 'services' },
  { id: 'fdj', file: 'francaisedesjeux.mp3', label: 'FDJ', category: 'services' },
  { id: 'maaf', file: 'maaf.mp3', label: 'MAAF', category: 'services' },
  { id: 'duracell', file: 'duracell.mp3', label: 'Duracell', category: 'services' },
  { id: 'ubisoft', file: 'ubisoft.mp3', label: 'Ubisoft', category: 'services' },
  { id: 'thx', file: 'thx.mp3', label: 'THX', category: 'services' },
  {
    id: 'gta-rockstar',
    file: 'gtasoundvictory.mp3',
    label: 'GTA / Rockstar',
    category: 'services',
  },
];

export const PUB_SOUNDS: readonly PubSoundEntry[] = PUB_SOUNDS_DATA.map((sound) => ({
  ...sound,
  audioUrl: relativeUrl(`/pub/${sound.file}`),
}));
