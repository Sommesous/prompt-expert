// === GÉNÉRATEUR DE PROMPTS ===
// Construit le prompt final à partir des réponses collectées

import { QuestionAnswer, PromptMode, SummaryItem } from './types';

interface PromptSection {
  title: string;
  content: string;
}

/**
 * Génère le prompt final à partir des données collectées
 */
export function generatePrompt(
  idea: string,
  answers: QuestionAnswer[],
  mode: PromptMode,
  targetAI: string
): string {
  const sections: PromptSection[] = [];

  // Extraire les informations des réponses
  const info = extractInfo(answers);

  // === SECTION RÔLE ===
  const role = buildRole(info, idea);
  if (role) sections.push({ title: 'RÔLE', content: role });

  // === SECTION OBJECTIF ===
  sections.push({ title: 'OBJECTIF', content: buildObjective(idea, info) });

  // === SECTION CONTEXTE ===
  if (info.contexte || mode !== 'rapide') {
    const ctx = buildContext(info);
    if (ctx) sections.push({ title: 'CONTEXTE', content: ctx });
  }

  // === SECTION INSTRUCTIONS ===
  const instructions = buildInstructions(info, mode);
  if (instructions) sections.push({ title: 'INSTRUCTIONS', content: instructions });

  // === SECTION DONNÉES ===
  if (info.donnees) {
    sections.push({ title: 'DONNÉES DISPONIBLES', content: info.donnees });
  }

  // === SECTION CONTRAINTES ===
  if (info.contraintes && mode !== 'rapide') {
    sections.push({ title: 'CONTRAINTES', content: info.contraintes });
  }

  // === SECTION FORMAT DE SORTIE ===
  if (info.format) {
    sections.push({ title: 'FORMAT DE SORTIE', content: info.format });
  }

  // === SECTION CRITÈRES DE QUALITÉ ===
  if (info.qualite && mode === 'expert') {
    sections.push({ title: 'CRITÈRES DE QUALITÉ', content: info.qualite });
  }

  // === SECTION VÉRIFICATIONS (mode expert uniquement) ===
  if (mode === 'expert') {
    sections.push({
      title: 'VÉRIFICATIONS',
      content: 'Avant de fournir ta réponse, vérifie :\n- La cohérence de l\'ensemble.\n- L\'absence de contradictions.\n- Que toutes les exigences sont respectées.\n- Que le format demandé est bien suivi.',
    });
  }

  // Assembler le prompt
  return assemblePrompt(sections, mode);
}

/**
 * Extrait les informations structurées des réponses
 */
function extractInfo(answers: QuestionAnswer[]): Record<string, string> {
  const info: Record<string, string> = {};

  for (const answer of answers) {
    if (answer.skipped) continue;

    const parts: string[] = [];

    // Récupérer les labels des options sélectionnées
    if (answer.selectedOptions.length > 0) {
      parts.push(answer.selectedOptions.join(', '));
    }

    // Ajouter le texte libre
    if (answer.freeText.trim()) {
      parts.push(answer.freeText.trim());
    }

    if (parts.length === 0) continue;

    const value = parts.join('. ');

    switch (answer.questionId) {
      case 'q_objectif': info.objectif = value; break;
      case 'q_contexte': info.contexte = value; break;
      case 'q_public': info.public = value; break;
      case 'q_format': info.format = value; break;
      case 'q_donnees': info.donnees = value; break;
      case 'q_contraintes': info.contraintes = value; break;
      case 'q_qualite': info.qualite = value; break;
      case 'q_donnees_type': info.typesDonnees = value; break;
      case 'q_redaction_type': info.typeRedaction = value; break;
      case 'q_tech_stack': info.technologies = value; break;
      default:
        // Questions générées par l'IA
        info[answer.questionId] = value;
    }
  }

  return info;
}

/**
 * Construit la section rôle
 */
function buildRole(info: Record<string, string>, idea: string): string | null {
  const roles: string[] = [];

  if (info.objectif?.includes('analyser') || info.typesDonnees) {
    roles.push('analyste de données expérimenté');
  }
  if (info.objectif?.includes('rédiger') || info.typeRedaction) {
    roles.push('rédacteur professionnel');
  }
  if (info.objectif?.includes('développer') || info.technologies) {
    roles.push('développeur senior');
  }
  if (info.objectif?.includes('planifier')) {
    roles.push('chef de projet');
  }
  if (info.objectif?.includes('comparer')) {
    roles.push('consultant spécialisé');
  }

  if (roles.length === 0) {
    // Déduire un rôle général
    return 'Tu es un assistant expert et rigoureux.';
  }

  return `Tu es un ${roles.join(' et ')}.`;
}

/**
 * Construit la section objectif
 */
function buildObjective(idea: string, info: Record<string, string>): string {
  let objective = idea;

  if (info.objectif && !idea.toLowerCase().includes(info.objectif.toLowerCase().slice(0, 20))) {
    objective += `\n\nPlus précisément : ${info.objectif}`;
  }

  if (info.public && info.public !== 'moi') {
    objective += `\n\nLe résultat est destiné à : ${info.public}.`;
  }

  return objective;
}

/**
 * Construit la section contexte
 */
function buildContext(info: Record<string, string>): string | null {
  const parts: string[] = [];

  if (info.contexte) parts.push(`Environnement : ${info.contexte}`);
  if (info.typesDonnees) parts.push(`Type de données : ${info.typesDonnees}`);
  if (info.technologies) parts.push(`Technologies : ${info.technologies}`);
  if (info.typeRedaction) parts.push(`Type de rédaction : ${info.typeRedaction}`);

  return parts.length > 0 ? parts.join('\n') : null;
}

/**
 * Construit les instructions spécifiques
 */
function buildInstructions(info: Record<string, string>, mode: PromptMode): string | null {
  const instructions: string[] = [];

  if (mode === 'expert') {
    instructions.push('Procède étape par étape.');
    instructions.push('Explique ton raisonnement.');
  }

  if (mode === 'rapide') {
    instructions.push('Sois concis et va droit au but.');
  }

  // Ajouter les textes libres des réponses "conseille-moi"
  // (qui ont été marquées comme hypothèses)

  return instructions.length > 0 ? instructions.join('\n') : null;
}

/**
 * Assemble les sections en prompt final
 */
function assemblePrompt(sections: PromptSection[], mode: PromptMode): string {
  if (mode === 'rapide' && sections.length <= 2) {
    // Mode rapide : tout en un paragraphe
    return sections.map(s => s.content).join('\n\n');
  }

  // Modes équilibré et expert : sections numérotées
  return sections
    .map((s, i) => {
      if (mode === 'equilibre') {
        return `## ${s.title}\n${s.content}`;
      }
      return `## ${i + 1}. ${s.title}\n\n${s.content}`;
    })
    .join('\n\n');
}

/**
 * Génère un titre automatique pour le prompt
 */
export function generateTitle(idea: string): string {
  // Prend les 60 premiers caractères de l'idée
  const clean = idea.replace(/\n/g, ' ').trim();
  if (clean.length <= 60) return clean;
  return clean.slice(0, 57) + '...';
}
