import { afterEach, describe, expect, it } from 'vitest';
import { setupMainTabs } from '../src/utils/tabs';

function build(panelAttr: 'data-panel' | 'data-main-panel' = 'data-panel'): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = `
    <div class="main-tabs" role="tablist">
      <button class="main-tab is-active" data-main-tab="a" aria-selected="true">A</button>
      <button class="main-tab" data-main-tab="b" aria-selected="false">B</button>
      <button class="main-tab" data-main-tab="c" aria-selected="false">C</button>
    </div>
    <section class="panel" ${panelAttr}="a">A</section>
    <section class="panel" ${panelAttr}="b" hidden>B</section>
    <section class="panel" ${panelAttr}="c" hidden>C</section>`;
  document.body.append(root);
  return root;
}

const visible = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>('.panel')).filter((p) => !p.hidden).map((p) => p.textContent);

afterEach(() => {
  document.body.innerHTML = '';
  history.replaceState(null, '', '/');
});

describe('setupMainTabs', () => {
  it('fonctionne comme avant par défaut (data-panel, adresse inchangée)', () => {
    const root = build();
    setupMainTabs(root, { panelSelector: '.panel' });
    root.querySelector<HTMLButtonElement>('[data-main-tab="b"]')!.click();
    expect(visible(root)).toEqual(['B']);
    expect(window.location.hash).toBe('');
  });

  it('lit data-main-panel avec panelKey', () => {
    const root = build('data-main-panel');
    setupMainTabs(root, { panelSelector: '.panel', panelKey: 'mainPanel' });
    root.querySelector<HTMLButtonElement>('[data-main-tab="c"]')!.click();
    expect(visible(root)).toEqual(['C']);
  });

  it('syncHash : rouvre l’onglet de l’adresse et la met à jour', () => {
    history.replaceState(null, '', '#c');
    const root = build();
    setupMainTabs(root, { panelSelector: '.panel', syncHash: true });
    expect(visible(root)).toEqual(['C']);
    root.querySelector<HTMLButtonElement>('[data-main-tab="a"]')!.click();
    expect(window.location.hash).toBe('#a');
  });

  it('flèches haut/bas comme gauche/droite', () => {
    const root = build();
    setupMainTabs(root, { panelSelector: '.panel' });
    const first = root.querySelector<HTMLButtonElement>('[data-main-tab="a"]')!;
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(visible(root)).toEqual(['B']);
    root
      .querySelector<HTMLButtonElement>('[data-main-tab="b"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(visible(root)).toEqual(['A']);
  });
});
