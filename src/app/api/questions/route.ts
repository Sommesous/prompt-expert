import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { idea, previousAnswers } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clé API Gemini non configurée' },
        { status: 400 }
      );
    }

    const prompt = `Tu es un expert en conception de prompts pour les intelligences artificielles.

Un utilisateur veut créer un prompt pour l'objectif suivant :
"${idea}"

${previousAnswers && previousAnswers.length > 0 ? `
Voici ses réponses précédentes :
${previousAnswers.map((a: { questionText: string; selectedOptions: string[]; freeText: string }) =>
  `- ${a.questionText}: ${a.selectedOptions.join(', ')}${a.freeText ? ` (précision: ${a.freeText})` : ''}`
).join('\n')}
` : ''}

Génère 3 à 5 questions pertinentes pour compléter les informations manquantes.
Chaque question doit avoir un format JSON strict :
{
  "id": "ai_q1",
  "text": "La question en français",
  "type": "checkbox" ou "radio",
  "required": true ou false,
  "helpText": "Explication courte",
  "placeholder": "Texte pour la zone libre",
  "options": [{"id": "opt1", "label": "Choix 1"}, ...]
}

NE POSE PAS de questions dont la réponse est déjà dans les réponses précédentes.
Réponds UNIQUEMENT avec un tableau JSON, sans explication.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', errText);
      return NextResponse.json(
        { error: 'Erreur lors de l\'appel à Gemini', details: errText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extraire le JSON du texte
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Réponse invalide de Gemini', raw: text },
        { status: 500 }
      );
    }

    const questions = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Questions API error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
