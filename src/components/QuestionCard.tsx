'use client';

import { useState, useEffect } from 'react';
import { AdaptiveQuestion, QuestionAnswer } from '@/lib/types';
import { ChevronLeft, HelpCircle, SkipForward } from 'lucide-react';

interface QuestionCardProps {
  question: AdaptiveQuestion;
  questionNumber: number;
  totalQuestions: number;
  existingAnswer?: QuestionAnswer;
  onAnswer: (answer: QuestionAnswer) => void;
  onBack: (() => void) | null;
  onSkip: (() => void) | null;
}

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  existingAnswer,
  onAnswer,
  onBack,
  onSkip,
}: QuestionCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    existingAnswer?.selectedOptions || []
  );
  const [freeText, setFreeText] = useState(existingAnswer?.freeText || '');
  const [adviseMe, setAdviseMe] = useState(existingAnswer?.adviseMeSelected || false);

  // Reset when question changes
  useEffect(() => {
    setSelectedOptions(existingAnswer?.selectedOptions || []);
    setFreeText(existingAnswer?.freeText || '');
    setAdviseMe(existingAnswer?.adviseMeSelected || false);
  }, [question.id, existingAnswer]);

  const toggleOption = (optionId: string) => {
    if (question.type === 'radio') {
      setSelectedOptions([optionId]);
      setAdviseMe(false);
    } else {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
      if (optionId !== 'advise_me') setAdviseMe(false);
    }
  };

  const handleAdviseMe = () => {
    setAdviseMe(!adviseMe);
    if (!adviseMe) {
      setSelectedOptions([]);
    }
  };

  const handleSubmit = () => {
    onAnswer({
      questionId: question.id,
      questionText: question.text,
      selectedOptions,
      freeText,
      skipped: false,
      adviseMeSelected: adviseMe,
    });
  };

  const handleSkip = () => {
    onAnswer({
      questionId: question.id,
      questionText: question.text,
      selectedOptions: [],
      freeText: '',
      skipped: true,
      adviseMeSelected: false,
    });
    onSkip?.();
  };

  const canSubmit = selectedOptions.length > 0 || freeText.trim().length > 0 || adviseMe;

  return (
    <div className="animate-slide-in">
      {/* Progression */}
      <div className="flex items-center justify-between mb-4 text-sm text-[var(--pe-text-secondary)]">
        <span>Question {questionNumber}{totalQuestions > 0 ? ` / ${totalQuestions}` : ''}</span>
        {question.required && (
          <span className="text-[var(--pe-error)] text-xs font-medium">Obligatoire</span>
        )}
      </div>

      {/* Barre de progression */}
      <div className="w-full h-1.5 bg-[var(--pe-surface-alt)] rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-[var(--pe-primary)] rounded-full transition-all duration-500"
          style={{ width: `${(questionNumber / Math.max(totalQuestions, questionNumber + 2)) * 100}%` }}
        />
      </div>

      {/* Question */}
      <h2 className="text-lg font-semibold mb-1">{question.text}</h2>
      {question.helpText && (
        <p className="text-sm text-[var(--pe-text-secondary)] mb-4 flex items-start gap-1.5">
          <HelpCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {question.helpText}
        </p>
      )}

      {/* Options de réponse */}
      <div className="space-y-2 mb-4">
        {question.options.map(option => {
          const isSelected = selectedOptions.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3
                ${isSelected
                  ? 'border-[var(--pe-primary)] bg-[var(--pe-primary)]/5'
                  : 'border-[var(--pe-border)] hover:border-[var(--pe-primary-light)] bg-[var(--pe-surface)]'
                }`}
            >
              {/* Checkbox ou radio visuel */}
              <span
                className={`w-5 h-5 rounded-${question.type === 'radio' ? 'full' : 'md'} border-2 flex items-center justify-center shrink-0 transition-colors
                  ${isSelected
                    ? 'border-[var(--pe-primary)] bg-[var(--pe-primary)]'
                    : 'border-[var(--pe-border)]'
                  }`}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
              <span className="text-sm">{option.label}</span>
            </button>
          );
        })}

        {/* Option "Je ne sais pas, conseille-moi" */}
        <button
          onClick={handleAdviseMe}
          className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3
            ${adviseMe
              ? 'border-[var(--pe-accent)] bg-[var(--pe-accent)]/5'
              : 'border-dashed border-[var(--pe-border)] hover:border-[var(--pe-accent)] bg-[var(--pe-surface)]'
            }`}
        >
          <HelpCircle className={`w-5 h-5 shrink-0 ${adviseMe ? 'text-[var(--pe-accent)]' : 'text-[var(--pe-text-secondary)]'}`} />
          <span className="text-sm text-[var(--pe-text-secondary)]">Je ne sais pas, conseille-moi</span>
        </button>
      </div>

      {/* Zone de texte libre — TOUJOURS visible */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1.5 text-[var(--pe-text-secondary)]">
          Réponse libre
        </label>
        <textarea
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          placeholder={question.placeholder || 'Ajoute tes précisions ici...'}
          rows={3}
          className="w-full bg-[var(--pe-surface)] border border-[var(--pe-border)] rounded-lg px-3 py-2.5 text-sm resize-y focus:border-[var(--pe-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--pe-primary)]/20 placeholder:text-[var(--pe-text-secondary)]"
        />
      </div>

      {/* Boutons d'action */}
      <div className="flex items-center justify-between gap-3">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-[var(--pe-text-secondary)] hover:text-[var(--foreground)] transition-colors rounded-lg hover:bg-[var(--pe-surface-alt)]"
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!question.required && onSkip && (
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-[var(--pe-text-secondary)] hover:text-[var(--foreground)] transition-colors rounded-lg hover:bg-[var(--pe-surface-alt)]"
            >
              <SkipForward className="w-4 h-4" />
              Passer
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={question.required && !canSubmit}
            className="px-5 py-2.5 bg-[var(--pe-primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--pe-primary-dark)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
