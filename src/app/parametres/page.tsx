'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { getConfig, updateConfig, exportAllData } from '@/lib/storage';
import { AppConfig } from '@/lib/types';
import { Settings, Key, Download, Shield, CheckCircle } from 'lucide-react';

export default function ParametresPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [geminiKey, setGeminiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const cfg = getConfig();
    setConfig(cfg);
    setGeminiKey(cfg.geminiApiKey || '');
  }, []);

  const handleSave = () => {
    if (!config) return;
    const updated: Partial<AppConfig> = {
      geminiApiKey: geminiKey.trim() || undefined,
      aiEnabled: !!geminiKey.trim(),
    };
    updateConfig(updated);
    setConfig({ ...config, ...updated });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportAll = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-expert-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!config) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[var(--pe-primary)]" />
          Paramètres
        </h1>

        <div className="space-y-6">
          {/* Configuration IA */}
          <section className="rounded-xl border border-[var(--pe-border)] bg-[var(--pe-surface)] p-4 space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Key className="w-4 h-4 text-[var(--pe-primary)]" />
              Intelligence artificielle
            </h2>
            <p className="text-sm text-[var(--pe-text-secondary)]">
              Configure ta clé API Google Gemini pour activer les questions intelligentes et l&apos;optimisation avancée des prompts. Sans clé, le mode template (hors-ligne) est utilisé.
            </p>

            <div>
              <label className="block text-sm font-medium mb-1.5">Clé API Gemini</label>
              <input
                type="password"
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full bg-[var(--pe-surface)] border border-[var(--pe-border)] rounded-lg px-3 py-2.5 text-sm font-mono focus:border-[var(--pe-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--pe-primary)]/20"
              />
              <p className="text-xs text-[var(--pe-text-secondary)] mt-1.5">
                Obtiens une clé gratuite sur{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--pe-primary)] underline underline-offset-2"
                >
                  Google AI Studio
                </a>
                . Ta clé reste uniquement sur ton navigateur et n&apos;est transmise qu&apos;au serveur local de l&apos;application.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-[var(--pe-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--pe-primary-dark)] transition-colors"
              >
                Enregistrer
              </button>
              {saved && (
                <span className="text-sm text-[var(--pe-success)] flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Sauvegardé
                </span>
              )}
            </div>

            {/* Status */}
            <div className={`p-3 rounded-lg text-sm ${
              config.aiEnabled
                ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                : 'bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400'
            }`}>
              {config.aiEnabled
                ? '✅ IA activée — Les questions intelligentes et l\'optimisation avancée sont disponibles.'
                : '⚠️ IA désactivée — Le mode template (hors-ligne) est utilisé. Configure une clé API pour débloquer les fonctionnalités avancées.'}
            </div>
          </section>

          {/* Sécurité */}
          <section className="rounded-xl border border-[var(--pe-border)] bg-[var(--pe-surface)] p-4 space-y-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--pe-primary)]" />
              Sécurité et données
            </h2>
            <ul className="text-sm text-[var(--pe-text-secondary)] space-y-1.5">
              <li>• Toutes tes données sont stockées localement dans ton navigateur (localStorage).</li>
              <li>• Ta clé API n&apos;est jamais exposée côté client — elle transite uniquement par le serveur de l&apos;application.</li>
              <li>• Aucune donnée n&apos;est partagée avec des tiers sans ton action.</li>
              <li>• Tu peux exporter ou supprimer tes données à tout moment.</li>
            </ul>
          </section>

          {/* Export */}
          <section className="rounded-xl border border-[var(--pe-border)] bg-[var(--pe-surface)] p-4 space-y-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Download className="w-4 h-4 text-[var(--pe-primary)]" />
              Exporter mes données
            </h2>
            <p className="text-sm text-[var(--pe-text-secondary)]">
              Télécharge une sauvegarde complète de tes prompts, catégories et paramètres au format JSON.
            </p>
            <button
              onClick={handleExportAll}
              className="px-5 py-2 border border-[var(--pe-border)] rounded-lg text-sm font-medium hover:bg-[var(--pe-surface-alt)] transition-colors"
            >
              Exporter tout (JSON)
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
