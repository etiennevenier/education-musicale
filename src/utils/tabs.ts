// src/utils/tabs.ts

export interface TabSetupOptions {
  tabSelector?: string;
  panelSelector?: string;
  /**
   * Nom (dataset) de l'attribut du panneau qui porte l'identifiant de son onglet :
   * `panel` = data-panel (par défaut), `mainPanel` = data-main-panel.
   */
  panelKey?: string;
  /** Garde l'onglet ouvert dans l'adresse (#id) et le rouvre au chargement de la page. */
  syncHash?: boolean;
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
  const {
    tabSelector = '.main-tab',
    panelSelector = '[data-panel]',
    panelKey = 'panel',
    syncHash = false,
    before,
    after,
  } = options;
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>(tabSelector));
  const panels = Array.from(root.querySelectorAll<HTMLElement>(panelSelector));

  if (tabs.length === 0) return null;

  // ARIA : liens onglet <-> panneau (ids uniques par instance).
  const base = `tabs-${++instanceCount}`;
  tabs.forEach((tab) => {
    const id = tab.dataset.mainTab ?? '';
    const panel = panels.find((p) => p.dataset[panelKey] === id);
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
      panel.hidden = panel.dataset[panelKey] !== selectedTabId;
    });
  };

  const selectTab = (tab: HTMLButtonElement) => {
    before?.(tab);
    applySelection(tab);
    if (syncHash && tab.dataset.mainTab) history.replaceState(null, '', `#${tab.dataset.mainTab}`);
    after?.(tab);
  };

  // État initial : onglet désigné par l'adresse (#id, si syncHash), sinon déjà
  // actif dans le HTML, sinon le premier.
  const fromHash = syncHash
    ? tabs.find((tab) => tab.dataset.mainTab && `#${tab.dataset.mainTab}` === window.location.hash)
    : undefined;
  const initial =
    fromHash ??
    tabs.find(
      (tab) => tab.classList.contains('is-active') || tab.getAttribute('aria-selected') === 'true',
    ) ??
    tabs[0]!;
  applySelection(initial);

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));

    tab.addEventListener('keydown', (event) => {
      // Haut/Bas aussi : sur téléphone, les onglets sont empilés en colonne.
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();

      let nextIndex = index;
      if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;

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