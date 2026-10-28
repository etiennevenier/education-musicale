/**
 * Aides DOM partagées par les outils (remplace les copies locales de
 * mustElement, mustSvg, queryButtons et svgEl).
 */
const SVG_NS = 'http://www.w3.org/2000/svg';
export type SvgAttrs = Record<string, string | number>;

export function mustElement(selector: string, scope: ParentNode = document): HTMLElement {
  const el = scope.querySelector(selector);
  if (!(el instanceof HTMLElement)) throw new Error('Élément introuvable : ' + selector);
  return el;
}

export function mustInput(selector: string, scope: ParentNode = document): HTMLInputElement {
  const el = scope.querySelector(selector);
  if (!(el instanceof HTMLInputElement)) throw new Error('Champ introuvable : ' + selector);
  return el;
}

export function mustSvg(selector: string, scope: ParentNode = document): SVGSVGElement {
  const el = scope.querySelector(selector);
  if (!(el instanceof SVGSVGElement)) throw new Error('SVG introuvable : ' + selector);
  return el;
}

export function mustGroup(selector: string, scope: ParentNode = document): SVGGElement {
  const el = scope.querySelector(selector);
  if (!(el instanceof SVGGElement)) throw new Error('Groupe SVG introuvable : ' + selector);
  return el;
}

export function queryButtons(scope: ParentNode, selector: string): HTMLButtonElement[] {
  const found: HTMLButtonElement[] = [];
  scope.querySelectorAll(selector).forEach((el) => {
    if (el instanceof HTMLButtonElement) found.push(el);
  });
  return found;
}

/** Crée un élément SVG et lui applique ses attributs. */
export function svgEl(name: string, attrs: SvgAttrs = {}, parent?: SVGElement): SVGElement {
  const el = document.createElementNS(SVG_NS, name);
  if (!(el instanceof SVGElement)) throw new Error('Élément SVG invalide : ' + name);
  for (const key in attrs) el.setAttribute(key, String(attrs[key]));
  if (parent) parent.appendChild(el);
  return el;
}
