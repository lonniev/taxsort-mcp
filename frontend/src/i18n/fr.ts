/** Les mots de TaxSort en français. Voir en.ts pour les règles. */

import type { Translation } from "./en.ts";

const fr: Translation = {
  // ─── ui ───
  "ui.app.welcome": "Tes transactions, triées par ligne IRS, gardées sous ta clé.",
  "ui.app.loading": "Chargement…",
  "ui.app.signedOutNote": "Pas d'e-mail. Pas de mot de passe. Pas de KYC.",
  "ui.app.privacyLink": "Politique de confidentialité",
  "ui.app.statusFailed": "Connexion MCP échouée",
  "ui.app.retry": "Réessayer",
  "ui.app.connecting": "Connexion à TaxSort MCP…",
  "ui.app.connected": "Connecté à <service/> v{{version}}",
  "ui.app.fingerprintTitle": "Empreinte du npub de l'opérateur : vérifie qu'elle correspond aux DM de TaxSort",
  "ui.app.vaultNotConfigured": "(coffre pas encore configuré)",

  "ui.nav.sessions": "Sessions",
  "ui.nav.sessionsTitle": "Crée des sessions par année fiscale et passe de l'une à l'autre",
  "ui.nav.import": "Importer",
  "ui.nav.importTitle": "Envoyer des fichiers CSV bancaires",
  "ui.nav.accounts": "Comptes",
  "ui.nav.accountsTitle": "Indique le type des comptes, vois les alias et les transactions",
  "ui.nav.transactions": "Transactions",
  "ui.nav.transactionsTitle": "Parcourir et chercher les transactions importées",
  "ui.nav.categorize": "→ Catégoriser →",
  "ui.nav.categorizeTitle": "Lancer la catégorisation par IA des transactions importées",
  "ui.nav.categorized": "Catégorisées",
  "ui.nav.categorizedTitle": "Voir les totaux par catégorie",
  "ui.nav.subscriptions": "Abonnements",
  "ui.nav.subscriptionsTitle": "Trouver les prélèvements récurrents et les fuites d'argent",
  "ui.nav.advisor": "Conseiller",
  "ui.nav.advisorTitle": "Pose tes questions sur TaxSort au conseiller financier",
  "ui.nav.taxCode": "Code fiscal",
  "ui.nav.taxCodeTitle": "Chercher les sections du code de l'IRS, article par article",
  "ui.nav.feedback": "Retours",
  "ui.nav.feedbackTitle": "Signaler un bug, demander une fonction, poser une question",
  "ui.nav.usage": "Usage et coûts",
  "ui.nav.usageTitle": "Usage de l'IA et coûts estimés",
  "ui.nav.wallet": "Portefeuille",
  "ui.nav.walletTitle": "Solde de crédit et recharges Lightning",
  "ui.nav.settings": "Réglages",
  "ui.nav.settingsTitle": "Délai de verrouillage, partage et à propos",
  "ui.nav.privacy": "Confidentialité",
  "ui.nav.privacyTitle": "Comment tes données sont protégées",
  "ui.nav.logOut": "Se déconnecter",
  "ui.nav.profile": "Profil",
  "ui.nav.session": "Session :",
  "ui.nav.collaborators_one": "{{count}} collaborateur",
  "ui.nav.collaborators_many": "{{count}} collaborateurs",
  "ui.nav.collaborators_other": "{{count}} collaborateurs",

  "ui.lock.title": "Session expirée",
  "ui.lock.pasteNsec": "Colle le nsec avec lequel tu t'es connecté pour continuer.",
  "ui.lock.enterPassphrase": "Saisis ta phrase secrète pour continuer. C'est celle que tu as envoyée en réponse quand tu t'es connecté par DM Nostr.",
  "ui.lock.passphrasePlaceholder": "Ta phrase secrète…",
  "ui.lock.wrongKey": "Ce n'est pas la clé avec laquelle ce navigateur s'est connecté.",
  "ui.lock.wrongPassphrase": "Phrase secrète incorrecte.",
  "ui.lock.verifying": "Vérification…",
  "ui.lock.unlock": "Déverrouiller",
  "ui.lock.signOut": "Se déconnecter (tu te reconnecteras)",

  // ─── views ───
  "views.common.refresh": "Actualiser",
  "views.common.cancel": "Annuler",
  "views.common.loading": "Chargement…",
  "views.common.saving": "Enregistrement…",
  "views.common.save": "Enregistrer",
  "views.common.done": "Terminé",
  "views.common.search": "Chercher",
  "views.common.clear": "Effacer",
  "views.common.applying": "Application…",
  "views.common.clearing": "Effacement…",
  "views.common.manual": "manuel",
  "views.common.rule": "règle",
  "views.common.transactions_one": "{{count}} transaction",
  "views.common.transactions_many": "{{count}} transactions",
  "views.common.transactions_other": "{{count}} transactions",

  "views.table.date": "Date",
  "views.table.description": "Description",
  "views.table.amount": "Montant",
  "views.table.account": "Compte",
  "views.table.category": "Catégorie",
  "views.table.all": "Toutes",
  "views.table.group": "Grouper",
  "views.table.groupOrder": "Ordre des groupes",
  "views.table.sortBy": "Trier par",
  "views.table.sortDirection": "Sens du tri",
  "views.table.groupNone": "Sans regroupement",
  "views.table.groupCategory": "Catégorie",
  "views.table.groupSubcategory": "Sous-catégorie",
  "views.table.groupTaxLine": "Ligne fiscale (IRS)",
  "views.table.groupMonth": "Mois",
  "views.table.groupAccount": "Compte",
  "views.table.groupMerchant": "Commerçant",
  "views.table.groupMonthCategory": "Mois + catégorie",
  "views.table.groupCategorySub": "Catégorie + sous-catégorie",
  "views.table.searchPlaceholder": "Chercher dans les descriptions (regex)…",
  "views.table.expandAll": "Tout déplier",
  "views.table.collapseAll": "Tout replier",
  "views.table.indistinguishable": "Doublon impossible à distinguer",
  "views.table.firstPage": "Première page",
  "views.table.lastPage": "Dernière page",
  "views.table.prev": "← Précédente",
  "views.table.next": "Suivante →",
  "views.table.page": "Page {{page}} sur {{pages}} ({{total}} au total)",

  "views.sessions.title": "Sessions fiscales",
  "views.sessions.closeSession": "Fermer la session",
  "views.sessions.new": "Nouvelle session",
  "views.sessions.newPlaceholder": "ex. Impôts 2025",
  "views.sessions.creating": "Création…",
  "views.sessions.create": "Créer →",
  "views.sessions.yours": "Tes sessions",
  "views.sessions.row_one": "{{count}} transaction · mise à jour le {{date}}",
  "views.sessions.row_many": "{{count}} transactions · mise à jour le {{date}}",
  "views.sessions.row_other": "{{count}} transactions · mise à jour le {{date}}",
  "views.sessions.none": "Pas encore de session. Crée-en une ci-dessus pour commencer.",
  "views.sessions.share": "Partage une session en utilisant le même npub sur plusieurs appareils.",

  "views.import.title": "Importer des transactions",
  "views.import.clearAll": "Effacer toutes les transactions…",
  "views.import.confirmClear": "Supprimer toutes les transactions et classifications ?",
  "views.import.yesClear": "Oui, effacer",
  "views.import.cleared": "{{transactions}} transactions et {{classifications}} classifications effacées.",
  "views.import.sources": "Sources importées",
  "views.import.confirmRemove": "Retirer les {{count}} transactions de « {{account}} » ?\nLeurs classifications seront aussi supprimées.",
  "views.import.removeTitle": "Retirer toutes les transactions de {{account}}",
  "views.import.drop": "Dépose des fichiers CSV ou clique pour parcourir",
  "views.import.assign": "Associe chaque fichier à un compte. Les fichiers qui portent le même nom de compte sont traités comme une même source.",
  "views.import.size": "{{size}} Ko",
  "views.import.account": "Compte :",
  "views.import.accountPlaceholder": "ex. Chase 8890",
  "views.import.grouped": "regroupé",
  "views.import.groupedTitle": "Plusieurs fichiers partagent ce nom de compte",
  "views.import.reading": "Lecture de {{file}}…",
  "views.import.importing": "Import de {{file}}…",
  "views.import.importingButton": "Import…",
  "views.import.importFiles": "Importer les fichiers",
  "views.import.results": "Résultats de l'import",
  "views.import.added": "{{count}} nouvelles",
  "views.import.deduped": "· {{count}} doublons retirés",
  "views.import.ambiguous": "· {{count}} ambiguës",
  "views.import.totalInSession_one": "{{count}} transaction dans la session",
  "views.import.totalInSession_many": "{{count}} transactions dans la session",
  "views.import.totalInSession_other": "{{count}} transactions dans la session",
  "views.import.reviewAccounts": "Vérifier les comptes →",
  "views.import.classify": "Classer avec Claude →",
  "views.import.viewTransactions": "Voir les transactions",

  "views.accounts.title": "Comptes",
  "views.accounts.intro": "Indique le type de chaque compte pour que le classificateur repère les doublons venant d'exports CSV qui se chevauchent et les virements entre tes propres comptes. Choisis les types <b>avant</b> de classer pour de meilleurs résultats.",
  "views.accounts.loading": "Chargement des comptes…",
  "views.accounts.empty": "Aucune transaction importée. Importe d'abord des CSV.",
  "views.accounts.aliases": "Alias de comptes détectés (mêmes 4 derniers chiffres)",
  "views.accounts.aliasesNote": "Le classificateur traite les transactions des comptes alias comme des doublons possibles.",
  "views.accounts.sources": "Sources :",
  "views.accounts.loadingTransactions": "Chargement des transactions…",
  "views.accounts.noTransactions": "Aucune transaction trouvée.",
  "views.accounts.type.bank": "Banque",
  "views.accounts.type.bankHint": "Compte courant ou d'épargne",
  "views.accounts.type.card": "Carte",
  "views.accounts.type.cardHint": "Carte de crédit ou de débit",
  "views.accounts.type.investment": "Placement",
  "views.accounts.type.investmentHint": "Courtage ou crypto",
  "views.accounts.type.loan": "Prêt",
  "views.accounts.type.loanHint": "Immobilier, auto, études",
  "views.accounts.type.unknown": "Inconnu",
  "views.accounts.type.unknownHint": "Pas encore catégorisé",

  "views.transactions.title": "Transactions",
  "views.transactions.about": "Transactions montre les lignes de tes CSV telles qu'importées, avant catégorisation : le journal comptable brut.",
  "views.transactions.loadFailed": "Impossible de charger les transactions",
  "views.transactions.show": "Afficher",
  "views.transactions.scopeAll": "Toutes les transactions",
  "views.transactions.scopeTax": "Éléments fiscaux (Sch A + C)",
  "views.transactions.scopeC": "Schedule C seulement",
  "views.transactions.scopeA": "Schedule A seulement",
  "views.transactions.amountPlaceholder": "ex. <-95, [0..10), !33",
  "views.transactions.amountTitle": "Filtre de montant : <, <=, >, >=, =, !=, !N, not N, gt/gte/lt/lte/eq/neq N, [lo..hi), (lo..hi], lo..hi",
  "views.transactions.clearFilters": "Effacer les filtres",
  "views.transactions.subFilter": "Filtré par sous-catégorie : <b>{{sub}}</b>",
  "views.transactions.noMatch": "Aucune transaction ne correspond à ce filtre.",
  "views.transactions.ambiguousInCsv": "Doublon impossible à distinguer dans le CSV",
  "views.transactions.classification": "Classification",
  "views.transactions.removeTitle": "Retirer la classification",
  "views.transactions.confirmRevert": "Retirer la classification ? La transaction redevient non catégorisée.",
  "views.transactions.findSimilar": "Trouver des transactions semblables",
  "views.transactions.ruleHeading": "Créer une règle ?",
  "views.transactions.ruleApply": "Appliquer <b>{{category}} / {{sub}}</b> aux transactions qui correspondent à cette regex :",
  "views.transactions.saveRule": "Enregistrer la règle",
  "views.transactions.skip": "Passer",
  "views.transactions.ruleSaved": "Règle enregistrée : <code>/{{pattern}}/</code> → {{category}} / {{sub}}",
  "views.transactions.applyAll": "Appliquer à toutes celles qui correspondent",
  "views.transactions.ruleApplied_one": "Règle appliquée : {{count}} transaction mise à jour",
  "views.transactions.ruleApplied_many": "Règle appliquée : {{count}} transactions mises à jour",
  "views.transactions.ruleApplied_other": "Règle appliquée : {{count}} transactions mises à jour",

  "views.classify.title": "Catégoriser",
  "views.classify.total": "Total",
  "views.classify.categorized": "Catégorisées",
  "views.classify.uncategorized": "Non catégorisées",
  "views.classify.running": "Catégorisation…",
  "views.classify.paused": "En pause",
  "views.classify.complete": "Terminé",
  "views.classify.importFirst": "Importe d'abord des transactions",
  "views.classify.ready": "Prêt à catégoriser",
  "views.classify.error": "Une erreur s'est produite",
  "views.classify.usage": "Usage de l'IA :",
  "views.classify.calls": "{{count}} appels",
  "views.classify.tokensIn": "{{count}} en entrée",
  "views.classify.tokensOut": "{{count}} en sortie",
  "views.classify.tokensTotal": "{{count}} jetons au total",
  "views.classify.runHeading": "Lancer la catégorisation par Claude AI",
  "views.classify.runIntro": "Catégorise les transactions qui ne le sont pas encore avec Claude, directement depuis ton navigateur. Les règles passent d'abord, puis l'IA catégorise le reste.",
  "views.classify.categorizeN": "Catégoriser {{count}} non catégorisées",
  "views.classify.allDone": "Tout est classé",
  "views.classify.confirmRecategorize": "Recatégoriser les {{count}} transactions ?\n\nClaude AI repasse sur chaque transaction, y compris celles déjà catégorisées et celles modifiées à la main. Fais-le quand les règles se sont améliorées.",
  "views.classify.recategorizeAll": "Tout recatégoriser ({{count}})",
  "views.classify.confirmReset": "Supprimer toutes les catégorisations ? Les transactions sont conservées.",
  "views.classify.resetDone": "{{count}} classifications effacées.",
  "views.classify.resetAll": "Réinitialiser toutes les catégories",
  "views.classify.importFirstDot": "Importe d'abord des transactions.",
  "views.classify.pause": "Mettre en pause",
  "views.classify.resume": "Reprendre la catégorisation",
  "views.classify.pausedAt": "En pause à {{pct}} %",
  "views.classify.refreshStats": "Actualiser les chiffres",
  "views.classify.rulesHeading": "Règles de catégorisation",
  "views.classify.applyNow": "Appliquer les règles",
  "views.classify.newRule": "+ Nouvelle règle",
  "views.classify.rulesIntro": "Les règles donnent une catégorie aux transactions importées en reconnaissant des motifs dans la description. Elles ne touchent pas aux données importées : les catégories sont gardées à part. « Appliquer les règles » repasse chaque règle sur chaque transaction. Clique sur une règle pour la modifier.",
  "views.classify.applied_one": "Règles appliquées : {{count}} transaction mise à jour.",
  "views.classify.applied_many": "Règles appliquées : {{count}} transactions mises à jour.",
  "views.classify.applied_other": "Règles appliquées : {{count}} transactions mises à jour.",
  "views.classify.searchRules": "Chercher dans les règles (motif, catégorie, sous-catégorie)…",
  "views.classify.patternLabel": "Motif de description (regex, sans tenir compte de la casse)",
  "views.classify.matches_one": "{{count}} correspondance",
  "views.classify.matches_many": "{{count}} correspondances",
  "views.classify.matches_other": "{{count}} correspondances",
  "views.classify.checking": "vérification…",
  "views.classify.patternPlaceholder": "ex. mr cooper|nationstar|rocket mortgage",
  "views.classify.category": "Catégorie",
  "views.classify.subcategory": "Sous-catégorie ({{count}})",
  "views.classify.subcategoryCustom": "Sous-catégorie ({{count}} + {{custom}} perso)",
  "views.classify.select": "Choisir…",
  "views.classify.amountFilter": "Filtre de montant",
  "views.classify.any": "Tous",
  "views.classify.amountValue": "Valeur du montant",
  "views.classify.renameTo": "Renommer en (facultatif)",
  "views.classify.renamePlaceholder": "Nouvelle description",
  "views.classify.updateRule": "Mettre à jour la règle",
  "views.classify.saveRule": "Enregistrer la règle",
  "views.classify.noRules": "Pas encore de règle.",
  "views.classify.ruleAmount": "montant {{op}} {{value}}",
  "views.classify.ruleRename": "renommer : « {{name}} »",
  "views.classify.customHeading": "Catégories personnalisées",
  "views.classify.newCategory": "+ Nouvelle catégorie",
  "views.classify.customIntro": "Ajoute les sous-catégories qui manquent à la liste intégrée. Le catégoriseur IA les apprend aussi.",
  "views.classify.customCategoryPlaceholder": "ex. Personal",
  "views.classify.subcategoryLabel": "Sous-catégorie",
  "views.classify.customSubPlaceholder": "ex. Essence",
  "views.classify.addCategory": "Ajouter la catégorie",
  "views.classify.noCustom": "Pas de catégorie personnalisée. Les catégories intégrées couvrent la plupart des cas.",
  "views.classify.errors": "Erreurs de catégorisation",
  "views.classify.recent": "Catégorisées récemment",

  "views.donut.classified": "Classées",
  "views.donut.needsReview": "À revoir",
  "views.donut.other": "Autres",

  "views.reason.duplicateOf": "doublon de",
  "views.reason.twin": "jumelle",
  "views.reason.goTo": "Aller à la transaction {{id}}",

  "views.summary.title": "Catégorisées",
  "views.summary.about": "Catégorisées montre ton activité catégorisée par l'IA : le journal comptable une fois que les règles et l'IA ont donné les catégories fiscales.",
  "views.summary.count": "{{count}} catégorisées",
  "views.summary.noMatch": "Aucune transaction catégorisée ne correspond à ce filtre.",

  "views.subscriptions.title": "Abonnements",
  "views.subscriptions.lede": "Trouve les prélèvements récurrents et les fuites d'argent oubliées",
  "views.subscriptions.scanning": "Analyse…",
  "views.subscriptions.rescan": "Relancer",
  "views.subscriptions.scan": "Chercher les abonnements",
  "views.subscriptions.phase.fetching": "Chargement des transactions…",
  "views.subscriptions.phase.analyzing": "Recherche des motifs récurrents…",
  "views.subscriptions.phase.enriching": "Recherche des liens de résiliation…",
  "views.subscriptions.working": "En cours…",
  "views.subscriptions.recurring": "Abonnements récurrents",
  "views.subscriptions.spent": "Total dépensé (dans les données)",
  "views.subscriptions.projected": "Coût annuel prévu",
  "views.subscriptions.none": "Aucun abonnement récurrent trouvé. Bravo !",
  "views.subscriptions.freq.daily": "quotidien",
  "views.subscriptions.freq.weekly": "hebdomadaire",
  "views.subscriptions.freq.monthly": "mensuel",
  "views.subscriptions.freq.quarterly": "trimestriel",
  "views.subscriptions.freq.annual": "annuel",
  "views.subscriptions.per.daily": "/jour",
  "views.subscriptions.per.weekly": "/semaine",
  "views.subscriptions.per.monthly": "/mois",
  "views.subscriptions.per.quarterly": "/trimestre",
  "views.subscriptions.per.annual": "/an",
  "views.subscriptions.perYear": "{{amount}}/an",
  "views.subscriptions.charges_one": "{{count}} prélèvement",
  "views.subscriptions.charges_many": "{{count}} prélèvements",
  "views.subscriptions.charges_other": "{{count}} prélèvements",
  "views.subscriptions.firstSeen": "Vu la première fois :",
  "views.subscriptions.lastSeen": "Vu la dernière fois :",
  "views.subscriptions.totalSpent": "Total dépensé :",
  "views.subscriptions.cancel": "Résilier / se désabonner →",
  "views.subscriptions.cancelVia": "Résilier par {{method}}",
  "views.subscriptions.noCancelInfo": "Pas d'information de résiliation",
  "views.subscriptions.emptyIntro": "Analyse tes transactions importées pour trouver les abonnements récurrents.",
  "views.subscriptions.emptyNote": "Elle repère les rythmes quotidiens, hebdomadaires, mensuels, trimestriels et annuels, et cherche les liens de résiliation quand elle le peut.",

  "views.advisor.title": "Conseiller financier",
  "views.advisor.lede": "Pose-moi n'importe quelle question sur TaxSort",
  "views.advisor.whatToAsk": "Que puis-je demander ?",
  "views.advisor.thinking": "Réflexion…",
  "views.advisor.placeholder": "Pose ta question au conseiller financier…",
  "views.advisor.ask": "Demander",
  "views.advisor.error": "Erreur : {{error}}",
  "views.advisor.you": "M",
  "views.advisor.prompt.1": "Que peut faire TaxSort pour moi ?",
  "views.advisor.prompt.2": "Comment importer mes transactions bancaires ?",
  "views.advisor.prompt.3": "Quelle est la différence entre le Schedule A et le Schedule C ?",
  "views.advisor.prompt.4": "Comment marche la classification ?",
  "views.advisor.prompt.5": "Que faire après avoir importé les CSV ?",
  "views.advisor.prompt.6": "Comment partager ma session avec mon conjoint ?",
  "views.advisor.prompt.7": "Que veut dire « ambiguë » sur une transaction importée ?",
  "views.advisor.prompt.8": "Comment corriger une classification avec laquelle je ne suis pas d'accord ?",
  "views.advisor.fact.1": "L'IRS traite plus de 150 millions de déclarations individuelles chaque année.",
  "views.advisor.fact.2": "Le code fiscal américain fait plus de 10 000 pages. Les règlements en ajoutent plus de 80 000.",
  "views.advisor.fact.3": "La déduction pour bureau à domicile peut faire économiser plus de 1 500 $ par an aux indépendants.",
  "views.advisor.fact.4": "Les Américains passent 6,5 milliards d'heures par an à se conformer à l'impôt.",
  "views.advisor.fact.5": "Le patron d'une petite entreprise passe en moyenne 240 heures par an sur ses impôts.",
  "views.advisor.fact.6": "La Section 179 permet de déduire le coût total d'un équipement admissible l'année de son achat.",
  "views.advisor.fact.7": "La déduction standard pour 2025 est de 15 000 $ pour une personne seule et de 30 000 $ pour un couple marié déclarant ensemble.",
  "views.advisor.fact.8": "Les repas d'affaires sont déductibles à 50 % selon l'IRC §274(n). Ils l'ont été brièvement à 100 % en 2021-2022.",
  "views.advisor.fact.9": "Le plafond de 10 000 $ de la déduction SALT est arrivé avec le Tax Cuts and Jobs Act de 2017.",
  "views.advisor.fact.10": "L'impôt des travailleurs indépendants est de 15,3 % : 12,4 % pour la Social Security et 2,9 % pour Medicare.",
  "views.advisor.fact.11": "L'IRS estime à 688 milliards de dollars par an l'écart fiscal : l'impôt dû mais non payé.",
  "views.advisor.fact.12": "Les dons à des œuvres peuvent compenser jusqu'à 60 % de ton revenu brut ajusté.",
  "views.advisor.fact.13": "Le premier impôt sur le revenu américain a été levé en 1861 pour financer la guerre de Sécession.",
  "views.advisor.fact.14": "Albert Einstein aurait dit : « La chose la plus difficile à comprendre au monde, c'est l'impôt sur le revenu. »",
  "views.advisor.fact.15": "Environ 10 % seulement des contribuables détaillent leurs déductions. Les autres prennent la déduction standard.",
  "views.advisor.fact.16": "Les acomptes trimestriels sont dus le 15 avril, le 15 juin, le 15 septembre et le 15 janvier.",

  "views.researcher.title": "Chercheur du code fiscal",
  "views.researcher.lede": "Le code de l'IRS, article par article",
  "views.researcher.whatToResearch": "Que puis-je chercher ?",
  "views.researcher.researching": "Recherche…",
  "views.researcher.placeholder": "Pose ta question sur le code fiscal de l'IRS…",
  "views.researcher.research": "Chercher",
  "views.researcher.attributed": "attribué à {{name}}",
  "views.researcher.prompt.1": "Puis-je déduire la facture internet de mon bureau à domicile ?",
  "views.researcher.prompt.2": "Quelles sont les règles pour déduire les repas d'affaires ?",
  "views.researcher.prompt.3": "Quel est le plafond de la déduction SALT et quelle section du code le fixe ?",
  "views.researcher.prompt.4": "Puis-je déduire mes primes d'assurance santé sur le Schedule C ?",
  "views.researcher.prompt.5": "Qu'est-ce qui compte comme don à une œuvre selon l'IRC §170 ?",
  "views.researcher.prompt.6": "Qu'est-ce que le seuil de 7,5 % de l'AGI pour les frais médicaux ?",
  "views.researcher.prompt.7": "Puis-je déduire les kilomètres parcourus pour aller voir des clients ?",
  "views.researcher.prompt.8": "Quelles sont les règles d'amortissement du matériel professionnel ?",
  "views.researcher.quote.misesBoom": "Il n'y a aucun moyen d'éviter l'effondrement final d'un boom provoqué par l'expansion du crédit.",
  "views.researcher.quote.hemingway": "La première panacée d'une nation mal gérée est l'inflation de la monnaie ; la seconde est la guerre.",
  "views.researcher.quote.friedman": "L'inflation est un impôt sans loi.",
  "views.researcher.quote.morgan": "L'or est de la monnaie. Tout le reste est du crédit.",
  "views.researcher.quote.colbert": "L'art de l'imposition consiste à plumer l'oie pour obtenir le plus possible de plumes avec le moins possible de cris.",
  "views.researcher.quote.bastiat": "L'État, c'est la grande fiction à travers laquelle tout le monde s'efforce de vivre aux dépens de tout le monde.",
  "views.researcher.quote.goldwater": "L'impôt sur le revenu a fait plus de criminels qu'aucun autre acte du gouvernement.",
  "views.researcher.quote.parker": "Si tu veux savoir ce que Dieu pense de l'argent, regarde seulement les gens à qui il l'a donné.",
  "views.researcher.quote.lenin": "Le moyen d'écraser la bourgeoisie est de la broyer entre les meules de l'impôt et de l'inflation.",
  "views.researcher.quote.greenspan": "Sans l'étalon-or, il n'y a aucun moyen de protéger l'épargne de la confiscation par l'inflation.",
  "views.researcher.quote.cicero": "Le budget doit être équilibré, le Trésor renfloué, la dette publique réduite.",
  "views.researcher.quote.paul": "La banque centrale est une forme de socialisme. C'est la socialisation de la monnaie et du crédit.",
  "views.researcher.quote.voltaire": "Le papier-monnaie finit toujours par retrouver sa valeur intrinsèque : zéro.",
  "views.researcher.quote.galbraith": "L'étude de la monnaie est, plus que tout autre domaine de l'économie, celui où la complexité sert à déguiser la vérité ou à l'éviter.",
  "views.researcher.quote.ammous": "La monnaie fiduciaire est la cause première de toutes les crises économiques.",
  "views.researcher.quote.gates": "Bitcoin est un tour de force technologique.",
  "views.researcher.quote.satoshi": "Le problème de fond de la monnaie classique, c'est toute la confiance qu'il faut pour qu'elle fonctionne.",
  "views.researcher.quote.shaw": "Un gouvernement qui vole Pierre pour payer Paul peut toujours compter sur le soutien de Paul.",

  "views.feedback.title": "Retours",
  "views.feedback.submitHeading": "Envoyer un retour",
  "views.feedback.intro": "Les signalements de bug, demandes de fonction et questions sont suivis comme Issues GitHub. Tu n'as pas besoin de compte GitHub.",
  "views.feedback.cat.feedback": "Retour général",
  "views.feedback.cat.bug": "Bug",
  "views.feedback.cat.feature": "Demande de fonction",
  "views.feedback.cat.question": "Question",
  "views.feedback.titlePlaceholder": "Résumé court…",
  "views.feedback.bodyPlaceholder": "Décris le problème, l'idée ou la question…",
  "views.feedback.submitting": "Envoi…",
  "views.feedback.submit": "Envoyer",
  "views.feedback.failed": "Impossible de créer l'issue.",
  "views.feedback.recent": "Issues récentes",
  "views.feedback.state.open": "ouverte",
  "views.feedback.state.closed": "fermée",
  "views.feedback.state.submitted": "envoyée",
  "views.feedback.comments_one": "{{count}} commentaire",
  "views.feedback.comments_many": "{{count}} commentaires",
  "views.feedback.comments_other": "{{count}} commentaires",
  "views.feedback.none": "Pas encore de retour.",

  "views.settings.title": "Réglages",
  "views.settings.timeout": "Délai de verrouillage",
  "views.settings.timeoutIntro": "Verrouille l'appli après un moment sans activité. Pour la déverrouiller, il faut ta phrase secrète (celle de ta connexion).",
  "views.settings.minutes_one": "{{count}} minute",
  "views.settings.minutes_many": "{{count}} minutes",
  "views.settings.minutes_other": "{{count}} minutes",
  "views.settings.hour": "1 heure",
  "views.settings.never": "Jamais",
  "views.settings.current": "Actuel : {{value}}",
  "views.settings.noTimeout": "Pas de délai",
  "views.settings.currentSession": "Session en cours",
  "views.settings.about": "À propos",
  "views.settings.aboutWhat": "TaxSort MCP : classificateur de transactions pour les Schedules A et C",
  "views.settings.aboutPowered": "Propulsé par Tollbooth DPYC · Neon Postgres · Claude AI",
  "views.settings.identity": "Identité :",
  "views.settings.sharing": "Partage : utilise le même npub sur plusieurs appareils ou entre plusieurs personnes.",

  "views.profile.heading": "Profil",
  "views.profile.credit": "Solde de crédit",
  "views.profile.timezone": "Fuseau horaire",
  "views.profile.timezoneNote": "Enregistré sur cet appareil.",
  "views.profile.theme": "Thème",
  "views.profile.light": "Clair",
  "views.profile.dark": "Sombre",
  "views.profile.system": "Système",
  "views.profile.language": "Langue",
  "views.profile.aiHeading": "Usage de l'IA pour la classification",
  "views.profile.aiNone": "Aucune classification enregistrée pour l'instant.",
  "views.profile.unknownModel": "inconnu",
  "views.profile.runs": "Passes :",
  "views.profile.calls": "Appels :",
  "views.profile.input": "Entrée :",
  "views.profile.output": "Sortie :",
  "views.profile.cost": "Coût :",
  "views.profile.estimated": "Coût Anthropic estimé",
  "views.profile.tokensAcross": "{{tokens}} jetons sur {{calls}} appels d'API",
  "views.profile.inSats": "Équivalent en sats",
  "views.profile.sats": "{{count}} sats",
  "views.profile.atPrice": "à environ {{price}}/BTC",
  "views.profile.whyMatters": "<b>Pourquoi c'est important :</b> TaxSort utilise Claude AI pour classer les transactions. L'opérateur paie Anthropic pour cette capacité d'IA et répercute le coût sur les patrons par des micropaiements Lightning au Tollbooth.",
  "views.profile.transparency": "Tes crédits de péage couvrent le vrai coût de l'IA plus les frais de l'opérateur. Tu vois exactement ce que tu paies : pas de marge cachée, pas de piège d'abonnement.",

  "views.privacy.body": `# Politique de confidentialité de TaxSort

## Don't Pester Your Customer™ (DPYC™)

TaxSort repose sur la **philosophie DPYC™**, une vraie rupture avec la manière dont les logiciels traitent d'habitude leurs utilisateurs. Le principe est simple : *ton identité, tes données, ton argent, tes règles.*

Les produits SaaS habituels veulent ton nom, ton e-mail, ton numéro de téléphone, ton employeur, ton adresse et ta carte bancaire avant même que tu puisses les essayer. Ils vendent tes données à des courtiers, les partagent avec des « partenaires » et t'enferment dans des abonnements faits exprès pour être difficiles à résilier. Ils t'assaillent d'e-mails, de notifications et de pièges d'interface pensés pour tirer le plus de revenus du moins de valeur.

**DPYC™ refuse tout cela.**

---

## Pas de compte. Pas d'e-mail. Pas de KYC.

TaxSort ne sait **rien de ton identité réelle.** Nous ne demandons jamais ton :

- ❌ Nom
- ❌ Adresse e-mail
- ❌ Numéro de téléphone
- ❌ Adresse postale
- ❌ Numéro de sécurité sociale
- ❌ Pièce d'identité
- ❌ Carte de crédit
- ❌ Compte bancaire

Il n'y a **ni création de compte, ni formulaire d'inscription, ni mot de passe.** Il n'y a rien à pirater, rien à faire fuiter, rien à réclamer par voie judiciaire.

---

## Les clés Nostr : ton identité souveraine

Ton identité dans TaxSort est une **paire de clés Nostr** : une clé publique et une clé privée que tu crées toi-même, sur ton propre appareil, sans demander la permission à personne.

### Ton npub (clé publique)
- Une chaîne en bech32 qui commence par \`npub1...\`
- Tu peux la partager : c'est ainsi que TaxSort retrouve tes sessions et tes données
- Vois-la comme une adresse de boîte aux lettres : on peut y envoyer, mais toi seul peux l'ouvrir

### Ton nsec (clé privée)
- Une chaîne en bech32 qui commence par \`nsec1...\`
- **Ne quitte jamais ton appareil.** TaxSort ne la demande jamais, ne la voit jamais, ne la stocke jamais
- Sert à signer les messages Nostr, ce qui prouve que tu possèdes le npub correspondant
- Vois-la comme la clé de ta boîte aux lettres : la détenir prouve qu'elle est à toi

### Pourquoi des clés Nostr ?
- **Souveraines :** tu les crées. Aucune autorité ne les accorde ni ne les retire.
- **Portables :** elles marchent dans n'importe quelle appli Nostr. Elles ne sont pas liées à TaxSort.
- **Cryptographiques :** fondées sur la courbe elliptique secp256k1 (la même que Bitcoin). Infalsifiables.
- **Pseudonymes :** liées aux mathématiques, pas à un registre de l'État.

---

## Secure Courier : prouver la possession sans partager de secret

À ta première utilisation, nous vérifions que tu possèdes ton npub grâce à **Secure Courier**, un échange de DM Nostr chiffrés :

1. TaxSort envoie un message direct Nostr à ton npub
2. Tu réponds avec la phrase secrète de ton choix
3. Ta réponse est **signée avec ton nsec** (par ton client Nostr, automatiquement)
4. La signature prouve que tu possèdes le npub, sans jamais révéler ton nsec

C'est une **preuve d'identité à divulgation nulle.** Nous apprenons que quelqu'un détient la clé privée de ce npub. Nous n'apprenons rien d'autre sur cette personne.

### Ta phrase secrète protège tes données
La phrase secrète choisie à la vérification sert à dériver une clé de chiffrement pour les données fiscales de notre base. Cela veut dire :

- Les descriptions, montants et classifications de tes transactions sont chiffrés au repos
- La clé de chiffrement vient de *ta* phrase secrète : ce n'est pas nous qui la choisissons
- Si tu oublies ta phrase secrète, tes données ne peuvent pas être récupérées (c'est voulu)

---

## Verrouillage et déverrouillage

TaxSort se verrouille tout seul après une période sans activité que tu peux régler (15 minutes par défaut). Pour déverrouiller :

1. TaxSort envoie un DM Nostr à ton npub
2. Tu réponds "Approve Unlock"
3. Ta réponse signée prouve que c'est toujours toi devant le clavier

Ainsi, quelqu'un qui s'approche de ton appareil déverrouillé ne peut pas atteindre tes données fiscales. Le déverrouillage demande **ton nsec** (par ton client Nostr), pas un mot de passe qu'on pourrait deviner ou lire par-dessus ton épaule.

---

## Bitcoin Lightning : payer sans prestataire de paiement

TaxSort est payé par des **micropaiements Bitcoin Lightning** grâce au protocole Tollbooth DPYC™. Cela veut dire :

- **Pas de carte de crédit.** Ni Stripe, ni PayPal : aucun prestataire de paiement ne sait que tu utilises TaxSort.
- **Pas d'abonnement.** Tu prépaies un solde de crédit et tu paies à l'appel d'outil. Arrête quand tu veux.
- **Pas de paperasse de remboursement.** Les crédits inutilisés n'expirent pas avant 7 jours. Pas de renouvellement automatique.
- **Pas de surveillance des paiements.** Les paiements Lightning vont de personne à personne. Aucune ligne de relevé bancaire n'indique « TaxSort ».
- **Règlement instantané.** Les crédits arrivent en quelques secondes, pas en quelques jours.

### Le contrat social DPYC™
TaxSort fait partie du [contrat social DPYC™](https://github.com/lonniev/dpyc-community), un réseau de services MCP tenus de façon indépendante qui partagent ces principes. Chaque opérateur fait tourner son propre serveur, fixe ses propres prix et rend des comptes à ses propres patrons. Il n'y a ni autorité centrale, ni frais de plateforme, ni commission de magasin d'applis.

---

## Ce que nous stockons

| Donnée | Où | Chiffrée ? | Qui peut la lire ? |
|------|-------|-----------|-----------------|
| Ton npub | Neon Postgres | Non (elle est publique) | L'opérateur |
| État de la vérification | Neon Postgres | Non | L'opérateur |
| Empreinte de la phrase secrète | Neon Postgres | Hachage à sens unique | Personne |
| Sessions fiscales | Neon Postgres | Au repos | L'opérateur + toi |
| Transactions | Neon Postgres | Au repos | L'opérateur + toi |
| Classifications | Neon Postgres | Au repos | L'opérateur + toi |
| Solde de crédit | Neon Postgres | Chiffré | L'opérateur |
| Factures Lightning | BTCPay Server | Chiffrement BTCPay | L'opérateur |

**Nous ne stockons pas :** ton nsec, ton vrai nom, ton e-mail, ton adresse IP (Cloudflare s'occupe du routage), l'empreinte de ton navigateur, ni aucune statistique ou télémétrie.

---

## Ce que nous envoyons à Claude AI

Quand tu utilises Catégoriser ou les conseillers IA, les descriptions et montants de tes transactions partent vers l'API Claude d'Anthropic pour être classés. Cela veut dire :

- Anthropic traite le texte de tes transactions brièvement et ne le garde pas pour nous
- La [politique de conservation des données](https://www.anthropic.com/privacy) d'Anthropic s'applique
- Nous n'envoyons que le contexte nécessaire (date, description, montant, compte)
- Nous n'envoyons **pas** ton npub, ta phrase secrète ni rien qui t'identifie à Anthropic

---

## Ce que nous ne ferons jamais

- 🚫 Vendre tes données
- 🚫 Partager tes données avec des annonceurs
- 🚫 Exiger une pièce d'identité
- 🚫 Faire un signalement à une autorité (nous ne savons pas qui tu es)
- 🚫 T'envoyer des e-mails publicitaires (nous n'avons pas ton e-mail)
- 🚫 Renouveler un abonnement en douce (il n'y a pas d'abonnement)
- 🚫 T'empêcher d'accéder à tes données (elles sont liées à ton npub, que tu contrôles)
- 🚫 Rendre le départ difficile (exporte tes données quand tu veux, supprime ta session quand tu veux)

---

## Code ouvert et vérifiable

Le code source de TaxSort est ouvert :

- **Serveur MCP :** [github.com/lonniev/taxsort-mcp](https://github.com/lonniev/taxsort-mcp)
- **SDK Tollbooth :** [github.com/lonniev/tollbooth-dpyc](https://github.com/lonniev/tollbooth-dpyc)
- **Licence :** Apache 2.0

Tu peux vérifier exactement quelles données sont collectées, comment elles sont stockées et ce qui est envoyé où. Il n'y a ni statistiques cachées, ni pixels de suivi, ni scripts tiers.

---

*Don't Pester Your Customer™ : parce que tes données fiscales ne regardent que toi.*

*Inspiré de [The Phantom Tollbooth](https://en.wikipedia.org/wiki/The_Phantom_Tollbooth) de Norton Juster (1961).*
`,

  "lib.mcp.unknownError": "Erreur inconnue",
  "lib.classify.noKey": "Aucune clé d'API Anthropic disponible.",
  "lib.classify.parseFailed": "Tour {{round}} : impossible de lire la réponse de l'IA",
  "lib.classify.outOfCredits": "Le service de classification par IA n'a plus de crédits. Demande à l'opérateur de TaxSort de recharger son solde d'API Anthropic.",
  "lib.subscriptions.failed": "L'analyse des abonnements a échoué",
};

export default fr;
