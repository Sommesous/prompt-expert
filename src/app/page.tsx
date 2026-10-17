'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { SavedPrompt } from '@/lib/types';
import { getPrompts } from '@/lib/storage';
import { Sparkles, Plus, BookOpen, Clock, Star, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [recentPrompts, setRecentPrompts] = useState<SavedPrompt[]>([]);
  const [stats, setStats] = useState({ total: 0, favorites: 0 });

  useEffect(() => {
    const prompts = getPrompts();
    setRecentPrompts(prompts.slice(0, 5));
    setStats({
      total: prompts.length,
      favorites: prompts.filter(p => p.favorite).length,
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Hero */}
        <div className="text-center space-y-3 mb-10">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--pe-primary)]/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[var(--pe-primary)]" />
          </div>
          <h1 className="text-3xl font-bold">Prompt Expert</h1>
          <p className="text-[var(--pe-text-secondary)] max-w-md mx-auto">
            Transforme tes idées en prompts professionnels, optimisés et prêts à l&apos;emploi.
          </p>
          <Link
            href="/nouveau"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--pe-primary)] text-white rounded-xl font-medium hover:bg-[var(--pe-primary-dark)] transition-colors mt-2"
          >
            <Plus className="w-5 h-5" />
            Créer un prompt
          </Link>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="p-4 rounded-xl border border-[var(--pe-border)] bg-[var(--pe-surface)]">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-[var(--pe-primary)]" />
              <span className="text-sm text-[var(--pe-text-secondary)]">Total prompts</span>
            </div>
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
          <div className="p-4 rounded-xl border border-[var(--pe-border)] bg-[var(--pe-surface)]">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-[var(--pe-text-secondary)]">Favoris</span>
            </div>
            <span className="text-2xl font-bold">{stats.favorites}</span>
          </div>
        </div>

        {/* Prompts récents */}
        {recentPrompts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--pe-text-secondary)]" />
                Derniers prompts
              </h2>
              <Link
                href="/bibliotheque"
                className="text-sm text-[var(--pe-primary)] hover:underline flex items-center gap-1"
              >
                Tout voir <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentPrompts.map(prompt => (
                <div
                  key={prompt.id}
                  className="p-3 rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface)] hover:border-[var(--pe-primary-light)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium truncate">{prompt.title}</h3>
                      <p className="text-xs text-[var(--pe-text-secondary)] mt-0.5 truncate">
                        {prompt.idea}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--pe-surface-alt)] text-[var(--pe-text-secondary)]">
                        ~{prompt.tokenEstimate} tokens
                      </span>
                      {prompt.favorite && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message si vide */}
        {recentPrompts.length === 0 && (
          <div className="text-center py-12 text-[var(--pe-text-secondary)]">
            <p className="mb-2">Aucun prompt sauvegardé pour le moment.</p>
            <p className="text-sm">Commence par créer ton premier prompt !</p>
          </div>
        )}
      </main>
    </div>
  );
}
