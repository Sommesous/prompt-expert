'use client';

import { useState } from 'react';
import { PromptMode, PromptStats } from '@/lib/types';
import { getPromptStats, estimateCost } from '@/lib/token-estimator';
import { Copy, Check, Save, Download, RefreshCw } from 'lucide-react';

interface PromptResultProps {
  prompt: string;
  mode: PromptMode;
  onSave: (title: string, category: string, tags: string[]) => void;
  onRegenerate: (mode: PromptMode) => void;
  onEdit: (newPrompt: string) => void;
  onNewPrompt: () => void;
}

const MODE_LABELS: Record<PromptMode, string> = {
  rapide: '⚡ Rapide',
  equilibre: '⚖️ Équilibré',
  expert: '🎯 Expert',
};

export default function PromptResult({
  prompt,
  mode,
  onSave,
  onRegenerate,
  onEdit,
  onNewPrompt,
}: PromptResultProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(prompt);
  const [showSave, setShowSave] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveCategory, setSaveCategory] = useState('autre');
  const [saveTags, setSaveTags] = useState('');

  const stats: PromptStats = getPromptStats(prompt);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback pour les navigateurs qui ne supportent pas clipboard
      const textarea = document.createElement('textarea');
      textarea.value = prompt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = () => {
    onSave(
      saveTitle || 'Prompt sans titre',
      saveCategory,
      saveTags.split(',').map(t => t.trim()).filter(Boolean)
    );
    setShowSave(false);
  };

  const handleExport = () => {
    const blob = new Blob([prompt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = () => {
    onEdit(editText);
    setEditing(false);
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Prompt généré</h2>
        <span className="text-sm px-2.5 py-1 rounded-full bg-[var(--pe-primary)]/10 text-[var(--pe-primary)] font-medium">
          {MODE_LABELS[mode]}
        </span>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-lg bg-[var(--pe-surface-alt)] text-center">
          <div className="text-lg font-bold text-[var(--pe-primary)]">{stats.charCount.toLocaleString()}</div>
          <div className="text-[10px] text-[var(--pe-text-secondary)] uppercase tracking-wide">Caractères</div>
        </div>
        <div className="p-2.5 rounded-lg bg-[var(--pe-surface-alt)] text-center">
          <div className="text-lg font-bold text-[var(--pe-primary)]">~{stats.tokenEstimate.toLocaleString()}</div>
          <div className="text-[10px] text-[var(--pe-text-secondary)] uppercase tracking-wide">Tokens (est.)</div>
        </div>
        <div className="p-2.5 rounded-lg bg-[var(--pe-surface-alt)] text-center">
          <div className="text-lg font-bold text-[var(--pe-primary)]">{stats.wordCount}</div>
          <div className="text-[10px] text-[var(--pe-text-secondary)] uppercase tracking-wide">Mots</div>
        </div>
      </div>
      <p className="text-[11px] text-[var(--pe-text-secondary)]">
        ⚠️ L&apos;estimation des tokens est approximative (±20%). Le nombre exact dépend du tokenizer du modèle utilisé.
      </p>

      {/* Le prompt */}
      <div className="relative">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={15}
              className="w-full bg-[var(--pe-surface)] border border-[var(--pe-primary)] rounded-lg px-4 py-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[var(--pe-primary)]/20"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setEditing(false); setEditText(prompt); }}
                className="px-3 py-1.5 text-sm text-[var(--pe-text-secondary)] hover:bg-[var(--pe-surface-alt)] rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 text-sm bg-[var(--pe-primary)] text-white rounded-lg hover:bg-[var(--pe-primary-dark)] transition-colors"
              >
                Appliquer
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setEditing(true)}
            className="cursor-text p-4 rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface)] text-sm font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto hover:border-[var(--pe-primary-light)] transition-colors"
          >
            {prompt}
          </div>
        )}
      </div>

      {/* Actions principales */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--pe-primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--pe-primary-dark)] transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copié !' : 'Copier'}
        </button>
        <button
          onClick={() => setShowSave(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--pe-border)] rounded-lg text-sm hover:bg-[var(--pe-surface-alt)] transition-colors"
        >
          <Save className="w-4 h-4" />
          Sauvegarder
        </button>
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--pe-border)] rounded-lg text-sm hover:bg-[var(--pe-surface-alt)] transition-colors"
        >
          <Download className="w-4 h-4" />
          Exporter
        </button>
      </div>

      {/* Régénérer avec un autre mode */}
      <div className="pt-2 border-t border-[var(--pe-border)]">
        <p className="text-xs text-[var(--pe-text-secondary)] mb-2">Régénérer avec un autre mode :</p>
        <div className="flex gap-2">
          {(Object.keys(MODE_LABELS) as PromptMode[]).map(m => (
            <button
              key={m}
              onClick={() => onRegenerate(m)}
              disabled={m === mode}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                m === mode
                  ? 'bg-[var(--pe-primary)]/10 text-[var(--pe-primary)] cursor-default'
                  : 'border border-[var(--pe-border)] hover:bg-[var(--pe-surface-alt)]'
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Nouveau prompt */}
      <button
        onClick={onNewPrompt}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-[var(--pe-border)] rounded-lg text-sm text-[var(--pe-text-secondary)] hover:border-[var(--pe-primary)] hover:text-[var(--pe-primary)] transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Créer un nouveau prompt
      </button>

      {/* Modal de sauvegarde */}
      {showSave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-[var(--pe-surface)] rounded-xl p-5 space-y-4 shadow-xl">
            <h3 className="text-lg font-semibold">Sauvegarder le prompt</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Titre</label>
              <input
                type="text"
                value={saveTitle}
                onChange={e => setSaveTitle(e.target.value)}
                placeholder="Donne un titre à ce prompt..."
                className="w-full bg-[var(--pe-surface)] border border-[var(--pe-border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--pe-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--pe-primary)]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Catégorie</label>
              <select
                value={saveCategory}
                onChange={e => setSaveCategory(e.target.value)}
                className="w-full bg-[var(--pe-surface)] border border-[var(--pe-border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--pe-primary)] focus:outline-none"
              >
                <option value="travail">Travail</option>
                <option value="analyse">Analyse de données</option>
                <option value="excel">Excel / Tableurs</option>
                <option value="commerce">Gestion commerciale</option>
                <option value="redaction">Rédaction</option>
                <option value="informatique">Informatique</option>
                <option value="marketing">Marketing</option>
                <option value="personnel">Projets personnels</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags (séparés par des virgules)</label>
              <input
                type="text"
                value={saveTags}
                onChange={e => setSaveTags(e.target.value)}
                placeholder="excel, rapport, analyse..."
                className="w-full bg-[var(--pe-surface)] border border-[var(--pe-border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--pe-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--pe-primary)]/20"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSave(false)}
                className="px-4 py-2 text-sm text-[var(--pe-text-secondary)] hover:bg-[var(--pe-surface-alt)] rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-[var(--pe-primary)] text-white rounded-lg hover:bg-[var(--pe-primary-dark)] transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
