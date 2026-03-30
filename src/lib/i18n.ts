// ============================================
// InsightGov Africa - Configuration i18n
// Support multi-langue (FR, EN, PT)
// ============================================

export const locales = ['fr', 'en', 'pt'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

// ============================================
// TRADUCTIONS
// ============================================

export const translations: Record<Locale, Record<string, string>> = {
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.dashboard': 'Tableau de bord',
    'nav.datasets': 'Données',
    'nav.settings': 'Paramètres',
    'nav.pricing': 'Tarifs',
    'nav.login': 'Connexion',
    'nav.logout': 'Déconnexion',
    'nav.register': 'Créer un compte',

    // Landing Page
    'landing.hero.title': 'Dashboards IA pour l\'Afrique',
    'landing.hero.subtitle': 'Transformez vos données en insights actionnables en quelques minutes',
    'landing.hero.cta': 'Commencer gratuitement',
    'landing.hero.demo': 'Voir la démo',

    'landing.features.title': 'Fonctionnalités puissantes',
    'landing.features.subtitle': 'Tout ce dont vous avez besoin pour vos décisions data-driven',

    'landing.features.ai.title': 'Analyse IA automatique',
    'landing.features.ai.desc': 'GPT-4o analyse vos données et suggère les KPIs pertinents pour votre secteur',

    'landing.features.upload.title': 'Import facile',
    'landing.features.upload.desc': 'Uploadez vos fichiers CSV ou Excel, nous nous occupons du reste',

    'landing.features.visual.title': 'Visualisations pro',
    'landing.features.visual.desc': 'Graphiques interactifs et dashboards professionnels avec Tremor',

    'landing.features.share.title': 'Partage simplifié',
    'landing.features.share.desc': 'Partagez vos dashboards avec un simple lien, même sans compte',

    'landing.features.export.title': 'Exports multiples',
    'landing.features.export.desc': 'Exportez en PDF ou Excel pour vos rapports et présentations',

    'landing.features.secure.title': 'Sécurisé',
    'landing.features.secure.desc': 'Isolation des données par organisation, conformité RGPD',

    // Sectors
    'landing.sectors.title': 'Adapté à votre secteur',
    'landing.sectors.health': 'Santé',
    'landing.sectors.health.desc': 'Ministères, hôpitaux, programmes de santé publique',
    'landing.sectors.education': 'Éducation',
    'landing.sectors.education.desc': 'Ministères, écoles, universités',
    'landing.sectors.finance': 'Finance',
    'landing.sectors.finance.desc': 'Banques, microfinance, assurances',
    'landing.sectors.agriculture': 'Agriculture',
    'landing.sectors.agriculture.desc': 'Ministères, coopératives, projets ruraux',

    // Pricing
    'pricing.title': 'Choisissez votre plan',
    'pricing.subtitle': 'Des solutions adaptées aux Ministères, ONG et Entreprises africaines',
    'pricing.monthly': 'Mensuel',
    'pricing.annual': 'Annuel',
    'pricing.annual.discount': '-20%',
    'pricing.popular': 'Le plus populaire',
    'pricing.current': 'Plan actuel',
    'pricing.choose': 'Choisir ce plan',
    'pricing.contact': 'Nous contacter',

    'pricing.free.name': 'Gratuit',
    'pricing.free.desc': 'Pour découvrir la plateforme',
    'pricing.starter.name': 'Starter',
    'pricing.starter.desc': 'Pour les petites organisations',
    'pricing.professional.name': 'Professionnel',
    'pricing.professional.desc': 'Pour les équipes actives',
    'pricing.enterprise.name': 'Entreprise',
    'pricing.enterprise.desc': 'Pour les grandes organisations',

    // Auth
    'auth.login.title': 'Connexion',
    'auth.login.subtitle': 'Accédez à votre espace InsightGov Africa',
    'auth.login.email': 'Email professionnel',
    'auth.login.password': 'Mot de passe',
    'auth.login.forgot': 'Mot de passe oublié ?',
    'auth.login.submit': 'Se connecter',
    'auth.login.oauth': 'Ou continuer avec',
    'auth.login.noaccount': 'Pas encore de compte ?',
    'auth.login.demo': 'Essayer la démo sans compte',

    'auth.register.title': 'Créer votre compte',
    'auth.register.subtitle': 'Commencez votre essai gratuit de 14 jours',
    'auth.register.name': 'Nom complet',
    'auth.register.confirm': 'Confirmer le mot de passe',
    'auth.register.org': 'Nom de l\'organisation',
    'auth.register.orgtype': 'Type d\'organisation',
    'auth.register.sector': 'Secteur d\'activité',
    'auth.register.country': 'Pays',
    'auth.register.submit': 'Créer mon compte',
    'auth.register.haveaccount': 'Déjà un compte ?',
    'auth.register.terms': 'En créant un compte, vous acceptez nos',

    'auth.error.title': 'Erreur d\'authentification',
    'auth.error.retry': 'Réessayer',
    'auth.error.home': 'Retour à l\'accueil',
    'auth.error.support': 'Problème persistant ? Contactez le support',

    // Dashboard
    'dashboard.welcome': 'Bienvenue',
    'dashboard.upload.title': 'Importer vos données',
    'dashboard.upload.drag': 'Glissez-déposez vos fichiers ici',
    'dashboard.upload.or': 'ou',
    'dashboard.upload.browse': 'Parcourir',
    'dashboard.upload.formats': 'Formats supportés: CSV, XLS, XLSX',
    'dashboard.upload.demo': 'Générer des données de démo',
    'dashboard.upload.analyzing': 'Analyse en cours...',

    'dashboard.kpis.title': 'Indicateurs clés',
    'dashboard.charts.title': 'Graphiques',
    'dashboard.data.title': 'Données brutes',
    'dashboard.filters.title': 'Filtres',
    'dashboard.export.title': 'Exporter',
    'dashboard.share.title': 'Partager',

    // Settings
    'settings.title': 'Paramètres',
    'settings.account': 'Compte',
    'settings.organization': 'Organisation',
    'settings.subscription': 'Abonnement',
    'settings.notifications': 'Notifications',

    'settings.account.title': 'Informations personnelles',
    'settings.account.desc': 'Mettez à jour vos informations de profil',
    'settings.account.name': 'Nom complet',
    'settings.account.email': 'Email',
    'settings.account.email.locked': 'L\'email ne peut pas être modifié',
    'settings.account.password': 'Changer le mot de passe',
    'settings.account.save': 'Enregistrer',

    'settings.org.title': 'Informations de l\'organisation',
    'settings.org.desc': 'Gérez les informations de votre structure',
    'settings.org.name': 'Nom de l\'organisation',
    'settings.org.type': 'Type',
    'settings.org.sector': 'Secteur',
    'settings.org.plan': 'Plan actuel',

    'settings.sub.title': 'Votre abonnement',
    'settings.sub.desc': 'Gérez votre plan et vos factures',
    'settings.sub.current': 'Plan actuel',
    'settings.sub.invoices': 'Factures',
    'settings.sub.none': 'Aucune facture disponible',
    'settings.sub.upgrade': 'Changer de plan',

    'settings.notif.title': 'Préférences de notification',
    'settings.notif.desc': 'Choisissez comment vous souhaitez être notifié',
    'settings.notif.activity': 'Emails d\'activité',
    'settings.notif.activity.desc': 'Recevez des emails lors de l\'analyse de vos données',
    'settings.notif.limits': 'Alertes de limite',
    'settings.notif.limits.desc': 'Soyez notifié avant d\'atteindre vos limites',
    'settings.notif.newsletter': 'Newsletter',
    'settings.notif.newsletter.desc': 'Nouveautés et conseils d\'utilisation',
    'settings.notif.reminders': 'Rappels d\'abonnement',
    'settings.notif.reminders.desc': 'Rappels avant renouvellement',

    // Payment
    'payment.success.title': 'Paiement réussi !',
    'payment.success.redirect': 'Redirection automatique dans quelques secondes...',
    'payment.success.access': 'Accéder à mon espace',
    'payment.failed.title': 'Paiement échoué',
    'payment.failed.retry': 'Réessayer',
    'payment.pending.title': 'Vérification en cours...',
    'payment.demo.title': 'Mode Démonstration',
    'payment.demo.desc': 'Paiement simulé - Aucune transaction réelle',

    // Errors
    'error.generic': 'Une erreur est survenue',
    'error.notfound': 'Page non trouvée',
    'error.unauthorized': 'Accès non autorisé',

    // Common
    'common.loading': 'Chargement...',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.all': 'Tous',
    'common.none': 'Aucun',
    'common.yes': 'Oui',
    'common.no': 'Non',
  },

  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.datasets': 'Data',
    'nav.settings': 'Settings',
    'nav.pricing': 'Pricing',
    'nav.login': 'Sign in',
    'nav.logout': 'Sign out',
    'nav.register': 'Create account',

    // Landing Page
    'landing.hero.title': 'AI Dashboards for Africa',
    'landing.hero.subtitle': 'Transform your data into actionable insights in minutes',
    'landing.hero.cta': 'Start for free',
    'landing.hero.demo': 'Watch demo',

    'landing.features.title': 'Powerful features',
    'landing.features.subtitle': 'Everything you need for data-driven decisions',

    'landing.features.ai.title': 'Automatic AI Analysis',
    'landing.features.ai.desc': 'GPT-4o analyzes your data and suggests relevant KPIs for your sector',

    'landing.features.upload.title': 'Easy Import',
    'landing.features.upload.desc': 'Upload your CSV or Excel files, we handle the rest',

    'landing.features.visual.title': 'Pro Visualizations',
    'landing.features.visual.desc': 'Interactive charts and professional dashboards with Tremor',

    'landing.features.share.title': 'Simplified Sharing',
    'landing.features.share.desc': 'Share your dashboards with a simple link, even without an account',

    'landing.features.export.title': 'Multiple Exports',
    'landing.features.export.desc': 'Export to PDF or Excel for your reports and presentations',

    'landing.features.secure.title': 'Secure',
    'landing.features.secure.desc': 'Data isolation by organization, GDPR compliant',

    // Sectors
    'landing.sectors.title': 'Adapted to your sector',
    'landing.sectors.health': 'Health',
    'landing.sectors.health.desc': 'Ministries, hospitals, public health programs',
    'landing.sectors.education': 'Education',
    'landing.sectors.education.desc': 'Ministries, schools, universities',
    'landing.sectors.finance': 'Finance',
    'landing.sectors.finance.desc': 'Banks, microfinance, insurance',
    'landing.sectors.agriculture': 'Agriculture',
    'landing.sectors.agriculture.desc': 'Ministries, cooperatives, rural projects',

    // Pricing
    'pricing.title': 'Choose your plan',
    'pricing.subtitle': 'Solutions adapted to African Ministries, NGOs and Companies',
    'pricing.monthly': 'Monthly',
    'pricing.annual': 'Annual',
    'pricing.annual.discount': '-20%',
    'pricing.popular': 'Most popular',
    'pricing.current': 'Current plan',
    'pricing.choose': 'Choose this plan',
    'pricing.contact': 'Contact us',

    'pricing.free.name': 'Free',
    'pricing.free.desc': 'To discover the platform',
    'pricing.starter.name': 'Starter',
    'pricing.starter.desc': 'For small organizations',
    'pricing.professional.name': 'Professional',
    'pricing.professional.desc': 'For active teams',
    'pricing.enterprise.name': 'Enterprise',
    'pricing.enterprise.desc': 'For large organizations',

    // Auth
    'auth.login.title': 'Sign in',
    'auth.login.subtitle': 'Access your InsightGov Africa space',
    'auth.login.email': 'Professional email',
    'auth.login.password': 'Password',
    'auth.login.forgot': 'Forgot password?',
    'auth.login.submit': 'Sign in',
    'auth.login.oauth': 'Or continue with',
    'auth.login.noaccount': 'Don\'t have an account?',
    'auth.login.demo': 'Try demo without account',

    'auth.register.title': 'Create your account',
    'auth.register.subtitle': 'Start your 14-day free trial',
    'auth.register.name': 'Full name',
    'auth.register.confirm': 'Confirm password',
    'auth.register.org': 'Organization name',
    'auth.register.orgtype': 'Organization type',
    'auth.register.sector': 'Activity sector',
    'auth.register.country': 'Country',
    'auth.register.submit': 'Create my account',
    'auth.register.haveaccount': 'Already have an account?',
    'auth.register.terms': 'By creating an account, you accept our',

    'auth.error.title': 'Authentication error',
    'auth.error.retry': 'Try again',
    'auth.error.home': 'Back to home',
    'auth.error.support': 'Persistent problem? Contact support',

    // Dashboard
    'dashboard.welcome': 'Welcome',
    'dashboard.upload.title': 'Import your data',
    'dashboard.upload.drag': 'Drag and drop your files here',
    'dashboard.upload.or': 'or',
    'dashboard.upload.browse': 'Browse',
    'dashboard.upload.formats': 'Supported formats: CSV, XLS, XLSX',
    'dashboard.upload.demo': 'Generate demo data',
    'dashboard.upload.analyzing': 'Analyzing...',

    'dashboard.kpis.title': 'Key indicators',
    'dashboard.charts.title': 'Charts',
    'dashboard.data.title': 'Raw data',
    'dashboard.filters.title': 'Filters',
    'dashboard.export.title': 'Export',
    'dashboard.share.title': 'Share',

    // Settings
    'settings.title': 'Settings',
    'settings.account': 'Account',
    'settings.organization': 'Organization',
    'settings.subscription': 'Subscription',
    'settings.notifications': 'Notifications',

    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.all': 'All',
    'common.none': 'None',
    'common.yes': 'Yes',
    'common.no': 'No',
  },

  pt: {
    // Navigation
    'nav.home': 'Início',
    'nav.dashboard': 'Painel',
    'nav.datasets': 'Dados',
    'nav.settings': 'Configurações',
    'nav.pricing': 'Preços',
    'nav.login': 'Entrar',
    'nav.logout': 'Sair',
    'nav.register': 'Criar conta',

    // Landing Page
    'landing.hero.title': 'Dashboards IA para África',
    'landing.hero.subtitle': 'Transforme seus dados em insights acionáveis em minutos',
    'landing.hero.cta': 'Começar grátis',
    'landing.hero.demo': 'Ver demo',

    'landing.features.title': 'Recursos poderosos',
    'landing.features.subtitle': 'Tudo o que você precisa para decisões baseadas em dados',

    // Pricing
    'pricing.title': 'Escolha seu plano',
    'pricing.subtitle': 'Soluções adaptadas para Ministérios, ONGs e Empresas africanas',
    'pricing.monthly': 'Mensal',
    'pricing.annual': 'Anual',
    'pricing.popular': 'Mais popular',
    'pricing.choose': 'Escolher este plano',

    'pricing.free.name': 'Grátis',
    'pricing.starter.name': 'Starter',
    'pricing.professional.name': 'Profissional',
    'pricing.enterprise.name': 'Empresa',

    // Auth
    'auth.login.title': 'Entrar',
    'auth.login.email': 'Email profissional',
    'auth.login.password': 'Senha',
    'auth.login.submit': 'Entrar',

    'auth.register.title': 'Criar sua conta',
    'auth.register.name': 'Nome completo',
    'auth.register.org': 'Nome da organização',
    'auth.register.submit': 'Criar minha conta',

    // Common
    'common.loading': 'Carregando...',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
    'common.search': 'Pesquisar',
  },
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Récupérer une traduction
 */
export function t(key: string, locale: Locale = defaultLocale): string {
  return translations[locale]?.[key] || translations[defaultLocale]?.[key] || key;
}

/**
 * Récupérer la locale depuis un chemin
 */
export function getLocaleFromPath(path: string): Locale {
  const segments = path.split('/');
  const maybeLocale = segments[1];
  return locales.includes(maybeLocale as Locale) ? (maybeLocale as Locale) : defaultLocale;
}

/**
 * Ajouter la locale à un chemin
 */
export function localizePath(path: string, locale: Locale): string {
  if (locale === defaultLocale) return path;
  return `/${locale}${path}`;
}

/**
 * Liste des pays africains (multi-langue)
 */
export const africanCountries: Record<Locale, string[]> = {
  fr: [
    'Bénin', 'Burkina Faso', 'Burundi', 'Cameroun', 'Cap-Vert', 'Centrafrique',
    'Comores', 'Congo-Brazzaville', 'Côte d\'Ivoire', 'Djibouti', 'Gabon', 'Gambie',
    'Ghana', 'Guinée', 'Guinée-Bissau', 'Guinée équatoriale', 'Liberia', 'Mali',
    'Mauritanie', 'Maurice', 'Niger', 'Nigeria', 'RDC', 'Rwanda', 'São Tomé et Príncipe',
    'Sénégal', 'Sierra Leone', 'Tchad', 'Togo', 'Tunisie', 'Maroc', 'Algérie', 'Égypte',
    'Kenya', 'Tanzanie', 'Uganda', 'Éthiopie', 'Afrique du Sud', 'Madagascar', 'Mozambique',
    'Angola', 'Cameroun', 'Soudan', 'Soudan du Sud', 'Somalie', 'Érythrée', 'Djibouti',
  ].sort(),

  en: [
    'Benin', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde', 'Central African Republic',
    'Comoros', 'Congo', 'Côte d\'Ivoire', 'Djibouti', 'Gabon', 'Gambia',
    'Ghana', 'Guinea', 'Guinea-Bissau', 'Equatorial Guinea', 'Liberia', 'Mali',
    'Mauritania', 'Mauritius', 'Niger', 'Nigeria', 'DRC', 'Rwanda', 'São Tomé and Príncipe',
    'Senegal', 'Sierra Leone', 'Chad', 'Togo', 'Tunisia', 'Morocco', 'Algeria', 'Egypt',
    'Kenya', 'Tanzania', 'Uganda', 'Ethiopia', 'South Africa', 'Madagascar', 'Mozambique',
    'Angola', 'Sudan', 'South Sudan', 'Somalia', 'Eritrea',
  ].sort(),

  pt: [
    'Benim', 'Burkina Faso', 'Burundi', 'Camarões', 'Cabo Verde', 'República Centro-Africana',
    'Comores', 'Congo', 'Costa do Marfim', 'Djibuti', 'Gabão', 'Gâmbia',
    'Gana', 'Guiné', 'Guiné-Bissau', 'Guiné Equatorial', 'Libéria', 'Mali',
    'Mauritânia', 'Maurício', 'Níger', 'Nigéria', 'RDC', 'Ruanda', 'São Tomé e Príncipe',
    'Senegal', 'Serra Leoa', 'Chade', 'Togo', 'Tunísia', 'Marrocos', 'Argélia', 'Egito',
    'Quénia', 'Tanzânia', 'Uganda', 'Etiópia', 'África do Sul', 'Madagáscar', 'Moçambique',
    'Angola', 'Sudão', 'Sudão do Sul', 'Somália', 'Eritreia',
  ].sort(),
};

export default {
  locales,
  defaultLocale,
  translations,
  t,
  getLocaleFromPath,
  localizePath,
  africanCountries,
};
