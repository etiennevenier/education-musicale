import { describe, expect, it } from 'vitest';
import { createAudioQuestionBox, createInstrumentSearchBox, h } from '../src/utils/dom';

describe('h', () => {
  it('crée un élément avec attributs et enfants', () => {
    const el = h('div', { class: 'a', 'data-x': 3 }, 'texte ', h('strong', {}, 'fort'));
    expect(el.className).toBe('a');
    expect(el.dataset.x).toBe('3');
    expect(el.textContent).toBe('texte fort');
    expect(el.querySelector('strong')?.textContent).toBe('fort');
  });

  it('ne pose pas un attribut à false et pose un attribut vide à true', () => {
    const el = h('button', { disabled: true, hidden: false });
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(el.getAttribute('disabled')).toBe('');
    expect(el.hasAttribute('hidden')).toBe(false);
  });

  it('traite le texte comme du texte, jamais comme du HTML', () => {
    const el = h('p', {}, '<img src=x onerror=alert(1)>');
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent).toBe('<img src=x onerror=alert(1)>');
  });
});

describe('createInstrumentSearchBox', () => {
  it('reproduit le gabarit de saisie avec suggestions', () => {
    const box = createInstrumentSearchBox();
    expect(box.className).toBe('search-box');
    expect(box.querySelector('.search-row > input.search-input')).not.toBeNull();
    expect(box.querySelector('.search-row > button.btn-validate')?.textContent).toBe('Valider');
    const list = box.querySelector('ul.search-list');
    expect(list?.classList.contains('hidden')).toBe(true);
    expect(list?.getAttribute('role')).toBe('listbox');
    expect(box.querySelector('input')?.getAttribute('aria-label')).toBe("Nom de l'instrument");
  });
});

describe('createAudioQuestionBox', () => {
  it('construit consigne + bouton d’écoute', () => {
    const box = createAudioQuestionBox(['Écoute le ', h('strong', {}, 'thème')], '🔊 Écouter', 'btnX', 'button');
    expect(box.className).toBe('audio-q-box');
    expect(box.querySelector('p')?.textContent).toBe('Écoute le thème');
    const button = box.querySelector('button');
    expect(button?.id).toBe('btnX');
    expect(button?.className).toBe('btn-play-sound');
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.textContent).toBe('🔊 Écouter');
  });

  it('ne pose pas type quand il n’est pas demandé', () => {
    const box = createAudioQuestionBox(['x'], 'y', 'btnY');
    expect(box.querySelector('button')?.hasAttribute('type')).toBe(false);
  });
});
