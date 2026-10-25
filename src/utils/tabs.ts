// src/utils/tabs.ts

export interface TabSetupOptions {
  panelSelector?: string;
  before?: (tab: HTMLButtonElement) => void;
  after?: (tab: HTMLButtonElement) => void;
}

/**
 * Configure la navigation par onglets pour un composant de cours.
 */
export function setupMainTabs(
  root: HTMLElement,
  options: TabSetupOptions = {}
): void {
  const { panelSelector = '[data-panel]', before, after } = options;
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('.main-tab'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>(panelSelector));

  if (tabs.length === 0) return;

  const selectTab = (tab: HTMLButtonElement) => {
    if (before) before(tab);

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

    if (after) after(tab);
  };

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
}