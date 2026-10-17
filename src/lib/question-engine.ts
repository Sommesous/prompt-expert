// === MOTEUR DE QUESTIONS ADAPTATIF ===
// Fonctionne en deux modes :
// 1. Avec API Gemini : questions générées par IA, véritablement adaptatives
// 2. Sans API : questions basées sur des templates intelligents par catégorie
//
// Structure en 3 chapitres (comme une conversation avec un collègue) :
//   1. CONTEXTE  — qui es-tu, quel est ton objectif, dans quel cadre
//   2. TÂCHE     — ce qu'il faut faire concrètement, avec quelles données
//   3. RÈGLES    — format, ton, contraintes, exemples, exigence de précision

import { AdaptiveQuestion, QuestionAnswer, DetectedIssue, SummaryItem, QuestionChapter } from './types';

// === TEMPLATES DE QUESTIONS PAR CATÉGORIE ===

interface QuestionTemplate {
  id: string;
  text: string;
  type: 'checkbox' | 'radio';
  options: { id: string; label: string }[];
  placeholder: string;
  required: boolean;
  helpText?: string;
  chapter: QuestionChapter;
  /** Catégories pour lesquelles cette question s'applique. Vide = toutes */
  categories: string[];
  /** Condition : n'afficher que si une réponse précédente contient ces mots */
  showIf?: { questionId: string; containsAny: string[] };
}

const QUESTION_TEMPLATES: QuestionTemplate[] = [
  // ====================== CHAPITRE 1 : CONTEXTE ======================
  {
    id: 'q_objectif',
    text: 'Qu\'est-ce que tu cherches à accomplir, concrètement ?',
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
    placeholder: 'Pas besoin d\'être exhaustif, décris ça comme tu le dirais à un collègue...',
    required: true,
    chapter: 'contexte',
    categories: [],
  },
  {
    id: 'q_role',
    text: 'Je me mets dans la peau de qui, pour t\'aider sur ce coup-là ?',
    type: 'radio',
    options: [
      { id: 'expert_technique', label: 'Un expert technique' },
      { id: 'redacteur', label: 'Un rédacteur professionnel' },
      { id: 'analyste', label: 'Un analyste de données' },
      { id: 'consultant', label: 'Un consultant stratégique' },
      { id: 'formateur', label: 'Un formateur pédagogue' },
      { id: 'generaliste', label: 'Un assistant généraliste, pas besoin de rôle précis' },
    ],
    placeholder: 'Ou décris le profil exact si aucune case ne correspond...',
    required: false,
    helpText: 'Donner un rôle précis évite les réponses génériques — c\'est une des techniques qui marche le mieux.',
    chapter: 'contexte',
    categories: [],
  },
  {
    id: 'q_contexte',
    text: 'On se situe dans quel cadre ?',
    type: 'checkbox',
    options: [
      { id: 'pro', label: 'Professionnel / Entreprise' },
      { id: 'perso', label: 'Personnel' },
      { id: 'etude', label: 'Études / Formation' },
      { id: 'freelance', label: 'Freelance / Indépendant' },
    ],
    placeholder: 'Un peu plus de contexte sur ton environnement de travail...',
    required: false,
    helpText: 'Pro, perso, études... ça change pas mal de choses sur le ton et le niveau de détail.',
    chapter: 'contexte',
    categories: [],
  },
  {
    id: 'q_public',
    text: 'Et le résultat, il est destiné à qui au final ?',
    type: 'radio',
    options: [
      { id: 'moi', label: 'À moi uniquement' },
      { id: 'equipe', label: 'À mon équipe' },
      { id: 'direction', label: 'À la direction / hiérarchie' },
      { id: 'clients', label: 'À des clients' },
      { id: 'public', label: 'À un public large' },
    ],
    placeholder: 'Précise le destinataire si besoin...',
    required: false,
    chapter: 'contexte',
    categories: [],
  },

  // ====================== CHAPITRE 2 : TÂCHE ======================
  {
    id: 'q_donnees',
    text: 'Tu pars de quoi exactement ? Un fichier, des chiffres, ou carrément de zéro ?',
    type: 'checkbox',
    options: [
      { id: 'fichier', label: 'Un fichier ou document existant' },
      { id: 'donnees_brutes', label: 'Des données brutes (chiffres, texte)' },
      { id: 'exemples', label: 'Des exemples de ce que je veux' },
      { id: 'rien', label: 'Rien encore, je pars de zéro' },
    ],
    placeholder: 'Décris les données ou le point de départ dont tu disposes...',
    required: false,
    helpText: 'Ça m\'évite de deviner, et ça évite au prompt de partir dans le vide.',
    chapter: 'tache',
    categories: [],
  },
  {
    id: 'q_donnees_type',
    text: 'Tes données, elles ressemblent à quoi ?',
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
    chapter: 'tache',
    categories: ['analyse', 'excel'],
    showIf: { questionId: 'q_objectif', containsAny: ['analyser', 'creer_tableau'] },
  },
  {
    id: 'q_redaction_type',
    text: 'On rédige quel type de texte, précisément ?',
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
    chapter: 'tache',
    categories: ['redaction', 'marketing'],
    showIf: { questionId: 'q_objectif', containsAny: ['rediger'] },
  },
  {
    id: 'q_tech_stack',
    text: 'On touche à quelles technologies ?',
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
    chapter: 'tache',
    categories: ['informatique'],
    showIf: { questionId: 'q_objectif', containsAny: ['developper', 'automatiser', 'resoudre'] },
  },
  {
    id: 'q_exemples',
    text: 'Tu as un exemple du résultat attendu — même approximatif ?',
    type: 'radio',
    options: [
      { id: 'exemple_oui', label: 'Oui, je peux le décrire ou le coller' },
      { id: 'exemple_style', label: 'Non, mais je peux décrire le style attendu' },
      { id: 'exemple_non', label: 'Non, improvise' },
    ],
    placeholder: 'Colle ou décris ton exemple ici...',
    required: false,
    helpText: 'Montrer un exemple, même vague, c\'est souvent la technique la plus efficace pour éviter un résultat à côté de la plaque.',
    chapter: 'tache',
    categories: [],
  },

  // ====================== CHAPITRE 3 : RÈGLES ======================
  {
    id: 'q_format',
    text: 'Tu veux récupérer ça sous quelle forme ?',
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
    helpText: 'Sans ça, l\'IA devine la longueur et la forme — et devine rarement juste.',
    chapter: 'regles',
    categories: [],
  },
  {
    id: 'q_ton',
    text: 'Quel ton pour le résultat ?',
    type: 'checkbox',
    options: [
      { id: 'formel', label: 'Formel / Professionnel' },
      { id: 'neutre', label: 'Neutre / Factuel' },
      { id: 'conversationnel', label: 'Conversationnel / Accessible' },
      { id: 'commercial', label: 'Enthousiaste / Commercial' },
      { id: 'technique', label: 'Technique / Précis' },
    ],
    placeholder: 'Décris le ton si rien ne correspond...',
    required: false,
    helpText: 'Sans précision, je pars sur un ton neutre et professionnel par défaut.',
    chapter: 'regles',
    categories: [],
  },
  {
    id: 'q_contraintes',
    text: 'Des contraintes à connaître avant que je m\'y mette ?',
    type: 'checkbox',
    options: [
      { id: 'delai', label: 'Contrainte de délai / urgence' },
      { id: 'longueur', label: 'Limite de longueur' },
      { id: 'langue', label: 'Langue spécifique imposée' },
      { id: 'technique', label: 'Contraintes techniques' },
      { id: 'confidentialite', label: 'Données confidentielles à protéger' },
      { id: 'aucune', label: 'Aucune contrainte particulière' },
    ],
    placeholder: 'Détaille tes contraintes...',
    required: false,
    chapter: 'regles',
    categories: [],
  },
  {
    id: 'q_verification',
    text: 'La précision factuelle compte, ici ? (chiffres, dates, données réelles)',
    type: 'radio',
    options: [
      { id: 'critique', label: 'Oui, c\'est critique — aucune approximation' },
      { id: 'estimation', label: 'Une estimation raisonnable suffit' },
      { id: 'creatif', label: 'Non, c\'est plutôt libre ou créatif' },
    ],
    placeholder: 'Précise le niveau d\'exigence si besoin...',
    required: false,
    helpText: 'Si la précision compte, je vais explicitement demander à l\'IA de signaler ses incertitudes plutôt que d\'inventer.',
    chapter: 'regles',
    categories: [],
  },
  {
    id: 'q_qualite',
    text: 'Comment tu sauras que c\'est réussi ?',
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
    chapter: 'regles',
    categories: [],
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
      chapter: t.chapter,
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
 * Détecte les problèmes potentiels avant la génération.
 * S'appuie sur les erreurs les plus courantes en prompt engineering :
 * réponse trop générique (manque de contexte), longueur non précisée,
 * format flou, risque d'information inventée, ton non précisé.
 */
export function detectIssues(
  idea: string,
  answers: QuestionAnswer[]
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  const find = (id: string) => answers.find(a => a.questionId === id);
  const hasAnswer = (a?: QuestionAnswer) =>
    !!a && !a.skipped && (a.selectedOptions.length > 0 || a.freeText.trim().length > 0);

  const objectifAnswer = find('q_objectif');
  const formatAnswer = find('q_format');
  const roleAnswer = find('q_role');
  const tonAnswer = find('q_ton');
  const contraintesAnswer = find('q_contraintes');
  const verifAnswer = find('q_verification');
  const exemplesAnswer = find('q_exemples');

  // Objectif manquant (cause n°1 de réponse trop générique)
  if (!hasAnswer(objectifAnswer)) {
    issues.push({
      type: 'missing',
      severity: 'critical',
      message: 'L\'objectif principal n\'est pas clairement défini.',
      suggestion: 'Précise ce que tu souhaites obtenir concrètement — sans ça, le résultat risque d\'être générique.',
    });
  }

  // Rôle/audience absent → réponse générique probable
  if (!hasAnswer(roleAnswer)) {
    issues.push({
      type: 'suggestion',
      severity: 'minor',
      message: 'Aucun rôle précisé pour l\'IA.',
      suggestion: 'Sans rôle défini (expert, rédacteur, analyste...), le résultat reste souvent plus générique. Tu peux en choisir un dans le récapitulatif.',
    });
  }

  // Format manquant → longueur/forme devinée
  if (!hasAnswer(formatAnswer)) {
    issues.push({
      type: 'missing',
      severity: 'important',
      message: 'Le format de sortie souhaité n\'est pas précisé.',
      suggestion: 'Sans format précisé, l\'IA devine la longueur et la structure — indique le format attendu pour un résultat plus fiable.',
    });
  }

  // Ton non précisé
  if (!hasAnswer(tonAnswer)) {
    issues.push({
      type: 'suggestion',
      severity: 'minor',
      message: 'Aucun ton n\'a été précisé.',
      suggestion: 'Je vais utiliser un ton neutre et professionnel par défaut. Précise si tu veux autre chose.',
    });
  }

  // Pas d'exemple fourni
  if (!hasAnswer(exemplesAnswer)) {
    issues.push({
      type: 'suggestion',
      severity: 'minor',
      message: 'Aucun exemple du résultat attendu.',
      suggestion: 'Même un exemple approximatif aide beaucoup l\'IA à viser juste du premier coup.',
    });
  }

  // Précision factuelle critique → avertissement de transparence
  if (verifAnswer && verifAnswer.selectedOptions.includes('critique')) {
    issues.push({
      type: 'suggestion',
      severity: 'important',
      message: 'Tu as indiqué que la précision factuelle est critique.',
      suggestion: 'Le prompt généré va explicitement demander à l\'IA de signaler ses incertitudes plutôt que d\'inventer une réponse — mais pense à vérifier toi-même les informations sensibles.',
    });
  } else if (!hasAnswer(verifAnswer)) {
    issues.push({
      type: 'suggestion',
      severity: 'minor',
      message: 'Le niveau d\'exigence factuelle n\'a pas été précisé.',
      suggestion: 'Si des chiffres ou des faits précis sont en jeu, pense à le signaler pour réduire le risque d\'informations inventées.',
    });
  }

  // Aucune contrainte renseignée explicitement (différent de "aucune")
  if (!hasAnswer(contraintesAnswer)) {
    issues.push({
      type: 'suggestion',
      severity: 'minor',
      message: 'Aucune contrainte particulière signalée.',
      suggestion: 'Délai, longueur, langue... si rien ne s\'applique, pas de souci, sinon précise-le.',
    });
  }

  // Vérifier la cohérence objectif / format
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

  // Idée trop vague
  if (idea.split(' ').length < 5) {
    issues.push({
      type: 'ambiguity',
      severity: 'minor',
      message: 'Ta description initiale est assez courte. Des détails supplémentaires pourraient améliorer le résultat.',
      suggestion: 'Essaie de décrire plus précisément ce que tu veux obtenir.',
    });
  }

  // Questions critiques passées sans réponse
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
 * Construit le récapitulatif à partir des réponses.
 * Distingue toujours ce qui est confirmé par l'utilisateur de ce qui reste
 * une hypothèse (ex: réponse "conseille-moi") — pour rester transparent.
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
