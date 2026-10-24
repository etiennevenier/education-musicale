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
