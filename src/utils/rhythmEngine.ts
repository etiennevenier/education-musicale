/**
 * Moteur de « Lecture rythmique » : figures, niveaux, génération, évaluation des frappes.
 * Logique pure (aucun DOM, aucun audio) ; `rng` injectable pour les tests.
 */

export type ElemType = 'quarter' | 'rest' | 'half' | 'eighths' | 'eighth_rest' | 'rest_eighth';
export type ElemDef = { len: number; hits: number[] };
export type LevelDef = { weights: Partial<Record<ElemType, number>>; required?: ElemType[]; startWithNote: boolean };
export type RhythmElement = { type: ElemType; start: number; len: number };
export type Rhythm = { ts: number; measures: number; totalBeats: number; elements: RhythmElement[]; hits: number[] };
export type Grade = 'perfect' | 'good' | 'off' | 'miss';
type TapPair = { i: number; j: number; d: number };
export type NoteResult = { exp: number; tap: number | null; grade: Grade; ms: number | null };
export type Evaluation = { notes: NoteResult[]; extras: number[]; perfect: number; good: number; bad: number; percent: number };

export const PERFECT_MS = 50;          // écart max pour « Parfait » (vert)
export const GOOD_MS = 100;            // écart max pour « Correct » (orange)
export const GOOD_WEIGHT = 0.7;        // score d'une note « correcte » (une note « parfaite » = 1)
export const EXTRA_PENALTY = 0.25;     // pénalité par frappe en trop (en « notes »)

export const ELEM: Record<ElemType, ElemDef> = {
    quarter:     { len: 1, hits: [0] },       // noire
    rest:        { len: 1, hits: [] },        // soupir
    half:        { len: 2, hits: [0] },       // blanche
    eighths:     { len: 1, hits: [0, 1] },    // 2 croches groupées sur un temps
    eighth_rest: { len: 1, hits: [0] },       // croche seule + demi-soupir
    rest_eighth: { len: 1, hits: [1] }        // demi-soupir + croche seule
};

export const LEVELS: Record<string, LevelDef> = {
    1: { weights: { quarter: 65, rest: 35 },
         required: ['rest'], startWithNote: true },
    2: { weights: { quarter: 50, rest: 22, half: 28 },
         required: ['half'], startWithNote: true },
    3: { weights: { quarter: 36, rest: 16, half: 20, eighths: 28 },
         required: ['eighths'], startWithNote: true },
    4: { weights: { quarter: 26, rest: 12, half: 14, eighths: 22, eighth_rest: 13, rest_eighth: 13 },
         required: ['eighth_rest', 'rest_eighth'], startWithNote: false }
};

function pickWeighted<T extends string>(weights: Partial<Record<T, number>>, rng: () => number = Math.random): T {
    const entries = Object.entries(weights) as [T, number][];
    let r = rng() * entries.reduce((s, e) => s + e[1], 0);
    for (const [k, w] of entries) { if ((r -= w) < 0) return k; }
    return entries[0][0];
}

/* Génère l'exercice mesure par mesure : on remplit chaque mesure avec des figures
   dont la durée totale est EXACTEMENT égale au nombre de temps du chiffrage (3 ou 4). */
export function generateRhythm(levelKey: string, beatsPerMeasure: number, measures: number, rng: () => number = Math.random): Rhythm {
    const lv = LEVELS[levelKey];
    const totalBeats = measures * beatsPerMeasure;
    const minHits = Math.ceil(totalBeats / 2.5);        // nombre minimum de sons à taper (3 pour 6 temps, 4 pour 8, 5 pour 12, 7 pour 16)
    // une blanche ne démarre que sur un temps « fort » (1 ou 3 en 4/4 ; 1 ou 2 en 3/4)
    const halfStarts: number[] = beatsPerMeasure === 4 ? [0, 2] : [0, 1];

    let elements: RhythmElement[] = [], hits: number[] = [], tries = 0;
    do {
        elements = [];
        for (let m = 0; m < measures; m++) {
            let pos = 0;
            while (pos < beatsPerMeasure) {
                const remaining = beatsPerMeasure - pos;
                const allowed: Partial<Record<ElemType, number>> = {};
                for (const k of Object.keys(lv.weights) as ElemType[]) {
                    if (ELEM[k].len > remaining) continue;                 // ne dépasse pas la barre de mesure
                    if (k === 'half' && !halfStarts.includes(pos)) continue;
                    allowed[k] = lv.weights[k] ?? 0;
                }
                const type = pickWeighted(allowed, rng);
                elements.push({ type, start: m * beatsPerMeasure + pos, len: ELEM[type].len });
                pos += ELEM[type].len;
            }
        }
        hits = [];
        elements.forEach(e => ELEM[e.type].hits.forEach(h => hits.push(e.start * 2 + h)));
        tries++;
    } while (!acceptable(elements, hits, lv, minHits) && tries < 3000);

    return { ts: beatsPerMeasure, measures, totalBeats, elements, hits };
}

function acceptable(elements: RhythmElement[], hits: number[], lv: LevelDef, minHits: number): boolean {
    if (hits.length < minHits) return false;
    if (lv.startWithNote && !ELEM[elements[0].type].hits.includes(0)) return false;       // commence par un son
    const required = lv.required;
    if (required && !elements.some(e => required.includes(e.type))) return false;         // contient la figure du niveau
    for (let i = 2; i < elements.length; i++) {                                           // pas 3 soupirs d'affilée
        if (elements[i].type === 'rest' && elements[i - 1].type === 'rest' && elements[i - 2].type === 'rest') return false;
    }
    return true;
}

export function evaluate(expected: number[], taps: number[], beatDur: number): Evaluation {
    const radius = Math.min(0.35, beatDur * 0.5);    // distance max pour associer une frappe à une note
    const pairs: TapPair[] = [];
    expected.forEach((e, i) => taps.forEach((t, j) => {
        const d = t - e;
        if (Math.abs(d) <= radius) pairs.push({ i, j, d });
    }));
    pairs.sort((a, b) => Math.abs(a.d) - Math.abs(b.d));   // on associe d'abord les paires les plus proches

    const noteTap: (TapPair | null)[] = expected.map(() => null);
    const usedTap: boolean[] = taps.map(() => false);
    pairs.forEach(p => {
        if (noteTap[p.i] === null && !usedTap[p.j]) { noteTap[p.i] = p; usedTap[p.j] = true; }
    });

    const notes: NoteResult[] = expected.map((e, i) => {
        const p = noteTap[i];
        if (!p) return { exp: e, tap: null, grade: 'miss', ms: null };
        const ms = p.d * 1000;
        const a = Math.abs(ms);
        return { exp: e, tap: taps[p.j], ms, grade: a <= PERFECT_MS ? 'perfect' : a <= GOOD_MS ? 'good' : 'off' };
    });
    const extras = taps.filter((_t, j) => !usedTap[j]);

    const perfect = notes.filter(n => n.grade === 'perfect').length;
    const good = notes.filter(n => n.grade === 'good').length;
    const bad = notes.length - perfect - good;               // trop tôt / trop tard / manquées
    const points = perfect + GOOD_WEIGHT * good - EXTRA_PENALTY * extras.length;
    const percent = Math.max(0, Math.min(100, Math.round(100 * points / notes.length)));
    return { notes, extras, perfect, good, bad, percent };
}

export const getVerdict = (percent: number): string =>
  percent >= 90 ? 'Excellent !' : percent >= 75 ? 'Bien joué !' : percent >= 50 ? 'Pas mal, encore un essai !' : 'On y retourne tranquillement.';
