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
    <header className="sticky top-0 z-50 border-b border-[var(--pe-border)] bg-[var(--pe-surface)]/95 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Sparkles className="w-5 h-5 text-[var(--pe-primary)]" />
          <span>Prompt Expert</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-[var(--pe-primary)] text-white'
                    : 'text-[var(--pe-text-secondary)] hover:bg-[var(--pe-surface-alt)]'
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
