// === ESTIMATION DES TOKENS ===
// Estimation approximative basée sur les règles courantes des tokenizers.
// Pour une estimation exacte, il faudrait le tokenizer spécifique de chaque modèle.

import { PromptStats } from './types';

/**
 * Estime le nombre de tokens d'un texte.
 * Règle empirique : ~1 token pour 4 caractères en anglais, ~1 token pour 3 caractères en français
 * (le français utilise plus de tokens car les mots sont en moyenne plus longs et accentués).
 *
 * ⚠️ Cette estimation a une marge d'erreur de ±15-25%.
 * Les chiffres exacts dépendent du tokenizer du modèle choisi.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Heuristique pour le français : environ 1 token pour 3.2 caractères
  return Math.ceil(text.length / 3.2);
}

/**
 * Calcule les statistiques complètes d'un prompt
 */
export function getPromptStats(text: string): PromptStats {
  return {
    charCount: text.length,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    tokenEstimate: estimateTokens(text),
    lineCount: text.split('\n').length,
  };
}

/**
 * Estime le coût approximatif en fonction du modèle et du nombre de tokens.
 * Les prix sont indicatifs et évoluent régulièrement.
 *
 * ⚠️ Les prix réels peuvent différer. Consultez la tarification officielle du fournisseur.
 */
export function estimateCost(tokens: number, model: string): { cost: string; note: string } {
  // Prix indicatifs par million de tokens en input (octobre 2024, susceptibles de changer)
  const prices: Record<string, { input: number; name: string }> = {
    'gpt-4o': { input: 2.5, name: 'GPT-4o' },
    'gpt-4o-mini': { input: 0.15, name: 'GPT-4o mini' },
    'claude-sonnet': { input: 3.0, name: 'Claude Sonnet' },
    'claude-haiku': { input: 0.25, name: 'Claude Haiku' },
    'gemini-flash': { input: 0.075, name: 'Gemini Flash' },
    'gemini-pro': { input: 1.25, name: 'Gemini Pro' },
  };

  const priceInfo = prices[model];
  if (!priceInfo) {
    return { cost: 'N/A', note: 'Modèle inconnu' };
  }

  const costUsd = (tokens / 1_000_000) * priceInfo.input;

  return {
    cost: costUsd < 0.001 ? '< $0.001' : `~$${costUsd.toFixed(4)}`,
    note: `Estimation pour ${priceInfo.name} en entrée uniquement. Le coût réel inclut aussi les tokens de sortie. Tarifs susceptibles d'évoluer.`,
  };
}
