// === COUCHE D'ABSTRACTION IA ===
// Gère les appels à l'API Gemini (tier gratuit)
// Les clés API restent côté serveur (API Routes)

import { AdaptiveQuestion, QuestionAnswer } from './types';

/**
 * Demande à l'IA de générer des questions adaptatives
 * Appelle l'API route côté serveur pour protéger la clé
 */
export async function generateAIQuestions(
  idea: string,
  previousAnswers: QuestionAnswer[]
): Promise<AdaptiveQuestion[]> {
  try {
    const response = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea, previousAnswers }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    return data.questions || [];
  } catch (error) {
    console.error('Erreur lors de la génération des questions IA:', error);
    return [];
  }
}

/**
 * Demande à l'IA d'analyser les réponses et détecter les problèmes
 */
export async function analyzeWithAI(
  idea: string,
  answers: QuestionAnswer[]
): Promise<{ issues: string[]; suggestions: string[] }> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea, answers }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur d\'analyse IA:', error);
    return { issues: [], suggestions: [] };
  }
}

/**
 * Demande à l'IA d'optimiser un prompt
 */
export async function optimizePromptWithAI(
  prompt: string,
  mode: string
): Promise<string> {
  try {
    const response = await fetch('/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, mode }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    return data.optimizedPrompt || prompt;
  } catch (error) {
    console.error('Erreur d\'optimisation:', error);
    return prompt;
  }
}
