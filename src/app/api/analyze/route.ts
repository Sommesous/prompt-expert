import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { idea, answers } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clé API Gemini non configurée' },
        { status: 400 }
      );
    }

    const answersText = answers.map((a: { questionText: string; selectedOptions: string[]; freeText: string }) =>
      `- ${a.questionText}: ${a.selectedOptions.join(', ')}${a.freeText ? ` (${a.freeText})` : ''}`
    ).join('\n');

    const prompt = `Tu es un expert en analyse de besoins et en conception de prompts IA.

Analyse ce projet :
Idée : "${idea}"

Réponses de l'utilisateur :
${answersText}

Identifie :
1. Les informations manquantes importantes
2. Les contradictions éventuelles
3. Les ambiguïtés à clarifier
4. Les suggestions d'amélioration

Réponds UNIQUEMENT avec un tableau JSON de problèmes détectés :
[{
  "type": "missing" | "contradiction" | "ambiguity" | "suggestion",
  "severity": "critical" | "important" | "minor",
  "message": "Description du problème",
  "suggestion": "Suggestion pour résoudre (optionnel)",
  "relatedQuestion": "ID de la question liée (optionnel)"
}]

Si tout semble complet, renvoie un tableau vide [].`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ issues: [] });
    }

    const issues = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ issues });
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
