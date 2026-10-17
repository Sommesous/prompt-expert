// === GESTION DU STOCKAGE LOCAL ===
import { SavedPrompt, AppConfig, CreationSession } from './types';

const KEYS = {
  PROMPTS: 'pe_prompts',
  CONFIG: 'pe_config',
  SESSION: 'pe_session',
  CATEGORIES: 'pe_categories',
};

const DEFAULT_CONFIG: AppConfig = {
  geminiApiKey: undefined,
  aiEnabled: false,
  defaultMode: 'equilibre',
  defaultTargetAI: 'chatgpt',
  language: 'fr',
};

const DEFAULT_CATEGORIES = [
  { id: 'travail', name: 'Travail', icon: 'Briefcase', color: '#3b82f6' },
  { id: 'analyse', name: 'Analyse de données', icon: 'BarChart3', color: '#8b5cf6' },
  { id: 'excel', name: 'Excel / Tableurs', icon: 'Table', color: '#10b981' },
  { id: 'commerce', name: 'Gestion commerciale', icon: 'ShoppingCart', color: '#f59e0b' },
  { id: 'redaction', name: 'Rédaction', icon: 'PenTool', color: '#ec4899' },
  { id: 'informatique', name: 'Informatique', icon: 'Code', color: '#6366f1' },
  { id: 'marketing', name: 'Marketing', icon: 'Megaphone', color: '#f97316' },
  { id: 'personnel', name: 'Projets personnels', icon: 'User', color: '#14b8a6' },
  { id: 'autre', name: 'Autre', icon: 'Folder', color: '#64748b' },
];

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getItem<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Erreur de sauvegarde:', e);
  }
}

// === Prompts ===

export function getPrompts(): SavedPrompt[] {
  return getItem<SavedPrompt[]>(KEYS.PROMPTS, []);
}

export function savePrompt(prompt: SavedPrompt): void {
  const prompts = getPrompts();
  const idx = prompts.findIndex(p => p.id === prompt.id);
  if (idx >= 0) {
    prompts[idx] = { ...prompt, updatedAt: new Date().toISOString() };
  } else {
    prompts.unshift(prompt);
  }
  setItem(KEYS.PROMPTS, prompts);
}

export function deletePrompt(id: string): void {
  const prompts = getPrompts().filter(p => p.id !== id);
  setItem(KEYS.PROMPTS, prompts);
}

export function toggleFavorite(id: string): void {
  const prompts = getPrompts();
  const prompt = prompts.find(p => p.id === id);
  if (prompt) {
    prompt.favorite = !prompt.favorite;
    setItem(KEYS.PROMPTS, prompts);
  }
}

export function searchPrompts(query: string): SavedPrompt[] {
  const q = query.toLowerCase();
  return getPrompts().filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.idea.toLowerCase().includes(q) ||
    p.prompt.toLowerCase().includes(q) ||
    p.tags.some(t => t.toLowerCase().includes(q))
  );
}

export function duplicatePrompt(id: string): SavedPrompt | null {
  const prompts = getPrompts();
  const original = prompts.find(p => p.id === id);
  if (!original) return null;
  const copy: SavedPrompt = {
    ...original,
    id: generateId(),
    title: `${original.title} (copie)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  prompts.unshift(copy);
  setItem(KEYS.PROMPTS, prompts);
  return copy;
}

// === Configuration ===

export function getConfig(): AppConfig {
  return getItem<AppConfig>(KEYS.CONFIG, DEFAULT_CONFIG);
}

export function updateConfig(partial: Partial<AppConfig>): void {
  const config = { ...getConfig(), ...partial };
  setItem(KEYS.CONFIG, config);
}

// === Catégories ===

export function getCategories() {
  return getItem(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
}

// === Session de création ===

export function getSession(): CreationSession | null {
  return getItem<CreationSession | null>(KEYS.SESSION, null);
}

export function saveSession(session: CreationSession): void {
  setItem(KEYS.SESSION, session);
}

export function clearSession(): void {
  if (isBrowser()) localStorage.removeItem(KEYS.SESSION);
}

// === Utilitaires ===

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// === Export / Import ===

export function exportAllData(): string {
  return JSON.stringify({
    prompts: getPrompts(),
    config: getConfig(),
    categories: getCategories(),
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

export function exportPrompt(id: string): string | null {
  const prompt = getPrompts().find(p => p.id === id);
  if (!prompt) return null;
  return JSON.stringify(prompt, null, 2);
}
