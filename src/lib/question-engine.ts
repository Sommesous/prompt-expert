// === MOTEUR DE QUESTIONS ADAPTATIF ===
// Fonctionne en deux modes :
// 1. Avec API Gemini : questions générées par IA, véritablement adaptatives
// 2. Sans API : questions basées sur des templates intelligents par catégorie

import { AdaptiveQuestion, QuestionAnswer, DetectedIssue, SummaryItem } from './types';

// === TEMPLATES DE QUESTIONS PAR CATÉGORIE ===

interface QuestionTemplate {
  id: string;
  text: string;
  type: 'checkbox' | 'radio';
  options: { id: string; label: string }[];
  placeholder: string;
  required: boolean;
  helpText?: string;
  /** Catégories pour lesquelles cette question s'applique. Vide = toutes */
  categories: string[];
  /** Condition : n'afficher que si une réponse précédente contient ces mots */
  showIf?: { questionId: string; containsAny: string[] };
}

const QUESTION_TEMPLATES: QuestionTemplate[] = [
  {
    id: 'q_objectif',
    text: 'Quel est ton objectif principal ?',
    type: 'checkbox',
    options: [
      { id: 'analyser', label: 'Analyser des données' },
      { id: 'creer_tableau', label: 'Créer un tableau ou document structuré' },
      { id: 'automatiser', label: 'Automatiser une tâche' },
      { id: 'rediger', label: 'Rédiger un texte ou document' },
      { id: 'developper', label: 'Développer une application ou un script' },
      { id: 'comparer', label: 'Comparer des solutions ou options' },
      { id: 'resoudre', label: 'Résoudre un problème technique' },
      { id: 'planifier', label: 'Planifier ou organiser un projet' },
    ],
    placeholder: 'Décris précisément ce que tu souhaites obtenir...',
    required: true,
    categories: [],
  },
  {
    id: 'q_contexte',
    text: 'Dans quel contexte travailles-tu ?',
    type: 'checkbox',
    options: [
      { id: 'pro', label: 'Professionnel / Entreprise' },
      { id: 'perso', label: 'Personnel' },
      { id: 'etude', label: 'Études / Formation' },
      { id: 'freelance', label: 'Freelance / Indépendant' },
    ],
    placeholder: 'Donne plus de détails sur ton environnement de travail...',
    required: false,
    helpText: 'Le contexte aide à adapter le niveau de formalité et les contraintes.',
    categories: [],
  },
  {
    id: 'q_public',
    text: 'À qui est destiné le résultat ?',
    type: 'radio',
    options: [
      { id: 'moi', label: 'Pour moi uniquement' },
      { id: 'equipe', label: 'Pour mon équipe' },
      { id: 'direction', label: 'Pour la direction / hiérarchie' },
      { id: 'clients', label: 'Pour des clients' },
      { id: 'public', label: 'Pour un public large' },
    ],
    placeholder: 'Précise le destinataire si nécessaire...',
    required: false,
    categories: [],
  },
  {
    id: 'q_format',
    text: 'Sous quelle forme souhaites-tu le résultat ?',
    type: 'checkbox',
    options: [
      { id: 'texte', label: 'Texte / Document' },
      { id: 'tableau', label: 'Tableau / Tableur' },
      { id: 'liste', label: 'Liste structurée' },
      { id: 'code', label: 'Code / Script' },
      { id: 'email', label: 'Email / Message' },
      { id: 'presentation', label: 'Présentation / Slides' },
      { id: 'plan', label: 'Plan d\'action / Étapes' },
    ],
    placeholder: 'Précise le format ou la structure souhaitée...',
    required: false,
    categories: [],
  },
  {
    id: 'q_donnees',
    text: 'Quelles données ou informations as-tu déjà ?',
    type: 'checkbox',
    options: [
      { id: 'fichier', label: 'Un fichier ou document existant' },
      { id: 'donnees_brutes', label: 'Des données brutes (chiffres, texte)' },
      { id: 'exemples', label: 'Des exemples de ce que je veux' },
      { id: 'rien', label: 'Rien encore, je pars de zéro' },
    ],
    placeholder: 'Décris les données dont tu disposes...',
    required: false,
    helpText: 'Connaître tes données permet de mieux structurer le prompt.',
    categories: [],
  },
  {
    id: 'q_contraintes',
    text: 'Y a-t-il des contraintes particulières ?',
    type: 'checkbox',
    options: [
      { id: 'delai', label: 'Contrainte de délai / urgence' },
      { id: 'longueur', label: 'Limite de longueur' },
      { id: 'langue', label: 'Langue spécifique imposée' },
      { id: 'style', label: 'Style ou ton particulier' },
      { id: 'technique', label: 'Contraintes techniques' },
      { id: 'confidentialite', label: 'Données confidentielles à protéger' },
      { id: 'aucune', label: 'Aucune contrainte particulière' },
    ],
    placeholder: 'Détaille tes contraintes...',
    required: false,
    categories: [],
  },
  {
    id: 'q_qualite',
    text: 'Comment jugeras-tu la qualité du résultat ?',
    type: 'checkbox',
    options: [
      { id: 'precision', label: 'Précision et exactitude' },
      { id: 'clarte', label: 'Clarté et lisibilité' },
      { id: 'exhaustivite', label: 'Exhaustivité' },
      { id: 'concision', label: 'Concision' },
      { id: 'actionnable', label: 'Directement actionnable / utilisable' },
      { id: 'creatif', label: 'Originalité et créativité' },
    ],
    placeholder: 'Qu\'est-ce qui ferait un excellent résultat selon toi ?',
    required: false,
    categories: [],
  },
  // Questions spécifiques aux données
  {
    id: 'q_donnees_type',
    text: 'Quel type de données dois-tu traiter ?',
    type: 'checkbox',
    options: [
      { id: 'chiffres', label: 'Données chiffrées / Statistiques' },
      { id: 'texte', label: 'Données textuelles' },
      { id: 'dates', label: 'Données temporelles / Dates' },
      { id: 'geographiques', label: 'Données géographiques' },
      { id: 'financieres', label: 'Données financières' },
      { id: 'clients', label: 'Données clients / CRM' },
    ],
    placeholder: 'Décris plus précisément tes données...',
    required: false,
    categories: ['analyse', 'excel'],
    showIf: { questionId: 'q_objectif', containsAny: ['analyser', 'creer_tableau'] },
  },
  // Questions spécifiques à la rédaction
  {
    id: 'q_redaction_type',
    text: 'Quel type de texte souhaites-tu rédiger ?',
    type: 'radio',
    options: [
      { id: 'article', label: 'Article / Blog' },
      { id: 'rapport', label: 'Rapport / Compte-rendu' },
      { id: 'courrier', label: 'Courrier / Lettre formelle' },
      { id: 'marketing', label: 'Texte marketing / Publicitaire' },
      { id: 'technique', label: 'Documentation technique' },
      { id: 'creatif_texte', label: 'Texte créatif' },
    ],
    placeholder: 'Précise le type de texte et le sujet...',
    required: false,
    categories: ['redaction', 'marketing'],
    showIf: { questionId: 'q_objectif', containsAny: ['rediger'] },
  },
  // Question technique
  {
    id: 'q_tech_stack',
    text: 'Quelles technologies sont concernées ?',
    type: 'checkbox',
    options: [
      { id: 'python', label: 'Python' },
      { id: 'javascript', label: 'JavaScript / TypeScript' },
      { id: 'excel_vba', label: 'Excel / VBA' },
      { id: 'sql', label: 'SQL / Base de données' },
      { id: 'web', label: 'Web (HTML/CSS)' },
      { id: 'autre_tech', label: 'Autre technologie' },
    ],
    placeholder: 'Précise les outils et technologies que tu utilises...',
    required: false,
    categories: ['informatique'],
    showIf: { questionId: 'q_objectif', containsAny: ['developper', 'automatiser', 'resoudre'] },
  },
];

/**
 * Sélectionne les questions pertinentes en fonction de l'idée et des réponses précédentes.
 * Mode sans API : utilise les templates avec filtrage intelligent.
 */
export function getNextQuestions(
  idea: string,
  previousAnswers: QuestionAnswer[],
  detectedCategory?: string
): AdaptiveQuestion[] {
  const answeredIds = new Set(previousAnswers.map(a => a.questionId));

  return QUESTION_TEMPLATES
    .filter(t => {
      // Ne pas re-poser une question déjà répondue
      if (answeredIds.has(t.id)) return false;

      // Filtrer par catégorie si spécifié
      if (t.categories.length > 0 && detectedCategory) {
        if (!t.categories.includes(detectedCategory)) return false;
      }

      // Vérifier les conditions d'affichage
      if (t.showIf) {
        const prevAnswer = previousAnswers.find(a => a.questionId === t.showIf!.questionId);
        if (!prevAnswer) return false;
        const hasMatch = t.showIf.containsAny.some(
          keyword => prevAnswer.selectedOptions.includes(keyword) ||
                     prevAnswer.freeText.toLowerCase().includes(keyword)
        );
        if (!hasMatch) return false;
      }

      return true;
    })
    .map(t => ({
      id: t.id,
      text: t.text,
      type: t.type,
      options: t.options.map(o => ({ id: o.id, label: o.label })),
      placeholder: t.placeholder,
      required: t.required,
      helpText: t.helpText,
    }));
}

/**
 * Détecte la catégorie probable à partir de l'idée exprimée
 */
export function detectCategory(idea: string): string {
  const lower = idea.toLowerCase();

  const patterns: Record<string, string[]> = {
    analyse: ['analyser', 'analyse', 'statistique', 'données', 'graphique', 'kpi', 'rapport chiffré'],
    excel: ['excel', 'tableur', 'formule', 'cellule', 'colonne', 'feuille de calcul', 'xlsx', 'csv', 'tableau croisé'],
    commerce: ['vente', 'stock', 'client', 'facteur', 'facture', 'prix', 'commande', 'magasin', 'commerce', 'fournisseur', 'devis'],
    redaction: ['rédiger', 'écrire', 'texte', 'article', 'lettre', 'mail', 'email', 'courrier', 'blog', 'contenu'],
    informatique: ['code', 'programme', 'script', 'développer', 'application', 'bug', 'erreur', 'api', 'base de données', 'site web'],
    marketing: ['marketing', 'publicité', 'campagne', 'audience', 'conversion', 'réseaux sociaux', 'seo', 'branding'],
    travail: ['réunion', 'projet', 'planning', 'organisation', 'processus', 'workflow', 'gestion'],
    personnel: ['personnel', 'cv', 'voyage', 'recette', 'hobby', 'apprentissage'],
  };

  let bestMatch = 'autre';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(patterns)) {
    const score = keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }

  return bestMatch;
}

/**
 * Détecte les problèmes potentiels avant la génération
 */
export function detectIssues(
  idea: string,
  answers: QuestionAnswer[]
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];

  // Vérifier si l'objectif est défini
  const objectifAnswer = answers.find(a => a.questionId === 'q_objectif');
  if (!objectifAnswer || (objectifAnswer.selectedOptions.length === 0 && !objectifAnswer.freeText.trim())) {
    issues.push({
      type: 'missing',
      severity: 'critical',
      message: 'L\'objectif principal n\'est pas clairement défini.',
      suggestion: 'Précise ce que tu souhaites obtenir concrètement.',
    });
  }

  // Vérifier le format de sortie
  const formatAnswer = answers.find(a => a.questionId === 'q_format');
  if (!formatAnswer || (formatAnswer.selectedOptions.length === 0 && !formatAnswer.freeText.trim())) {
    issues.push({
      type: 'missing',
      severity: 'important',
      message: 'Le format de sortie souhaité n\'est pas précisé.',
      suggestion: 'Indiquer le format attendu (texte, tableau, code...) améliorera la précision du résultat.',
    });
  }

  // Vérifier la cohérence
  if (objectifAnswer && formatAnswer) {
    const wantsCode = objectifAnswer.selectedOptions.includes('developper');
    const formatIsText = formatAnswer.selectedOptions.includes('texte') &&
                         !formatAnswer.selectedOptions.includes('code');
    if (wantsCode && formatIsText) {
      issues.push({
        type: 'contradiction',
        severity: 'important',
        message: 'Tu souhaites développer quelque chose mais le format choisi est "texte". Voulais-tu dire "code" ?',
      });
    }
  }

  // Vérifier si l'idée est trop vague
  if (idea.split(' ').length < 5) {
    issues.push({
      type: 'ambiguity',
      severity: 'minor',
      message: 'Ta description initiale est assez courte. Des détails supplémentaires pourraient améliorer le résultat.',
      suggestion: 'Essaie de décrire plus précisément ce que tu veux obtenir.',
    });
  }

  // Vérifier les questions ignorées importantes
  const skippedRequired = answers.filter(a => a.skipped && a.questionId === 'q_objectif');
  if (skippedRequired.length > 0) {
    issues.push({
      type: 'missing',
      severity: 'critical',
      message: 'Des questions importantes ont été passées sans réponse.',
    });
  }

  return issues;
}

/**
 * Construit le récapitulatif à partir des réponses
 */
export function buildSummary(idea: string, answers: QuestionAnswer[]): SummaryItem[] {
  const items: SummaryItem[] = [
    {
      label: 'Idée / Besoin',
      value: idea,
      status: 'confirmed',
      editable: true,
    },
  ];

  for (const answer of answers) {
    if (answer.skipped) continue;

    const parts: string[] = [];
    if (answer.selectedOptions.length > 0) {
      parts.push(answer.selectedOptions.join(', '));
    }
    if (answer.freeText.trim()) {
      parts.push(answer.freeText.trim());
    }

    if (parts.length > 0) {
      items.push({
        label: answer.questionText,
        value: parts.join(' — '),
        status: answer.adviseMeSelected ? 'hypothesis' : 'confirmed',
        editable: true,
      });
    }
  }

  return items;
}
