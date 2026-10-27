/**
 * Mélange de Fisher-Yates : renvoie une copie mélangée, sans modifier le tableau d'origine.
 * Utilisé par tous les quiz du site (remplace les copies locales de `shuffle`).
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/**
 * Mélange les enfants d'un conteneur (un seul appel à shuffle, donc autant
 * d'appels à Math.random qu'un mélange de tableau de même taille), les réinsère
 * dans l'ordre mélangé et renvoie la liste mélangée.
 */
export function shuffleChildren(container: HTMLElement): HTMLElement[] {
  const children = shuffle(Array.from(container.children) as HTMLElement[]);
  children.forEach((child) => container.appendChild(child));
  return children;
}
