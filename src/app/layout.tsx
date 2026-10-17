import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Expert — Générateur de prompts intelligent",
  description: "Transformez vos idées en prompts professionnels optimisés pour les IA",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] font-sans">
        {children}
      </body>
    </html>
  );
}
