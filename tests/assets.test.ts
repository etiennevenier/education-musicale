import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { operaQuestions } from '../src/data/operaData';
import { ostinatoQuestions } from '../src/data/ostinatoData';
import { plansSonoresList } from '../src/data/plansSonoresData';
import { PUB_SOUNDS } from '../src/data/pubSounds';
import { fuzeauInstruments } from '../src/data/fuzeauInstruments';
import { SONGS } from '../src/data/engagementSongs';
import { medievalInstruments, musicTypes, utQueantLaxisMedia } from '../src/data/moyenAgeData';
import { gifs, musics } from '../src/data/laboCinematiqueData';
import { tracks as bruitomaticTracks } from '../src/data/bruitomaticData';
import { items as rockStageItems } from '../src/data/rockStageData';
import { jazzChorusAudioFiles } from '../src/data/jazzChorusAudio';

const ROOT = process.cwd();
const PUBLIC = join(ROOT, 'public');
const SRC = join(ROOT, 'src');

type Ref = { source: string; path: string };

const refs: Ref[] = [];
const add = (source: string, path: string | undefined | null) => {
  if (path) refs.push({ source, path });
};

// --- Données : chemins construits à partir des exports, jamais retapés -------
operaQuestions.forEach((question, index) => add(`operaData[${index}]`, question.audioUrl));
ostinatoQuestions.forEach((question, index) => add(`ostinatoData[${index}]`, question.audioUrl));
plansSonoresList.forEach((item, index) => add(`plansSonoresData[${index}]`, item.audioUrl));
PUB_SOUNDS.forEach((sound) => add(`pubSounds.${sound.id}`, sound.audioUrl));
fuzeauInstruments.forEach((instrument) => {
  add(`fuzeauInstruments.${instrument.id}.audio`, instrument.audioUrl);
  add(`fuzeauInstruments.${instrument.id}.image`, instrument.imageUrl);
});
SONGS.forEach((song) => add(`engagementSongs.${song.id}`, song.illustrationUrl));
musicTypes.forEach((musicType) => add(`moyenAgeData.musicTypes.${musicType.id}`, musicType.audioUrl));
medievalInstruments.forEach((instrument) => add(`moyenAgeData.instruments.${instrument.id}`, instrument.image));
add('moyenAgeData.utQueantLaxis.audio', utQueantLaxisMedia.audioUrl);
add('moyenAgeData.utQueantLaxis.score', utQueantLaxisMedia.scoreImage);
// Préfixes identiques à ceux des composants : /cinema (LaboCinematique),
// /bruits (Bruitomatic), /rock/quizrock (RockStageBuilder), /jazz (JazzChorusQuiz).
gifs.forEach((gif) => add(`laboCinematiqueData.gif.${gif.id}`, `/cinema/${gif.file}`));
musics.forEach((music) => add(`laboCinematiqueData.music.${music.id}`, `/cinema/${music.file}`));
bruitomaticTracks.forEach((track) => add(`bruitomaticData.${track.id}`, `/bruits/${track.file}`));
rockStageItems.forEach((item) => add(`rockStageData.${item.id}`, `/rock/quizrock/${item.file}`));
jazzChorusAudioFiles.forEach((file, index) => add(`jazzChorusAudio[${index}]`, `/jazz/${file}`));

// --- Littéraux de chemins publics dans src/**/*.astro|ts --------------------
const ASSET = /\.(?:mp3|mp4|wav|ogg|jpg|jpeg|png|gif|webp|svg|ico)$/i;
const LITERAL = /['"`](\/[^'"`\s]+)['"`]/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(astro|ts)$/.test(entry)) out.push(full);
  }
  return out;
}

for (const file of walk(SRC)) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(LITERAL)) {
    const candidate = match[1] ?? '';
    if (!ASSET.test(candidate) || candidate.includes('//')) continue;
    add(`${relative(ROOT, file)} : ${candidate}`, candidate);
  }
}

const BASE_URL = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

function toPublicPath(path: string): string {
  const withoutQuery = path.split('?')[0]!.split('#')[0]!;
  const decoded = decodeURIComponent(withoutQuery);
  return BASE_URL && decoded.startsWith(`${BASE_URL}/`) ? decoded.slice(BASE_URL.length) : decoded;
}

/** Existence avec comparaison EXACTE segment par segment (casse et NFC/NFD). */
function lookup(publicPath: string): { ok: boolean; detail: string } {
  const segments = toPublicPath(publicPath).split('/').filter(Boolean);
  if (segments.length === 0) return { ok: false, detail: 'chemin vide' };

  let dir = PUBLIC;
  for (const [index, segment] of segments.entries()) {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return { ok: false, detail: `dossier introuvable : ${relative(ROOT, dir)}` };
    }

    if (entries.includes(segment)) {
      dir = join(dir, segment);
      continue;
    }

    const nfc = segment.normalize('NFC');
    const variant = entries.find((entry) => entry.normalize('NFC').toLowerCase() === nfc.toLowerCase());
    if (!variant) {
      return { ok: false, detail: `absent dans public/${relative(PUBLIC, dir)} : ${JSON.stringify(segment)}` };
    }

    const kind = index === segments.length - 1 ? 'fichier' : 'dossier';
    const sameLetters = variant.toLowerCase() === segment.toLowerCase();
    const sameNormalized = variant.normalize('NFC').toLowerCase() === nfc.toLowerCase();
    const reason = sameLetters ? 'casse differente' : sameNormalized ? 'NFC/NFD different' : 'nom different';
    return {
      ok: false,
      detail: `${reason} (${kind}) : attendu ${JSON.stringify(segment)}, present ${JSON.stringify(variant)}`,
    };
  }

  return { ok: true, detail: '' };
}

describe('assets publics', () => {
  it('chaque chemin référencé existe dans public/ avec le nom exact', () => {
    const unique = new Map<string, string[]>();
    for (const ref of refs) {
      const list = unique.get(ref.path) ?? [];
      list.push(ref.source);
      unique.set(ref.path, list);
    }

    const problems: string[] = [];
    for (const [path, sources] of unique) {
      const result = lookup(path);
      if (!result.ok) problems.push(`${path} → ${result.detail} (source : ${sources[0]})`);
    }

    console.log(`chemins publics référencés : ${unique.size} (${refs.length} références)`);
    for (const problem of problems) console.log(`  MANQUANT ${problem}`);

    expect(problems).toEqual([]);
  });

  it('le contrôle détecte bien une casse ou un nom différent', () => {
    // Auto-test du garde-fou : le fichier existe, mais pas sous cette forme.
    expect(lookup('/cinema/gifjoyeux.gif').ok).toBe(true);
    expect(lookup('/cinema/Gifjoyeux.gif').ok).toBe(false);
    expect(lookup('/cinema/Gifjoyeux.gif').detail).toContain('casse differente');
    expect(lookup('/cinema/inexistant.gif').ok).toBe(false);
  });
});
