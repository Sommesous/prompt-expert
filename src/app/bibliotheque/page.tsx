'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { SavedPrompt } from '@/lib/types';
import { getPrompts, deletePrompt, toggleFavorite, duplicatePrompt, searchPrompts, exportPrompt } from '@/lib/storage';
import { Search, Star, Copy, Trash2, Download, Filter, BookOpen } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  travail: 'Travail',
  analyse: 'Analyse de données',
  excel: 'Excel / Tableurs',
  commerce: 'Gestion commerciale',
  redaction: 'Rédaction',
  informatique: 'Informatique',
  marketing: 'Marketing',
  personnel: 'Projets personnels',
  autre: 'Autre',
};

export default function BibliothequePage() {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadPrompts = useCallback(() => {
    let results: SavedPrompt[];
    if (searchQuery.trim()) {
      results = searchPrompts(searchQuery);
    } else {
      results = getPrompts();
    }
    if (filterCategory !== 'all') {
      results = results.filter(p => p.category === filterCategory);
    }
    if (filterFavorites) {
      results = results.filter(p => p.favorite);
    }
    setPrompts(results);
  }, [searchQuery, filterCategory, filterFavorites]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce prompt ?')) {
      deletePrompt(id);
      loadPrompts();
    }
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
    loadPrompts();
  };

  const handleDuplicate = (id: string) => {
    duplicatePrompt(id);
    loadPrompts();
  };

  const handleExport = (id: string) => {
    const data = exportPrompt(id);
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPrompt = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[var(--pe-primary)]" />
          Bibliothèque de prompts
        </h1>

        {/* Barre de recherche + filtres */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pe-text-secondary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans les prompts..."
              className="w-full bg-[var(--pe-surface)] border border-[var(--pe-border)] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-[var(--pe-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--pe-primary)]/20"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-[var(--pe-text-secondary)]" />
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-[var(--pe-surface)] border border-[var(--pe-border)] rounded-lg px-2.5 py-1.5 text-xs focus:border-[var(--pe-primary)] focus:outline-none"
            >
              <option value="all">Toutes catégories</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button
              onClick={() => setFilterFavorites(!filterFavorites)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                filterFavorites
                  ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                  : 'border-[var(--pe-border)] hover:bg-[var(--pe-surface-alt)]'
              }`}
            >
              <Star className={`w-3 h-3 ${filterFavorites ? 'fill-amber-500' : ''}`} />
              Favoris
            </button>
          </div>
        </div>

        {/* Liste des prompts */}
        {prompts.length === 0 ? (
          <div className="text-center py-12 text-[var(--pe-text-secondary)]">
            <p className="mb-1">Aucun prompt trouvé.</p>
            <p className="text-sm">
              {searchQuery || filterCategory !== 'all' || filterFavorites
                ? 'Essaie de modifier tes filtres.'
                : 'Crée ton premier prompt depuis l\'onglet Nouveau.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {prompts.map(prompt => (
              <div
                key={prompt.id}
                className="rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface)] overflow-hidden"
              >
                {/* En-tête */}
                <div
                  className="p-3 cursor-pointer hover:bg-[var(--pe-surface-alt)] transition-colors"
                  onClick={() => setExpandedId(expandedId === prompt.id ? null : prompt.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium truncate">{prompt.title}</h3>
                        {prompt.favorite && (
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[var(--pe-text-secondary)] truncate">{prompt.idea}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--pe-surface-alt)] text-[var(--pe-text-secondary)]">
                        {CATEGORY_LABELS[prompt.category] || prompt.category}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--pe-primary)]/10 text-[var(--pe-primary)]">
                        ~{prompt.tokenEstimate} tokens
                      </span>
                    </div>
                  </div>
                  {prompt.tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {prompt.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--pe-surface-alt)] text-[var(--pe-text-secondary)]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contenu étendu */}
                {expandedId === prompt.id && (
                  <div className="border-t border-[var(--pe-border)]">
                    <div className="p-3">
                      <pre className="text-xs font-mono whitespace-pre-wrap bg-[var(--pe-surface-alt)] p-3 rounded-lg max-h-64 overflow-y-auto leading-relaxed">
                        {prompt.prompt}
                      </pre>
                    </div>
                    <div className="flex items-center gap-1 px-3 pb-3 flex-wrap">
                      <button
                        onClick={() => handleCopyPrompt(prompt.prompt)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg hover:bg-[var(--pe-surface-alt)] transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copier
                      </button>
                      <button
                        onClick={() => handleToggleFavorite(prompt.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg hover:bg-[var(--pe-surface-alt)] transition-colors"
                      >
                        <Star className={`w-3.5 h-3.5 ${prompt.favorite ? 'fill-amber-500 text-amber-500' : ''}`} />
                        {prompt.favorite ? 'Retirer favori' : 'Favori'}
                      </button>
                      <button
                        onClick={() => handleDuplicate(prompt.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg hover:bg-[var(--pe-surface-alt)] transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" /> Dupliquer
                      </button>
                      <button
                        onClick={() => handleExport(prompt.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg hover:bg-[var(--pe-surface-alt)] transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Exporter
                      </button>
                      <button
                        onClick={() => handleDelete(prompt.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg text-[var(--pe-error)] hover:bg-[var(--pe-error)]/5 transition-colors ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
