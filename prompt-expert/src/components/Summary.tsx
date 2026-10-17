'use client';

import { SummaryItem, DetectedIssue } from '@/lib/types';
import { AlertTriangle, CheckCircle, HelpCircle, Info, Edit3 } from 'lucide-react';

interface SummaryProps {
  items: SummaryItem[];
  issues: DetectedIssue[];
  onEdit: (index: number) => void;
  onValidate: () => void;
  onBack: () => void;
}

export default function Summary({ items, issues, onEdit, onValidate, onBack }: SummaryProps) {
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const hasCritical = criticalIssues.length > 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Récapitulatif</h2>
        <p className="text-sm text-[var(--pe-text-secondary)]">
          Vérifie les informations avant de générer le prompt. Tu peux modifier n&apos;importe quel élément.
        </p>
      </div>

      {/* Problèmes détectés */}
      {issues.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[var(--pe-warning)]" />
            Points d&apos;attention ({issues.length})
          </h3>
          {issues.map((issue, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-sm ${
                issue.severity === 'critical'
                  ? 'border-[var(--pe-error)]/30 bg-[var(--pe-error)]/5'
                  : issue.severity === 'important'
                  ? 'border-[var(--pe-warning)]/30 bg-[var(--pe-warning)]/5'
                  : 'border-[var(--pe-info)]/30 bg-[var(--pe-info)]/5'
              }`}
            >
              <div className="flex items-start gap-2">
                {issue.type === 'contradiction' && <AlertTriangle className="w-4 h-4 text-[var(--pe-error)] mt-0.5 shrink-0" />}
                {issue.type === 'missing' && <Info className="w-4 h-4 text-[var(--pe-warning)] mt-0.5 shrink-0" />}
                {issue.type === 'ambiguity' && <HelpCircle className="w-4 h-4 text-[var(--pe-info)] mt-0.5 shrink-0" />}
                {issue.type === 'suggestion' && <CheckCircle className="w-4 h-4 text-[var(--pe-success)] mt-0.5 shrink-0" />}
                <div>
                  <p>{issue.message}</p>
                  {issue.suggestion && (
                    <p className="text-[var(--pe-text-secondary)] mt-1">💡 {issue.suggestion}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Éléments du récapitulatif */}
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-[var(--pe-text-secondary)] uppercase tracking-wide">
                    {item.label}
                  </span>
                  {item.status === 'confirmed' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(74,222,128,.12)] text-[var(--pe-success)]">
                      Confirmé
                    </span>
                  )}
                  {item.status === 'hypothesis' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(251,191,36,.12)] text-[var(--pe-warning)]">
                      Hypothèse
                    </span>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{item.value}</p>
              </div>
              {item.editable && (
                <button
                  onClick={() => onEdit(idx)}
                  className="p-1.5 rounded-md text-[var(--pe-text-secondary)] hover:text-[var(--pe-primary)] hover:bg-[var(--pe-surface-alt)] transition-colors shrink-0"
                  title="Modifier"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={onBack}
          className="px-4 py-2.5 text-sm text-[var(--pe-text-secondary)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--pe-surface-alt)] transition-colors"
        >
          ← Modifier les réponses
        </button>
        <button
          onClick={onValidate}
          disabled={hasCritical}
          className="px-6 py-2.5 pe-btn pe-gradient rounded-lg font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {hasCritical ? 'Résous les problèmes critiques' : 'Générer le prompt ✨'}
        </button>
      </div>
    </div>
  );
}
