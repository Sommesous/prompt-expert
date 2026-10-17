'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, BookOpen, Settings, Plus, Home } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/nouveau', label: 'Nouveau', icon: Plus },
  { href: '/bibliotheque', label: 'Bibliothèque', icon: BookOpen },
  { href: '/parametres', label: 'Paramètres', icon: Settings },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--pe-border)] bg-[var(--background)]/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-display font-semibold text-lg tracking-tight text-[var(--foreground)]">
          <span className="pe-breathe pe-gradient-diag w-8 h-8 rounded-[10px] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[var(--pe-on-primary)]" strokeWidth={2.4} />
          </span>
          <span className="hidden sm:inline">Prompt Expert</span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Navigation principale">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-sm font-semibold transition-colors border
                  ${active
                    ? 'bg-[var(--pe-surface-alt)] text-[var(--pe-primary-dark)] border-[#2b2c38]'
                    : 'border-transparent text-[var(--pe-text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--pe-surface)]'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
