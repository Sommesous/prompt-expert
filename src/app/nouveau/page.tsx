'use client';

import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import QuestionCard from '@/components/QuestionCard';
import Summary from '@/components/Summary';
import PromptResult from '@/components/PromptResult';
import { AdaptiveQuestion, QuestionAnswer, PromptMode, DetectedIssue, SummaryItem, SavedPrompt } from '@/lib/types';
import { getNextQuestions, detectCategory, detectIssues, buildSummary } from '@/lib/question-engine';
import { generatePrompt, generateTitle } from '@/lib/prompt-generator';
import { getPromptStats } from '@/lib/token-estimator';
import { savePrompt, generateId } from '@/lib/storage';
import { Sparkles, ArrowRight } from 'lucide-react';

type Step = 'idea' | 'questions' | 'summary' | 'result';

export default function NouveauPage() {
  // État principal
  const [step, setStep] = useState<Step>('idea');
  const [idea, setIdea] = useState('');
  const [mode, setMode] = useState<PromptMode>('equilibre');
  const [targetAI, setTargetAI] = useState('chatgpt');

  // Questionnaire
  const [questions, setQuestions] = useState<AdaptiveQuestion[]>([]);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Résultat
  const [issues, setIssues] = useState<DetectedIssue[]>([]);
  const [summaryItems, setSummaryItems] = useState<SummaryItem[]>([]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  // === ÉTAPE 1 : Saisie de l'idée ===
  const handleIdeaSubmit = useCallback(() => {
    if (!idea.trim()) return;

    const category = detectCategory(idea);
    const initialQuestions = getNextQuestions(idea, [], category);
    setQuestions(initialQuestions);
    setCurrentQuestionIndex(0);
    setStep('questions');
  }, [idea]);

  // === ÉTAPE 2 : Questionnaire ===
  const handleAnswer = useCallback((answer: QuestionAnswer) => {
    const newAnswers = [...answers];
    const existingIdx = newAnswers.findIndex(a => a.questionId === answer.questionId);
    if (existingIdx >= 0) {
      newAnswers[existingIdx] = answer;
    } else {
      newAnswers.push(answer);
    }
    setAnswers(newAnswers);

    // Générer de nouvelles questions basées sur les réponses
    const category = detectCategory(idea);
    const nextQuestions = getNextQuestions(idea, newAnswers, category);
    setQuestions(nextQuestions);

    if (currentQuestionIndex < nextQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Plus de questions → passer au récapitulatif
      goToSummary(newAnswers);
    }
  }, [answers, currentQuestionIndex, idea]);

  const goToSummary = useCallback((currentAnswers: QuestionAnswer[]) => {
    const detectedIssues = detectIssues(idea, currentAnswers);
    const summary = buildSummary(idea, currentAnswers);
    setIssues(detectedIssues);
    setSummaryItems(summary);
    setStep('summary');
  }, [idea]);

  const handleFinishQuestions = useCallback(() => {
    goToSummary(answers);
  }, [answers, goToSummary]);

  // === ÉTAPE 3 : Récapitulatif ===
  const handleValidateSummary = useCallback(() => {
    const prompt = generatePrompt(idea, answers, mode, targetAI);
    setGeneratedPrompt(prompt);
    setStep('result');
  }, [idea, answers, mode, targetAI]);

  // === ÉTAPE 4 : Résultat ===
  const handleSavePrompt = useCallback((title: string, category: string, tags: string[]) => {
    const stats = getPromptStats(generatedPrompt);
    const saved: SavedPrompt = {
      id: generateId(),
      title: title || generateTitle(idea),
      idea,
      prompt: generatedPrompt,
      mode,
      category,
      tags,
      favorite: false,
      tokenEstimate: stats.tokenEstimate,
      charCount: stats.charCount,
      answers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    savePrompt(saved);
  }, [idea, generatedPrompt, mode, answers]);

  const handleRegenerate = useCallback((newMode: PromptMode) => {
    setMode(newMode);
    const prompt = generatePrompt(idea, answers, newMode, targetAI);
    setGeneratedPrompt(prompt);
  }, [idea, answers, targetAI]);

  const handleNewPrompt = useCallback(() => {
    setStep('idea');
    setIdea('');
    setAnswers([]);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setGeneratedPrompt('');
    setIssues([]);
    setSummaryItems([]);
  }, []);

  // === RENDU ===
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {/* ÉTAPE : IDÉE */}
        {step === 'idea' && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center space-y-2 pt-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--pe-primary)]/10 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-[var(--pe-primary)]" />
              </div>
              <h1 className="text-2xl font-bold">Créer un prompt</h1>
              <p className="text-[var(--pe-text-secondary)] text-sm max-w-md mx-auto">
                Décris ton besoin en quelques mots ou phrases. Je vais te poser les bonnes questions pour construire le meilleur prompt possible.
              </p>
            </div>

            <div>
              <textarea
                value={idea}
                onChange={e => setIdea(e.target.value)}
                placeholder="Ex : Je veux analyser les ventes de mon magasin par catégorie de produit sur les 6 derniers mois et identifier les tendances..."
                rows={5}
                className="w-full bg-[var(--pe-surface)] border border-[var(--pe-border)] rounded-xl px-4 py-3 text-sm resize-y focus:border-[var(--pe-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--pe-primary)]/20 placeholder:text-[var(--pe-text-secondary)]"
                autoFocus
              />
            </div>

            {/* Mode et IA cible */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--pe-text-secondary)] mb-1.5">Mode</label>
                <select
                  value={mode}
                  onChange={e => setMode(e.target.value as PromptMode)}
                  className="w-full bg-[var(--pe-surface)] border border-[var(--pe-border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--pe-primary)] focus:outline-none"
                >
                  <option value="rapide">⚡ Rapide</option>
                  <option value="equilibre">⚖️ Équilibré</option>
                  <option value="expert">🎯 Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--pe-text-secondary)] mb-1.5">IA cible</label>
                <select
                  value={targetAI}
                  onChange={e => setTargetAI(e.target.value)}
                  className="w-full bg-[var(--pe-surface)] border border-[var(--pe-border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--pe-primary)] focus:outline-none"
                >
                  <option value="chatgpt">ChatGPT</option>
                  <option value="claude">Claude</option>
                  <option value="gemini">Gemini</option>
                  <option value="general">Générique</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleIdeaSubmit}
              disabled={!idea.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--pe-primary)] text-white rounded-xl font-medium hover:bg-[var(--pe-primary-dark)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Commencer
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ÉTAPE : QUESTIONS */}
        {step === 'questions' && questions.length > 0 && (
          <div>
            {currentQuestionIndex < questions.length ? (
              <QuestionCard
                question={questions[currentQuestionIndex]}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={questions.length}
                existingAnswer={answers.find(a => a.questionId === questions[currentQuestionIndex].id)}
                onAnswer={handleAnswer}
                onBack={currentQuestionIndex > 0 ? () => setCurrentQuestionIndex(currentQuestionIndex - 1) : null}
                onSkip={!questions[currentQuestionIndex].required ? () => {
                  if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                  } else {
                    handleFinishQuestions();
                  }
                } : null}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-[var(--pe-text-secondary)] mb-4">Toutes les questions ont été posées.</p>
                <button
                  onClick={handleFinishQuestions}
                  className="px-6 py-2.5 bg-[var(--pe-primary)] text-white rounded-lg font-medium hover:bg-[var(--pe-primary-dark)] transition-colors"
                >
                  Voir le récapitulatif
                </button>
              </div>
            )}

            {/* Bouton pour terminer à tout moment */}
            {currentQuestionIndex > 0 && currentQuestionIndex < questions.length && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleFinishQuestions}
                  className="text-sm text-[var(--pe-text-secondary)] hover:text-[var(--pe-primary)] transition-colors underline underline-offset-2"
                >
                  J&apos;ai assez répondu, passer au récapitulatif →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ÉTAPE : RÉCAPITULATIF */}
        {step === 'summary' && (
          <Summary
            items={summaryItems}
            issues={issues}
            onEdit={(idx) => {
              // Revenir à la question correspondante
              if (idx === 0) {
                setStep('idea');
              } else {
                setCurrentQuestionIndex(Math.min(idx - 1, questions.length - 1));
                setStep('questions');
              }
            }}
            onValidate={handleValidateSummary}
            onBack={() => {
              setCurrentQuestionIndex(Math.max(0, answers.length - 1));
              setStep('questions');
            }}
          />
        )}

        {/* ÉTAPE : RÉSULTAT */}
        {step === 'result' && generatedPrompt && (
          <PromptResult
            prompt={generatedPrompt}
            mode={mode}
            onSave={handleSavePrompt}
            onRegenerate={handleRegenerate}
            onEdit={setGeneratedPrompt}
            onNewPrompt={handleNewPrompt}
          />
        )}
      </main>
    </div>
  );
}
