// === TYPES PRINCIPAUX DE PROMPT EXPERT ===

/** Mode de génération du prompt */
export type PromptMode = 'rapide' | 'equilibre' | 'expert';

/** Type de question dans le questionnaire */
export type QuestionType = 'checkbox' | 'radio';

/** Statut d'une information collectée */
export type InfoStatus = 'confirmed' | 'hypothesis' | 'unknown';

/** Catégorie de prompt */
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

/** Option de réponse pour une question */
export interface QuestionOption {
  id: string;
  label: string;
  description?: string;
}

/** Question adaptative */
export interface AdaptiveQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  placeholder?: string;
  required: boolean;
  helpText?: string;
}

/** Réponse à une question */
export interface QuestionAnswer {
  questionId: string;
  questionText: string;
  selectedOptions: string[];  // IDs des options cochées
  freeText: string;           // Texte libre (toujours disponible)
  skipped: boolean;
  adviseMeSelected: boolean;  // "Je ne sais pas, conseille-moi"
}

/** Élément du récapitulatif */
export interface SummaryItem {
  label: string;
  value: string;
  status: InfoStatus;
  editable: boolean;
}

/** Problème détecté (oubli, contradiction, ambiguïté) */
export interface DetectedIssue {
  type: 'missing' | 'contradiction' | 'ambiguity' | 'suggestion';
  severity: 'critical' | 'important' | 'minor';
  message: string;
  suggestion?: string;
}

/** Prompt sauvegardé */
export interface SavedPrompt {
  id: string;
  title: string;
  idea: string;
  prompt: string;
  mode: PromptMode;
  category: string;
  tags: string[];
  favorite: boolean;
  tokenEstimate: number;
  charCount: number;
  answers: QuestionAnswer[];
  createdAt: string;
  updatedAt: string;
}

/** Session de création en cours */
export interface CreationSession {
  id: string;
  idea: string;
  currentStep: number;
  questions: AdaptiveQuestion[];
  answers: QuestionAnswer[];
  issues: DetectedIssue[];
  summary: SummaryItem[];
  generatedPrompt: string | null;
  mode: PromptMode;
  targetAI: string;
  createdAt: string;
}

/** Configuration de l'application */
export interface AppConfig {
  geminiApiKey?: string;
  aiEnabled: boolean;
  defaultMode: PromptMode;
  defaultTargetAI: string;
  language: string;
}

/** Statistiques d'un prompt */
export interface PromptStats {
  charCount: number;
  wordCount: number;
  tokenEstimate: number;
  lineCount: number;
}
