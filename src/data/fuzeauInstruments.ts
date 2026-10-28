export interface Instrument {
  id: string;
  name: string;
  level: 'vert' | 'jaune' | 'rouge';
  audioUrl: string;
  imageUrl: string;
}

export const fuzeauInstruments: Instrument[] = [
  // --- 1 VERT ---
  { id: 'violon', name: 'Violon', level: 'vert', audioUrl: '/fuzeau/1-vert/01-violon.mp3', imageUrl: '/fuzeau/1-vert/01-violon.jpg' },
  { id: 'guitare-classique', name: 'Guitare classique', level: 'vert', audioUrl: '/fuzeau/1-vert/05-guitare-classique.mp3', imageUrl: '/fuzeau/1-vert/05-guitare-classique.jpg' },
  { id: 'harpe', name: 'Harpe', level: 'vert', audioUrl: '/fuzeau/1-vert/06-harpe.mp3', imageUrl: '/fuzeau/1-vert/06-harpe.jpg' },
  { id: 'piano', name: 'Piano', level: 'vert', audioUrl: '/fuzeau/1-vert/10-piano.mp3', imageUrl: '/fuzeau/1-vert/10-piano.jpg' },
  { id: 'trompette', name: 'Trompette', level: 'vert', audioUrl: '/fuzeau/1-vert/11-trompette.mp3', imageUrl: '/fuzeau/1-vert/11-trompette.jpg' },
  { id: 'harmonica', name: 'Harmonica', level: 'vert', audioUrl: '/fuzeau/1-vert/23-harmonica.mp3', imageUrl: '/fuzeau/1-vert/23-harmonica.jpg' },
  { id: 'guiro', name: 'Guiro', level: 'vert', audioUrl: '/fuzeau/1-vert/26-guiro.mp3', imageUrl: '/fuzeau/1-vert/26-guiro.jpg' },
  { id: 'triangle', name: 'Triangle', level: 'vert', audioUrl: '/fuzeau/1-vert/27-triangle.mp3', imageUrl: '/fuzeau/1-vert/27-triangle.jpg' },
  { id: 'cymbales', name: 'Cymbales', level: 'vert', audioUrl: '/fuzeau/1-vert/29-cymbales.mp3', imageUrl: '/fuzeau/1-vert/29-cymbales.jpg' },
  { id: 'xylophone', name: 'Xylophone', level: 'vert', audioUrl: '/fuzeau/1-vert/31-xylophone.mp3', imageUrl: '/fuzeau/1-vert/31-xylophone.jpg' },
  { id: 'djembe', name: 'Djembé', level: 'vert', audioUrl: '/fuzeau/1-vert/34-djembe.mp3', imageUrl: '/fuzeau/1-vert/34-djembe.jpg' },
  { id: 'caisse-claire', name: 'Caisse claire', level: 'vert', audioUrl: '/fuzeau/1-vert/36-caisse-claire.mp3', imageUrl: '/fuzeau/1-vert/36-caisse-claire.jpg' },

  // --- 2 JAUNE ---
  { id: 'contrebasse', name: 'Contrebasse', level: 'jaune', audioUrl: '/fuzeau/2-jaune/03-contrebasse.mp3', imageUrl: '/fuzeau/2-jaune/03-contrebasse.jpg' },
  { id: 'clavecin', name: 'Clavecin', level: 'jaune', audioUrl: '/fuzeau/2-jaune/04-clavecin.mp3', imageUrl: '/fuzeau/2-jaune/04-clavecin.jpg' },
  { id: 'banjo', name: 'Banjo', level: 'jaune', audioUrl: '/fuzeau/2-jaune/07-banjo.mp3', imageUrl: '/fuzeau/2-jaune/07-banjo.jpg' },
  { id: 'guitare-electrique', name: 'Guitare électrique', level: 'jaune', audioUrl: '/fuzeau/2-jaune/09-guitare-electrique.mp3', imageUrl: '/fuzeau/2-jaune/09-guitare-electrique.jpg' },
  { id: 'flute-traversiere', name: 'Flûte traversière', level: 'jaune', audioUrl: '/fuzeau/2-jaune/15-flute-traversiere.mp3', imageUrl: '/fuzeau/2-jaune/15-flute-traversiere.jpg' },
  { id: 'flute-a-bec', name: 'Flûte à bec', level: 'jaune', audioUrl: '/fuzeau/2-jaune/16-flute-a-bec.mp3', imageUrl: '/fuzeau/2-jaune/16-flute-a-bec.jpg' },
  { id: 'flute-de-pan', name: 'Flûte de Pan', level: 'jaune', audioUrl: '/fuzeau/2-jaune/17-flute-de-pan.mp3', imageUrl: '/fuzeau/2-jaune/17-flute-de-pan.jpg' },
  { id: 'clarinette', name: 'Clarinette', level: 'jaune', audioUrl: '/fuzeau/2-jaune/21-clarinette.mp3', imageUrl: '/fuzeau/2-jaune/21-clarinette.jpg' },
  { id: 'saxophone', name: 'Saxophone', level: 'jaune', audioUrl: '/fuzeau/2-jaune/22-saxophone.mp3', imageUrl: '/fuzeau/2-jaune/22-saxophone.jpg' },
  { id: 'accordeon', name: 'Accordéon', level: 'jaune', audioUrl: '/fuzeau/2-jaune/24-accordeon.mp3', imageUrl: '/fuzeau/2-jaune/24-accordeon.jpg' },
  { id: 'guimbarde', name: 'Guimbarde', level: 'jaune', audioUrl: '/fuzeau/2-jaune/30-guimbarde.mp3', imageUrl: '/fuzeau/2-jaune/30-guimbarde.jpg' },
  { id: 'balafon', name: 'Balafon', level: 'jaune', audioUrl: '/fuzeau/2-jaune/32-balafon.mp3', imageUrl: '/fuzeau/2-jaune/32-balafon.jpg' },

  // --- 3 ROUGE ---
  { id: 'violoncelle', name: 'Violoncelle', level: 'rouge', audioUrl: '/fuzeau/3-rouge/02-violoncelle.mp3', imageUrl: '/fuzeau/3-rouge/02-violoncelle.jpg' },
  { id: 'mandoline', name: 'Mandoline', level: 'rouge', audioUrl: '/fuzeau/3-rouge/08-mandoline.mp3', imageUrl: '/fuzeau/3-rouge/08-mandoline.jpg' },
  { id: 'cor', name: 'Cor', level: 'rouge', audioUrl: '/fuzeau/3-rouge/12-cor.mp3', imageUrl: '/fuzeau/3-rouge/12-cor.jpg' },
  { id: 'trombone', name: 'Trombone', level: 'rouge', audioUrl: '/fuzeau/3-rouge/13-trombone.mp3', imageUrl: '/fuzeau/3-rouge/13-trombone.jpg' },
  { id: 'tuba', name: 'Tuba', level: 'rouge', audioUrl: '/fuzeau/3-rouge/14-tuba.mp3', imageUrl: '/fuzeau/3-rouge/14-tuba.jpg' },
  { id: 'hautbois', name: 'Hautbois', level: 'rouge', audioUrl: '/fuzeau/3-rouge/18-hautbois.mp3', imageUrl: '/fuzeau/3-rouge/18-hautbois.jpg' },
  { id: 'basson', name: 'Basson', level: 'rouge', audioUrl: '/fuzeau/3-rouge/19-basson.mp3', imageUrl: '/fuzeau/3-rouge/19-basson.jpg' },
  { id: 'cornemuse', name: 'Cornemuse', level: 'rouge', audioUrl: '/fuzeau/3-rouge/20-cornemuse.mp3', imageUrl: '/fuzeau/3-rouge/20-cornemuse.jpg' },
  { id: 'orgue', name: 'Orgue', level: 'rouge', audioUrl: '/fuzeau/3-rouge/25-orgue.mp3', imageUrl: '/fuzeau/3-rouge/25-orgue.jpg' },
  { id: 'steel-drum', name: 'Steel Drum', level: 'rouge', audioUrl: '/fuzeau/3-rouge/28-steel-drum.mp3', imageUrl: '/fuzeau/3-rouge/28-steel-drum.jpg' },
  { id: 'vibraphone', name: 'Vibraphone', level: 'rouge', audioUrl: '/fuzeau/3-rouge/33-vibraphone.mp3', imageUrl: '/fuzeau/3-rouge/33-vibraphone.jpg' },
  { id: 'congas', name: 'Congas', level: 'rouge', audioUrl: '/fuzeau/3-rouge/35-congas.mp3', imageUrl: '/fuzeau/3-rouge/35-congas.jpg' }
];