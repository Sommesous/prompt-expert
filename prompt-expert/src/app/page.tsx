'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { SavedPrompt } from '@/lib/types';
import { getPrompts } from '@/lib/storage';
import { Sparkles, Plus, Clock, ArrowRight } from 'lucide-react';

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
      <main className="flex-1 max-w-[760px] mx-auto w-full px-4 sm:px-8 pt-12 sm:pt-16 pb-16 flex flex-col items-center gap-8 sm:gap-9">
        {/* Accueil */}
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="pe-rise pe-d1 font-code text-[11px] tracking-[.14em] uppercase text-[var(--pe-primary-dark)] px-3 py-1 rounded-full border border-[rgba(129,140,248,.3)] bg-[rgba(129,140,248,.08)]">
            prompt_expert.ai
          </span>
          <h1 className="pe-rise pe-d2 font-display text-3xl sm:text-[37px] font-semibold tracking-tight leading-tight">
            Salut, on fait quoi aujourd&apos;hui&nbsp;?
          </h1>
          <p className="pe-rise pe-d3 max-w-[440px] text-[15px] leading-relaxed text-[var(--pe-text-secondary)]">
            Raconte-moi ton idée comme tu la dirais à un collègue — je m&apos;occupe de la transformer en prompt clair et efficace.
          </p>
          <Link
            href="/nouveau"
            className="pe-rise pe-d4 pe-btn pe-gradient mt-1.5 inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-[14.5px] shadow-[0_12px_28px_-10px_rgba(99,102,241,.6)]"
          >
            <Plus className="w-4 h-4" strokeWidth={2.6} />
            Créer un prompt
          </Link>
        </div>

        {/* Statistiques */}
        <div className="pe-rise pe-d5 grid grid-cols-2 gap-3.5 w-full">
          <div className="pe-card p-5 rounded-2xl border border-[var(--pe-border)] bg-[var(--pe-surface)]">
            <div className="font-code text-[11.5px] text-[var(--pe-text-secondary)] mb-1.5">TOTAL_PROMPTS</div>
            <div className="font-display text-[27px] font-semibold text-[var(--pe-primary-dark)]">{stats.total}</div>
          </div>
          <div className="pe-card p-5 rounded-2xl border border-[var(--pe-border)] bg-[var(--pe-surface)]">
            <div className="font-code text-[11.5px] text-[var(--pe-text-secondary)] mb-1.5">FAVORIS</div>
            <div className="font-display text-[27px] font-semibold text-[var(--pe-primary-light)]">{stats.favorites}</div>
          </div>
        </div>

        {/* Bulle de dialogue */}
        <div className="pe-rise pe-d6 w-full flex items-end gap-2.5">
          <span className="pe-gradient-diag w-7 h-7 rounded-full flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[var(--pe-on-primary)]" strokeWidth={2.4} />
          </span>
          <div className="px-4 py-3 rounded-[4px_16px_16px_16px] bg-[var(--pe-surface)] border border-[var(--pe-border)] text-[13.5px] leading-relaxed text-[#d4d3dc] max-w-[480px]">
            {recentPrompts.length > 0
              ? 'Content de te revoir ! On reprend un échange, ou on part sur une nouvelle idée ?'
              : 'Pas encore de prompt enregistré. Lance-toi, je te pose quelques questions et on construit ça ensemble.'}
          </div>
        </div>

        {/* Derniers échanges */}
        {recentPrompts.length > 0 && (
          <div className="pe-rise pe-d7 w-full flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[15px] font-semibold flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[var(--pe-text-secondary)]" />
                Vos derniers échanges
              </h2>
              <Link href="/bibliotheque" className="text-[12.5px] font-semibold text-[var(--pe-primary-dark)] hover:text-[var(--pe-primary-light)] flex items-center gap-1">
                Tout voir <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentPrompts.map(prompt => (
              <Link
                href="/bibliotheque"
                key={prompt.id}
                className="pe-card px-4 py-3.5 rounded-[14px] border border-[var(--pe-border)] bg-[var(--pe-surface)] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold truncate">{prompt.title}</div>
                  <div className="text-xs text-[var(--pe-text-muted)] mt-0.5 truncate">{prompt.idea}</div>
                </div>
                <span className="font-code shrink-0 text-[10.5px] px-2.5 py-1 rounded-full bg-[var(--pe-surface-alt)] text-[var(--pe-primary-dark)] border border-[#2b2c38]">
                  ~{prompt.tokenEstimate} tok
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
