/**
 * Dessin des clés de sol et de fa à partir du sprite <ClefSprite /> (tracés officiels
 * GKey.svg / FKey.svg) : plus aucun glyphe Unicode (U+1D11E / U+1D122), donc le même
 * rendu sur tous les appareils.
 *
 * Géométrie :
 *  - clé de fa : mesurée sur le tracé (les deux points encadrent la ligne de Fa, soit
 *    exactement 1 interligne = 5,84 unités du viewBox 18 x 20) ;
 *  - clé de sol : proportions de la clé SVG (7 interlignes de haut, ligne de Sol à 62 %
 *    de la hauteur). Si l'ajustement visuel ne convient pas, ne retoucher que
 *    TREBLE_SPACES et TREBLE_ANCHOR.
 */
const NS = 'http://www.w3.org/2000/svg';

export type ClefType = 'treble' | 'bass';

const TREBLE_VIEWBOX = { w: 640, h: 1280 };
const TREBLE_SPACES = 7.0; // hauteur de la clé de sol, en interlignes
const TREBLE_ANCHOR = 0.62; // part de la hauteur située au-dessus de la ligne de Sol

const BASS_VIEWBOX = { w: 18, h: 20 };
const BASS_UNITS_PER_SPACE = 5.84;
const BASS_ANCHOR = 6.05 / 20; // part de la hauteur située au-dessus de la ligne de Fa

/**
 * @param svg        portée cible
 * @param type       'treble' (ligne de repère = Sol, 2e depuis le bas) ou 'bass' (Fa, 4e)
 * @param x          bord gauche de la clé
 * @param refLineY   ordonnée de la ligne de repère
 * @param spacing    interligne (distance entre deux lignes)
 */
export function drawClefSymbol(
  svg: SVGElement,
  type: ClefType,
  x: number,
  refLineY: number,
  spacing: number,
  color = '#1e293b',
): SVGSVGElement {
  const treble = type === 'treble';
  const viewBox = treble ? TREBLE_VIEWBOX : BASS_VIEWBOX;
  const height = treble ? TREBLE_SPACES * spacing : (BASS_VIEWBOX.h * spacing) / BASS_UNITS_PER_SPACE;
  const width = (height * viewBox.w) / viewBox.h;
  const anchor = treble ? TREBLE_ANCHOR : BASS_ANCHOR;

  const clef = document.createElementNS(NS, 'svg');
  clef.setAttribute('x', String(x));
  clef.setAttribute('y', String(refLineY - anchor * height));
  clef.setAttribute('width', String(width));
  clef.setAttribute('height', String(height));
  clef.setAttribute('viewBox', '0 0 ' + viewBox.w + ' ' + viewBox.h);
  clef.setAttribute('overflow', 'visible');
  clef.setAttribute('aria-hidden', 'true');
  clef.setAttribute('focusable', 'false');
  clef.setAttribute('class', 'staff-clef staff-clef--' + type);
  clef.style.color = color;

  const use = document.createElementNS(NS, 'use');
  use.setAttribute('href', treble ? '#notes-clef-sol' : '#notes-clef-fa');
  clef.appendChild(use);
  svg.appendChild(clef);
  return clef;
}
