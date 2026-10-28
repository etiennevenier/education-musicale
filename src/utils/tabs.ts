// src/utils/tabs.ts

export interface TabSetupOptions {
  tabSelector?: string;
  panelSelector?: string;
  before?: (tab: HTMLButtonElement) => void;
  after?: (tab: HTMLButtonElement) => void;
}

export interface TabsController {
  /** Sélectionne un onglet par son `data-main-tab`. */
  select(id: string): void;
}

let instanceCount = 0;

/**
 * Configure la navigation par onglets d'un composant de cours
 * (clic, flèches, Début/Fin, attributs ARIA, état initial cohérent).
 */
export function setupMainTabs(
  root: HTMLElement,
  options: TabSetupOptions = {},
): TabsController | null {
  const { tabSelector = '.main-tab', panelSelector = '[data-panel]', before, after } = options;
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>(tabSelector));
  const panels = Array.from(root.querySelectorAll<HTMLElement>(panelSelector));

  if (tabs.length === 0) return null;

  // ARIA : liens onglet <-> panneau (ids uniques par instance).
  const base = `tabs-${++instanceCount}`;
  tabs.forEach((tab) => {
    const id = tab.dataset.mainTab ?? '';
    const panel = panels.find((p) => p.dataset.panel === id);
    if (!tab.hasAttribute('role')) tab.setAttribute('role', 'tab');
    if (!tab.id) tab.id = `${base}-tab-${id}`;
    if (!panel) return;
    if (!panel.id) panel.id = `${base}-panel-${id}`;
    if (!panel.hasAttribute('role')) panel.setAttribute('role', 'tabpanel');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('aria-labelledby', tab.id);
  });

  const applySelection = (tab: HTMLButtonElement) => {
    tabs.forEach((item) => {
      const isActive = item === tab;
      item.setAttribute('aria-selected', isActive ? 'true' : 'false');
      item.tabIndex = isActive ? 0 : -1;
      item.classList.toggle('is-active', isActive);
    });

    const selectedTabId = tab.dataset.mainTab;
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== selectedTabId;
    });
  };

  const selectTab = (tab: HTMLButtonElement) => {
    before?.(tab);
    applySelection(tab);
    after?.(tab);
  };

  // État initial : onglet déjà actif dans le HTML, sinon le premier.
  const initial =
    tabs.find(
      (tab) => tab.classList.contains('is-active') || tab.getAttribute('aria-selected') === 'true',
    ) ?? tabs[0]!;
  applySelection(initial);

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));

    tab.addEventListener('keydown', (event) => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();

      let nextIndex = index;
      if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;

      const nextTab = tabs[nextIndex];
      if (nextTab) {
        nextTab.focus();
        selectTab(nextTab);
      }
    });
  });

  return {
    select(id: string) {
      const tab = tabs.find((item) => item.dataset.mainTab === id);
      if (tab) selectTab(tab);
    },
  };
}