import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { settleAnimations } from './axeSettle';

export interface HeadingViolation {
  page: string;
  state: string;
  rule: string;
  target: string;
  html: string;
  help: string;
}

/**
 * Vérifie la structure des titres : `heading-order` (pas de saut de niveau dans
 * l'ordre du DOM) et `page-has-heading-one` (un h1 dans l'arbre d'accessibilité).
 *
 * Les titres masqués (`display:none`, panneaux inactifs) sont ignorés par axe :
 * c'est exactement ce que perçoit un lecteur d'écran.
 */
export async function scanHeadings(
  page: Page,
  pagePath: string,
  state: string,
  results: HeadingViolation[],
): Promise<void> {
  try {
    await settleAnimations(page);
    const res = await new AxeBuilder({ page })
      .withRules(['heading-order', 'page-has-heading-one'])
      .analyze();
    for (const v of res.violations) {
      for (const n of v.nodes) {
        results.push({
          page: pagePath,
          state,
          rule: v.id,
          target: (n.target ?? []).join(' '),
          html: (n.html ?? '').slice(0, 160),
          help: v.help,
        });
      }
    }
  } catch (error) {
    results.push({
      page: pagePath,
      state,
      rule: 'ERREUR_AXE',
      target: '',
      html: '',
      help: String(error),
    });
  }
}
