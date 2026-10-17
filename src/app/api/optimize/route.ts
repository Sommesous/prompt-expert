import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, mode } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clé API Gemini non configurée' },
        { status: 400 }
      );
    }

    const modeInstructions: Record<string, string> = {
      rapide: 'Réduis ce prompt au strict minimum tout en conservant les exigences essentielles. Supprime toute formulation superflue. Vise la concision maximale.',
      equilibre: 'Optimise ce prompt pour un bon équilibre entre précision et longueur. Supprime les répétitions et reformule les passages verbeux sans perdre d\'information importante.',
      expert: 'Améliore la structure et la clarté de ce prompt. Ajoute des étapes de vérification, des critères de qualité et des garde-fous si nécessaire. Le prompt doit être complet et professionnel.',
    };

    const aiPrompt = `Tu es un expert en optimisation de prompts pour les intelligences artificielles.

${modeInstructions[mode] || modeInstructions.equilibre}

Prompt à optimiser :
---
${prompt}
---

Règles :
- Ne supprime JAMAIS une exigence ou contrainte importante.
- Conserve la structure en sections si elle existe.
- Le prompt doit rester directement utilisable.
- Réponds UNIQUEMENT avec le prompt optimisé, sans explication avant ou après.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: aiPrompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erreur Gemini' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const optimizedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text || prompt;

    return NextResponse.json({ optimizedPrompt: optimizedPrompt.trim() });
  } catch (error) {
    console.error('Optimize API error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
