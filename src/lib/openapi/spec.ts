// ============================================
// InsightGov Africa - Complete OpenAPI Specification
// Comprehensive API documentation for all 48+ endpoints
// ============================================

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'InsightGov Africa API',
    version: '1.0.0',
    description: `
# InsightGov Africa API

Plateforme de dashboards IA pour les organisations africaines - Ministères, ONGs, Entreprises.

## Authentification

L'API utilise NextAuth.js avec JWT. Incluez le token dans le header Authorization:

\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

### Obtenir un token
1. Créez un compte via \`POST /api/auth/register\`
2. Connectez-vous via \`POST /api/auth/login\`
3. Le token JWT est retourné dans la réponse

## Rate Limiting

| Type | Limite |
|------|--------|
| API générale | 100 req/min |
| Authentification | 5 tentatives/15min |
| Upload | 20/heure |
| Export | 50/heure |
| AI | 30/heure |

## Codes d'erreur

| Code | Description |
|------|-------------|
| 400 | Données invalides |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource non trouvée |
| 429 | Rate limit atteint |
| 500 | Erreur serveur |

## Support

- Email: support@insightgov.africa
- Documentation: https://docs.insightgov.africa
    `,
    contact: {
      name: 'InsightGov Africa Support',
      email: 'support@insightgov.africa',
      url: 'https://insightgov.africa',
    },
    license: {
      name: 'Proprietary',
      url: 'https://insightgov.africa/legal/terms',
    },
    'x-logo': {
      url: '/logo.svg',
      altText: 'InsightGov Africa Logo',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Serveur actuel',
    },
    {
      url: 'https://insightgov.africa/api',
      description: 'Production',
    },
    {
      url: 'https://staging.insightgov.africa/api',
      description: 'Staging',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentification et gestion des sessions' },
    { name: 'Datasets', description: 'Gestion des datasets et données' },
    { name: 'KPIs', description: 'Configuration et gestion des KPIs' },
    { name: 'AI', description: 'Fonctionnalités IA (analyse, insights, prédictions)' },
    { name: 'Export', description: 'Export PDF, Excel, PowerPoint' },
    { name: 'Payments', description: 'Paiements Paystack et abonnements' },
    { name: 'Organizations', description: 'Gestion des organisations' },
    { name: 'Team', description: 'Gestion des équipes et membres' },
    { name: 'Notifications', description: 'Centre de notifications' },
    { name: 'Comments', description: 'Commentaires et collaboration' },
    { name: 'API Keys', description: 'Gestion des clés API' },
    { name: 'Webhooks', description: 'Configuration des webhooks' },
    { name: 'Templates', description: 'Templates de dashboards' },
    { name: 'Connectors', description: 'Connecteurs de données externes' },
    { name: 'Invoices', description: 'Facturation' },
    { name: 'Audit', description: 'Logs d\'audit et traçabilité' },
    { name: 'Share', description: 'Partage de dashboards' },
    { name: 'Demo', description: 'Données de démonstration' },
    { name: 'Health', description: 'Health checks et monitoring' },
  ],
  paths: {
    // ============================================
    // AUTHENTICATION
    // ============================================
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Créer un compte utilisateur',
        description: 'Enregistre un nouvel utilisateur avec email/mot de passe. Envoie un email de vérification.',
        operationId: 'registerUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
              examples: {
                ministry: {
                  summary: 'Inscription Ministère',
                  value: {
                    email: 'minister@health.gov.ci',
                    password: 'SecurePass123!',
                    firstName: 'Amadou',
                    lastName: 'Koné',
                    organizationName: 'Ministère de la Santé',
                    organizationType: 'MINISTRY',
                    sector: 'health',
                  },
                },
                ngo: {
                  summary: 'Inscription ONG',
                  value: {
                    email: 'director@ngo.org',
                    password: 'SecurePass123!',
                    firstName: 'Fatou',
                    lastName: 'Diallo',
                    organizationName: 'Aide Sahel',
                    organizationType: 'NGO',
                    sector: 'social',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Compte créé avec succès',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterResponse' },
              },
            },
          },
          '400': {
            description: 'Données invalides',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                examples: {
                  invalidEmail: { value: { error: 'Format d\'email invalide' } },
                  weakPassword: { value: { error: 'Le mot de passe doit contenir au moins 8 caractères' } },
                },
              },
            },
          },
          '409': {
            description: 'Email déjà utilisé',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },

    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Connexion',
        description: 'Authentifie un utilisateur et retourne un token JWT.',
        operationId: 'loginUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Connexion réussie',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          '401': {
            description: 'Identifiants invalides',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },

    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Déconnexion',
        description: 'Termine la session utilisateur.',
        operationId: 'logoutUser',
        responses: {
          '200': { description: 'Déconnexion réussie' },
        },
      },
    },

    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Demander réinitialisation mot de passe',
        description: 'Envoie un email avec un lien de réinitialisation.',
        operationId: 'resetPasswordRequest',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Email envoyé si le compte existe' },
        },
      },
    },

    '/auth/update-password': {
      post: {
        tags: ['Auth'],
        summary: 'Mettre à jour le mot de passe',
        description: 'Change le mot de passe avec le token de réinitialisation.',
        operationId: 'updatePassword',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Mot de passe mis à jour' },
          '400': { description: 'Token invalide ou expiré' },
        },
      },
    },

    '/auth/verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'Vérifier l\'email',
        description: 'Vérifie l\'email avec le token envoyé.',
        operationId: 'verifyEmail',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: {
                  token: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Email vérifié avec succès' },
          '400': { description: 'Token invalide ou expiré' },
        },
      },
    },

    '/auth/resend-verification': {
      post: {
        tags: ['Auth'],
        summary: 'Renvoyer l\'email de vérification',
        operationId: 'resendVerification',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Email renvoyé si le compte existe' },
        },
      },
    },

    '/auth/saml': {
      get: {
        tags: ['Auth'],
        summary: 'Obtenir la configuration SSO',
        description: 'Retourne la configuration SAML/SSO de l\'organisation.',
        operationId: 'getSAMLConfig',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Configuration SSO',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SSOConfig' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Auth'],
        summary: 'Initier une connexion SSO',
        description: 'Redirige vers le provider SAML configuré.',
        operationId: 'initiateSSO',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  provider: {
                    type: 'string',
                    enum: ['azure-ad', 'okta', 'google-workspace', 'custom'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'URL de redirection SSO',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    redirectUrl: { type: 'string', format: 'uri' },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['Auth'],
        summary: 'Configurer le SSO',
        description: 'Configure l\'authentification SAML pour l\'organisation.',
        operationId: 'configureSSO',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SSOConfigInput' },
            },
          },
        },
        responses: {
          '200': { description: 'Configuration SSO mise à jour' },
          '403': { description: 'Permissions insuffisantes' },
        },
      },
      delete: {
        tags: ['Auth'],
        summary: 'Supprimer la configuration SSO',
        operationId: 'deleteSSOConfig',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Configuration SSO supprimée' },
        },
      },
    },

    '/auth/saml/callback': {
      post: {
        tags: ['Auth'],
        summary: 'Callback SAML',
        description: 'Gère la réponse du provider SAML.',
        operationId: 'samlCallback',
        requestBody: {
          required: true,
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  SAMLResponse: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Authentification SSO réussie',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          '401': { description: 'Échec de l\'authentification SSO' },
        },
      },
    },

    '/auth/saml/metadata': {
      get: {
        tags: ['Auth'],
        summary: 'Métadonnées SAML SP',
        description: 'Retourne les métadonnées XML du Service Provider.',
        operationId: 'getSAMLMetadata',
        responses: {
          '200': {
            description: 'Métadonnées XML',
            content: {
              'application/xml': {
                schema: { type: 'string' },
              },
            },
          },
        },
      },
    },

    // ============================================
    // DATASETS
    // ============================================
    '/datasets': {
      get: {
        tags: ['Datasets'],
        summary: 'Lister les datasets',
        description: 'Retourne tous les datasets de l\'organisation.',
        operationId: 'listDatasets',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'organizationId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'UPLOADING', 'PARSING', 'ANALYZING', 'COMPLETED', 'FAILED'] } },
          { name: 'includeConfig', in: 'query', schema: { type: 'boolean' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Liste des datasets',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DatasetListResponse' },
              },
            },
          },
          '401': { description: 'Non authentifié' },
        },
      },
    },

    '/datasets/{id}': {
      get: {
        tags: ['Datasets'],
        summary: 'Obtenir un dataset',
        description: 'Retourne les détails complets d\'un dataset.',
        operationId: 'getDataset',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Détails du dataset',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DatasetResponse' },
              },
            },
          },
          '404': { description: 'Dataset non trouvé' },
        },
      },
      patch: {
        tags: ['Datasets'],
        summary: 'Mettre à jour un dataset',
        operationId: 'updateDataset',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  status: { type: 'string' },
                  columnsMetadata: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Dataset mis à jour',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DatasetResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Datasets'],
        summary: 'Supprimer un dataset',
        description: 'Supprime un dataset et toutes ses configurations associées.',
        operationId: 'deleteDataset',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Dataset supprimé' },
          '404': { description: 'Dataset non trouvé' },
        },
      },
    },

    '/datasets/{id}/data': {
      get: {
        tags: ['Datasets'],
        summary: 'Obtenir les données brutes',
        description: 'Retourne les données du dataset avec pagination.',
        operationId: 'getDatasetData',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 100 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv'] } },
        ],
        responses: {
          '200': {
            description: 'Données du dataset',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DatasetDataResponse' },
              },
              'text/csv': {
                schema: { type: 'string' },
              },
            },
          },
        },
      },
    },

    // ============================================
    // UPLOAD
    // ============================================
    '/upload': {
      post: {
        tags: ['Datasets'],
        summary: 'Uploader un fichier',
        description: 'Upload un fichier CSV, Excel ou JSON pour créer un dataset.',
        operationId: 'uploadFile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary', description: 'Fichier CSV, Excel ou JSON (max 50MB)' },
                  name: { type: 'string', description: 'Nom du dataset' },
                  organizationId: { type: 'string' },
                  sector: { type: 'string', description: 'Secteur d\'activité' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Fichier uploadé avec succès',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UploadResponse' },
              },
            },
          },
          '400': { description: 'Fichier invalide' },
          '413': { description: 'Fichier trop volumineux (max 50MB)' },
        },
      },
      get: {
        tags: ['Datasets'],
        summary: 'Lister les uploads',
        description: 'Retourne l\'historique des uploads de l\'organisation.',
        operationId: 'listUploads',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'organizationId', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Liste des uploads',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DatasetListResponse' },
              },
            },
          },
        },
      },
    },

    // ============================================
    // KPIs
    // ============================================
    '/kpis': {
      get: {
        tags: ['KPIs'],
        summary: 'Lister les configurations KPI',
        description: 'Retourne les configurations KPI d\'un dataset ou organisation.',
        operationId: 'listKPIs',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'datasetId', in: 'query', schema: { type: 'string' } },
          { name: 'organizationId', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Liste des KPIs',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/KPIConfig' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['KPIs'],
        summary: 'Créer une configuration KPI',
        description: 'Crée une nouvelle configuration KPI pour un dataset.',
        operationId: 'createKPI',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/KPIConfigInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'KPI créé',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/KPIConfig' },
              },
            },
          },
        },
      },
    },

    '/kpis/{id}': {
      get: {
        tags: ['KPIs'],
        summary: 'Obtenir une configuration KPI',
        operationId: 'getKPI',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Configuration KPI',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/KPIConfig' },
              },
            },
          },
          '404': { description: 'KPI non trouvé' },
        },
      },
      patch: {
        tags: ['KPIs'],
        summary: 'Mettre à jour une configuration KPI',
        operationId: 'updateKPI',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/KPIConfigInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'KPI mis à jour',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/KPIConfig' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['KPIs'],
        summary: 'Supprimer une configuration KPI',
        operationId: 'deleteKPI',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'KPI supprimé' },
          '404': { description: 'KPI non trouvé' },
        },
      },
    },

    // ============================================
    // AI FEATURES
    // ============================================
    '/ai/analyze': {
      post: {
        tags: ['AI'],
        summary: 'Analyser un fichier avec l\'IA',
        description: 'Analyse un fichier et génère des suggestions de KPIs et visualisations via GPT-4o.',
        operationId: 'aiAnalyze',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  organizationType: {
                    type: 'string',
                    enum: ['MINISTRY', 'NGO', 'ENTERPRISE', 'ACADEMIC', 'OTHER'],
                  },
                  sector: { type: 'string' },
                  subSector: { type: 'string' },
                  language: { type: 'string', default: 'fr' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Analyse IA réussie',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AIAnalyzeResponse' },
              },
            },
          },
          '400': { description: 'Fichier invalide' },
          '500': { description: 'Erreur lors de l\'analyse IA' },
        },
      },
    },

    '/ai/query': {
      post: {
        tags: ['AI'],
        summary: 'Requête en langage naturel',
        description: 'Posez une question en langage naturel sur vos données.',
        operationId: 'aiQuery',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['query', 'datasetId'],
                properties: {
                  query: { type: 'string', description: 'Question en langage naturel' },
                  datasetId: { type: 'string' },
                  language: { type: 'string', default: 'fr' },
                },
              },
              examples: {
                example1: {
                  summary: 'Total des ventes',
                  value: { query: 'Quel est le total des ventes par région?', datasetId: 'dataset_123' },
                },
                example2: {
                  summary: 'Tendance',
                  value: { query: 'Montre moi l\'évolution du budget sur les 12 derniers mois', datasetId: 'dataset_123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Résultat de la requête',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AIQueryResponse' },
              },
            },
          },
        },
      },
    },

    '/ai/insights': {
      post: {
        tags: ['AI'],
        summary: 'Générer des insights',
        description: 'Génère des insights automatiques à partir des données.',
        operationId: 'aiInsights',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['datasetId'],
                properties: {
                  datasetId: { type: 'string' },
                  columns: { type: 'array', items: { type: 'string' } },
                  includePredictions: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Insights générés',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AIInsightsResponse' },
              },
            },
          },
        },
      },
    },

    '/ai/predict': {
      post: {
        tags: ['AI'],
        summary: 'Prédictions IA',
        description: 'Génère des prédictions sur les données futures.',
        operationId: 'aiPredict',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['datasetId', 'targetColumn', 'horizon'],
                properties: {
                  datasetId: { type: 'string' },
                  targetColumn: { type: 'string', description: 'Colonne à prédire' },
                  horizon: { type: 'integer', description: 'Nombre de périodes à prédire' },
                  frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] },
                  confidenceLevel: { type: 'number', default: 0.95 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Prédictions générées',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AIPredictResponse' },
              },
            },
          },
        },
      },
    },

    '/ai/chat': {
      post: {
        tags: ['AI'],
        summary: 'Chat avec l\'assistant IA',
        description: 'Conversation avec l\'assistant IA sur vos données.',
        operationId: 'aiChat',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string' },
                  conversationId: { type: 'string' },
                  datasetId: { type: 'string' },
                  context: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Réponse de l\'assistant',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AIChatResponse' },
              },
            },
          },
        },
      },
    },

    '/ai/clean': {
      post: {
        tags: ['AI'],
        summary: 'Nettoyage IA des données',
        description: 'Détecte et corrige les problèmes de qualité des données.',
        operationId: 'aiClean',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['datasetId'],
                properties: {
                  datasetId: { type: 'string' },
                  autoFix: { type: 'boolean', default: false },
                  fixTypes: {
                    type: 'array',
                    items: { type: 'string', enum: ['missing_values', 'outliers', 'duplicates', 'type_mismatch', 'format_inconsistency'] },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Rapport de nettoyage',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AICleanResponse' },
              },
            },
          },
        },
      },
    },

    // ============================================
    // EXPORT
    // ============================================
    '/export/pdf': {
      post: {
        tags: ['Export'],
        summary: 'Exporter en PDF',
        description: 'Génère un rapport PDF professionnel.',
        operationId: 'exportPdf',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  kpiConfigId: { type: 'string' },
                  config: { $ref: '#/components/schemas/DashboardConfig' },
                  organizationName: { type: 'string' },
                  includeExecutiveSummary: { type: 'boolean', default: true },
                  includeRecommendations: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Fichier PDF',
            content: {
              'application/pdf': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '400': { description: 'Configuration requise' },
        },
      },
      get: {
        tags: ['Export'],
        summary: 'Prévisualiser le PDF',
        operationId: 'previewPdf',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'kpiConfigId', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Métadonnées du rapport',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PDFPreviewResponse' },
              },
            },
          },
        },
      },
    },

    '/export/excel': {
      post: {
        tags: ['Export'],
        summary: 'Exporter en Excel',
        description: 'Génère un fichier Excel multi-feuilles.',
        operationId: 'exportExcel',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  kpiConfigId: { type: 'string' },
                  datasetId: { type: 'string' },
                  includeRawData: { type: 'boolean', default: true },
                  includeAnalysis: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Fichier Excel',
            content: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
    },

    '/export/powerpoint': {
      post: {
        tags: ['Export'],
        summary: 'Exporter en PowerPoint',
        description: 'Génère une présentation PowerPoint.',
        operationId: 'exportPowerpoint',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  kpiConfigId: { type: 'string' },
                  organizationName: { type: 'string' },
                  template: { type: 'string', enum: ['executive', 'detailed', 'minimal'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Fichier PowerPoint',
            content: {
              'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
    },

    // ============================================
    // PAYMENTS
    // ============================================
    '/payments/initialize': {
      post: {
        tags: ['Payments'],
        summary: 'Initialiser un paiement',
        description: 'Crée une transaction Paystack et retourne l\'URL de paiement.',
        operationId: 'initializePayment',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PaymentInitializeRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'URL de paiement',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaymentInitializeResponse' },
              },
            },
          },
        },
      },
    },

    '/payments/verify': {
      get: {
        tags: ['Payments'],
        summary: 'Vérifier un paiement',
        description: 'Vérifie le statut d\'une transaction Paystack.',
        operationId: 'verifyPayment',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'reference', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Statut du paiement',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaymentVerifyResponse' },
              },
            },
          },
          '400': { description: 'Paiement échoué' },
        },
      },
    },

    '/payments/webhook': {
      post: {
        tags: ['Payments'],
        summary: 'Webhook Paystack',
        description: 'Reçoit les notifications de Paystack.',
        operationId: 'paymentWebhook',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PaystackWebhookPayload' },
            },
          },
        },
        responses: {
          '200': { description: 'Webhook traité' },
        },
      },
    },

    // ============================================
    // PAYSTACK
    // ============================================
    '/paystack': {
      get: {
        tags: ['Payments'],
        summary: 'Statut Paystack',
        description: 'Retourne la configuration Paystack.',
        operationId: 'getPaystackStatus',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Statut Paystack',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    configured: { type: 'boolean' },
                    publicKey: { type: 'string' },
                    testMode: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/paystack/webhook': {
      post: {
        tags: ['Payments'],
        summary: 'Webhook Paystack',
        description: 'Endpoint alternatif pour les webhooks Paystack.',
        operationId: 'paystackWebhook',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
        responses: {
          '200': { description: 'Webhook reçu' },
        },
      },
    },

    // ============================================
    // SUBSCRIPTIONS
    // ============================================
    '/subscriptions': {
      get: {
        tags: ['Payments'],
        summary: 'Obtenir l\'abonnement',
        description: 'Retourne les détails de l\'abonnement actuel.',
        operationId: 'getSubscription',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'organizationId', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Détails de l\'abonnement',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Subscription' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Payments'],
        summary: 'Créer un abonnement',
        description: 'Crée un nouvel abonnement Paystack.',
        operationId: 'createSubscription',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['organizationId', 'plan'],
                properties: {
                  organizationId: { type: 'string' },
                  plan: { type: 'string', enum: ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'] },
                  billingCycle: { type: 'string', enum: ['monthly', 'yearly'], default: 'monthly' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Abonnement créé',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Subscription' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Payments'],
        summary: 'Annuler l\'abonnement',
        description: 'Annule l\'abonnement en cours.',
        operationId: 'cancelSubscription',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'organizationId', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Abonnement annulé' },
        },
      },
    },

    // ============================================
    // ORGANIZATIONS
    // ============================================
    '/organizations': {
      get: {
        tags: ['Organizations'],
        summary: 'Lister les organisations',
        description: 'Retourne les organisations de l\'utilisateur.',
        operationId: 'listOrganizations',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Liste des organisations',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Organization' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Organizations'],
        summary: 'Créer une organisation',
        operationId: 'createOrganization',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OrganizationInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Organisation créée',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Organization' },
              },
            },
          },
        },
      },
    },

    // ============================================
    // TEAM
    // ============================================
    '/team': {
      get: {
        tags: ['Team'],
        summary: 'Lister les membres',
        description: 'Retourne les membres de l\'organisation.',
        operationId: 'listTeamMembers',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'organizationId', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Liste des membres',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/TeamMember' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Team'],
        summary: 'Inviter un membre',
        description: 'Invite un nouveau membre dans l\'organisation.',
        operationId: 'inviteTeamMember',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'role', 'organizationId'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  role: { type: 'string', enum: ['owner', 'admin', 'analyst', 'viewer'] },
                  organizationId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Invitation envoyée' },
          '403': { description: 'Permissions insuffisantes' },
        },
      },
      delete: {
        tags: ['Team'],
        summary: 'Retirer un membre',
        operationId: 'removeTeamMember',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'userId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'organizationId', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Membre retiré' },
        },
      },
    },

    // ============================================
    // NOTIFICATIONS
    // ============================================
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Lister les notifications',
        description: 'Retourne les notifications de l\'utilisateur.',
        operationId: 'listNotifications',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'unreadOnly', in: 'query', schema: { type: 'boolean' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Liste des notifications',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotificationListResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Notifications'],
        summary: 'Marquer comme lu',
        description: 'Marque une ou plusieurs notifications comme lues.',
        operationId: 'markNotificationsRead',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notificationIds: { type: 'array', items: { type: 'string' } },
                  markAll: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Notifications mises à jour' },
        },
      },
    },

    // ============================================
    // COMMENTS
    // ============================================
    '/comments': {
      get: {
        tags: ['Comments'],
        summary: 'Lister les commentaires',
        description: 'Retourne les commentaires d\'un élément.',
        operationId: 'listComments',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'entityType', in: 'query', required: true, schema: { type: 'string', enum: ['dataset', 'kpi', 'dashboard'] } },
          { name: 'entityId', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Liste des commentaires',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Comment' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Comments'],
        summary: 'Ajouter un commentaire',
        operationId: 'createComment',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['entityType', 'entityId', 'content'],
                properties: {
                  entityType: { type: 'string', enum: ['dataset', 'kpi', 'dashboard'] },
                  entityId: { type: 'string' },
                  content: { type: 'string' },
                  parentId: { type: 'string', description: 'Pour les réponses' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Commentaire créé',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Comment' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Comments'],
        summary: 'Supprimer un commentaire',
        operationId: 'deleteComment',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Commentaire supprimé' },
        },
      },
    },

    // ============================================
    // API KEYS
    // ============================================
    '/api-keys': {
      get: {
        tags: ['API Keys'],
        summary: 'Lister les clés API',
        description: 'Retourne les clés API de l\'utilisateur.',
        operationId: 'listApiKeys',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Liste des clés API',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ApiKey' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['API Keys'],
        summary: 'Créer une clé API',
        description: 'Génère une nouvelle clé API.',
        operationId: 'createApiKey',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  permissions: {
                    type: 'array',
                    items: { type: 'string', enum: ['read', 'write', 'admin'] },
                    default: ['read'],
                  },
                  expiresIn: { type: 'integer', description: 'Durée en jours (null = pas d\'expiration)' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Clé API créée',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiKeyCreated' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['API Keys'],
        summary: 'Révoquer une clé API',
        operationId: 'revokeApiKey',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Clé révoquée' },
        },
      },
    },

    // ============================================
    // WEBHOOKS
    // ============================================
    '/webhooks': {
      get: {
        tags: ['Webhooks'],
        summary: 'Lister les webhooks',
        description: 'Retourne les webhooks configurés.',
        operationId: 'listWebhooks',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Liste des webhooks',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Webhook' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Webhooks'],
        summary: 'Créer un webhook',
        operationId: 'createWebhook',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WebhookInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Webhook créé',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Webhook' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Webhooks'],
        summary: 'Supprimer un webhook',
        operationId: 'deleteWebhook',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Webhook supprimé' },
        },
      },
    },

    // ============================================
    // TEMPLATES
    // ============================================
    '/templates': {
      get: {
        tags: ['Templates'],
        summary: 'Lister les templates',
        description: 'Retourne les templates de dashboards disponibles.',
        operationId: 'listTemplates',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'sector', in: 'query', schema: { type: 'string' } },
          { name: 'organizationType', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Liste des templates',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/DashboardTemplate' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Templates'],
        summary: 'Appliquer un template',
        description: 'Applique un template à un dataset.',
        operationId: 'applyTemplate',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['templateId', 'datasetId'],
                properties: {
                  templateId: { type: 'string' },
                  datasetId: { type: 'string' },
                  customizations: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Template appliqué',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/KPIConfig' },
              },
            },
          },
        },
      },
    },

    // ============================================
    // CONNECTORS
    // ============================================
    '/connectors': {
      get: {
        tags: ['Connectors'],
        summary: 'Lister les connecteurs',
        description: 'Retourne les connecteurs de données configurés.',
        operationId: 'listConnectors',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Liste des connecteurs',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Connector' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Connectors'],
        summary: 'Créer un connecteur',
        description: 'Configure un nouveau connecteur de données.',
        operationId: 'createConnector',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ConnectorInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Connecteur créé',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Connector' },
              },
            },
          },
        },
      },
    },

    // ============================================
    // INVOICES
    // ============================================
    '/invoices': {
      get: {
        tags: ['Invoices'],
        summary: 'Lister les factures',
        description: 'Retourne les factures de l\'organisation.',
        operationId: 'listInvoices',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'organizationId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'pending', 'paid', 'overdue', 'canceled', 'refunded'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Liste des factures',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/InvoiceListResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Invoices'],
        summary: 'Créer une facture',
        operationId: 'createInvoice',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/InvoiceInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Facture créée',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Invoice' },
              },
            },
          },
        },
      },
    },

    '/invoices/{id}': {
      get: {
        tags: ['Invoices'],
        summary: 'Obtenir une facture',
        operationId: 'getInvoice',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Détails de la facture',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Invoice' },
              },
            },
          },
          '404': { description: 'Facture non trouvée' },
        },
      },
      patch: {
        tags: ['Invoices'],
        summary: 'Mettre à jour une facture',
        operationId: 'updateInvoice',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['draft', 'pending', 'paid', 'overdue', 'canceled', 'refunded'] },
                  paymentReference: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Facture mise à jour',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Invoice' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Invoices'],
        summary: 'Annuler une facture',
        operationId: 'cancelInvoice',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Facture annulée' },
        },
      },
    },

    '/invoices/{id}/download': {
      get: {
        tags: ['Invoices'],
        summary: 'Télécharger une facture PDF',
        operationId: 'downloadInvoice',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Fichier PDF',
            content: {
              'application/pdf': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
    },

    // ============================================
    // AUDIT LOGS
    // ============================================
    '/audit-logs': {
      get: {
        tags: ['Audit'],
        summary: 'Lister les logs d\'audit',
        description: 'Retourne les logs d\'audit de l\'organisation.',
        operationId: 'listAuditLogs',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'organizationId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'entityType', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['success', 'failed', 'pending'] } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'includeStats', in: 'query', schema: { type: 'boolean' } },
          { name: 'export', in: 'query', schema: { type: 'string', enum: ['csv', 'json'] } },
        ],
        responses: {
          '200': {
            description: 'Logs d\'audit',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuditLogListResponse' },
              },
            },
          },
        },
      },
    },

    // ============================================
    // SHARE
    // ============================================
    '/share/{token}': {
      get: {
        tags: ['Share'],
        summary: 'Accéder à un dashboard partagé',
        description: 'Retourne les données d\'un dashboard public via son token de partage.',
        operationId: 'getSharedDashboard',
        parameters: [
          { name: 'token', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Dashboard public',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SharedDashboardResponse' },
              },
            },
          },
          '404': { description: 'Dashboard non trouvé ou expiré' },
        },
      },
    },

    // ============================================
    // DEMO
    // ============================================
    '/demo/generate': {
      post: {
        tags: ['Demo'],
        summary: 'Générer des données de démo',
        description: 'Génère un dataset de démonstration pour un secteur donné.',
        operationId: 'generateDemoData',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  organizationId: { type: 'string' },
                  sector: {
                    type: 'string',
                    enum: ['health', 'education', 'agriculture', 'finance', 'energy', 'transport', 'telecom', 'retail', 'manufacturing', 'tourism'],
                  },
                  rowCount: { type: 'integer', default: 200, maximum: 1000 },
                  region: { type: 'string', description: 'Région africaine (ex: west-africa, east-africa)' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Dataset de démo généré',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DatasetResponse' },
              },
            },
          },
        },
      },
    },

    // ============================================
    // HEALTH
    // ============================================
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Vérifie l\'état de santé de l\'API.',
        operationId: 'healthCheck',
        responses: {
          '200': {
            description: 'Service sain',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
          '503': {
            description: 'Service indisponible',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },

    // ============================================
    // HISTORY
    // ============================================
    '/history': {
      get: {
        tags: ['Datasets'],
        summary: 'Historique des modifications',
        description: 'Retourne l\'historique des modifications d\'un dataset.',
        operationId: 'getHistory',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'datasetId', in: 'query', schema: { type: 'string' } },
          { name: 'organizationId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Historique',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/HistoryEntry' },
                },
              },
            },
          },
        },
      },
    },

    // ============================================
    // ANALYZE
    // ============================================
    '/analyze': {
      post: {
        tags: ['AI'],
        summary: 'Analyser un dataset',
        description: 'Déclenche l\'analyse IA d\'un dataset existant.',
        operationId: 'analyzeDataset',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['datasetId'],
                properties: {
                  datasetId: { type: 'string' },
                  forceRefresh: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Analyse terminée',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AIAnalyzeResponse' },
              },
            },
          },
        },
      },
      get: {
        tags: ['AI'],
        summary: 'Obtenir les résultats d\'analyse',
        description: 'Retourne les résultats de la dernière analyse.',
        operationId: 'getAnalysis',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'datasetId', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Résultats de l\'analyse',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AIAnalyzeResponse' },
              },
            },
          },
        },
      },
    },

    // ============================================
    // V1 API (Versioned)
    // ============================================
    '/v1/datasets': {
      get: {
        tags: ['Datasets'],
        summary: 'Lister les datasets (v1)',
        description: 'Version 1 de l\'API datasets avec support de pagination cursor.',
        operationId: 'listDatasetsV1',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'cursor', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'direction', in: 'query', schema: { type: 'string', enum: ['forward', 'backward'] } },
        ],
        responses: {
          '200': {
            description: 'Liste des datasets',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DatasetListV1Response' },
              },
            },
          },
        },
      },
    },
  },

  components: {
    schemas: {
      // ============================================
      // AUTH SCHEMAS
      // ============================================
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          organizationName: { type: 'string' },
          organizationType: {
            type: 'string',
            enum: ['MINISTRY', 'NGO', 'ENTERPRISE', 'ACADEMIC', 'OTHER'],
          },
          sector: { type: 'string' },
        },
      },
      RegisterResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          requiresVerification: { type: 'boolean' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
            },
          },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          token: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['owner', 'admin', 'analyst', 'viewer'] },
          organizationId: { type: 'string' },
          emailVerified: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      SSOConfig: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          provider: { type: 'string', enum: ['azure-ad', 'okta', 'google-workspace', 'custom'] },
          entryPoint: { type: 'string', format: 'uri' },
          issuer: { type: 'string' },
          callbackUrl: { type: 'string', format: 'uri' },
          isActive: { type: 'boolean' },
          autoProvision: { type: 'boolean' },
          defaultRole: { type: 'string' },
        },
      },
      SSOConfigInput: {
        type: 'object',
        required: ['provider', 'entryPoint', 'issuer', 'certificate'],
        properties: {
          provider: { type: 'string', enum: ['azure-ad', 'okta', 'google-workspace', 'custom'] },
          entryPoint: { type: 'string', format: 'uri' },
          issuer: { type: 'string' },
          certificate: { type: 'string' },
          callbackUrl: { type: 'string', format: 'uri' },
          autoProvision: { type: 'boolean', default: true },
          defaultRole: { type: 'string', enum: ['admin', 'analyst', 'viewer'] },
          attributeMapping: { type: 'object' },
        },
      },

      // ============================================
      // DATASET SCHEMAS
      // ============================================
      Dataset: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          originalFileName: { type: 'string' },
          fileSize: { type: 'integer' },
          fileType: { type: 'string', enum: ['CSV', 'EXCEL', 'JSON'] },
          rowCount: { type: 'integer' },
          columnCount: { type: 'integer' },
          status: {
            type: 'string',
            enum: ['PENDING', 'UPLOADING', 'PARSING', 'ANALYZING', 'COMPLETED', 'FAILED'],
          },
          columnsMetadata: {
            type: 'array',
            items: { $ref: '#/components/schemas/ColumnMetadata' },
          },
          organizationId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ColumnMetadata: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: {
            type: 'string',
            enum: ['numeric', 'currency', 'percentage', 'date', 'category', 'text', 'geo', 'id', 'boolean'],
          },
          sampleValues: { type: 'array', items: {} },
          nullCount: { type: 'integer' },
          uniqueCount: { type: 'integer' },
          stats: {
            type: 'object',
            properties: {
              min: { type: 'number' },
              max: { type: 'number' },
              mean: { type: 'number' },
              median: { type: 'number' },
              sum: { type: 'number' },
            },
          },
          format: { type: 'string' },
          description: { type: 'string' },
        },
      },
      DatasetListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          count: { type: 'integer' },
          datasets: {
            type: 'array',
            items: { $ref: '#/components/schemas/Dataset' },
          },
        },
      },
      DatasetResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          dataset: { $ref: '#/components/schemas/Dataset' },
        },
      },
      DatasetDataResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'array', items: { type: 'object' } },
          total: { type: 'integer' },
          limit: { type: 'integer' },
          offset: { type: 'integer' },
        },
      },
      DatasetListV1Response: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Dataset' } },
          nextCursor: { type: 'string', nullable: true },
          previousCursor: { type: 'string', nullable: true },
          hasMore: { type: 'boolean' },
        },
      },
      UploadResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          dataset: { $ref: '#/components/schemas/Dataset' },
          message: { type: 'string' },
        },
      },

      // ============================================
      // KPI SCHEMAS
      // ============================================
      KPIConfig: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          value: { type: 'number' },
          unit: { type: 'string' },
          trend: { type: 'string', enum: ['up', 'down', 'stable'] },
          trendValue: { type: 'number' },
          isKeyMetric: { type: 'boolean' },
          chartType: {
            type: 'string',
            enum: ['bar', 'line', 'area', 'donut', 'pie', 'gauge', 'table', 'barlist'],
          },
          dataSource: {
            type: 'object',
            properties: {
              column: { type: 'string' },
              aggregation: { type: 'string', enum: ['sum', 'avg', 'count', 'min', 'max'] },
              groupBy: { type: 'string' },
            },
          },
          insightText: { type: 'string' },
          alertThreshold: { type: 'number' },
        },
      },
      KPIConfigInput: {
        type: 'object',
        required: ['datasetId', 'config'],
        properties: {
          datasetId: { type: 'string' },
          config: { type: 'object' },
          version: { type: 'integer' },
          isPublished: { type: 'boolean' },
        },
      },

      // ============================================
      // DASHBOARD SCHEMAS
      // ============================================
      DashboardConfig: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          executiveSummary: { type: 'string' },
          kpis: {
            type: 'array',
            items: { $ref: '#/components/schemas/KPIConfig' },
          },
          keyInsights: {
            type: 'array',
            items: { type: 'string' },
          },
          recommendations: {
            type: 'array',
            items: { type: 'string' },
          },
          filters: { type: 'array', items: { type: 'object' } },
        },
      },

      // ============================================
      // AI SCHEMAS
      // ============================================
      AIAnalyzeResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              fileMetadata: {
                type: 'object',
                properties: {
                  fileName: { type: 'string' },
                  fileSize: { type: 'integer' },
                  rowCount: { type: 'integer' },
                  columnCount: { type: 'integer' },
                  fileType: { type: 'string' },
                },
              },
              columns: {
                type: 'array',
                items: { $ref: '#/components/schemas/ColumnMetadata' },
              },
              datasetSummary: { type: 'string' },
              suggestedKpis: { type: 'array', items: { type: 'object' } },
              suggestedCharts: { type: 'array', items: { type: 'object' } },
              generatedKpiConfigs: { type: 'array', items: { $ref: '#/components/schemas/KPIConfig' } },
              insights: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'array', items: { type: 'string' } },
              sampleData: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      AIQueryResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          result: {
            type: 'object',
            properties: {
              interpretation: { type: 'string' },
              intent: { type: 'string' },
              data: { type: 'array', items: { type: 'object' } },
              chartConfig: { type: 'object' },
              summary: { type: 'string' },
            },
          },
        },
      },
      AIInsightsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          insights: {
            type: 'object',
            properties: {
              trends: { type: 'array', items: { type: 'object' } },
              anomalies: { type: 'array', items: { type: 'object' } },
              correlations: { type: 'array', items: { type: 'object' } },
              executiveSummary: { type: 'string' },
              recommendations: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
      AIPredictResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          predictions: {
            type: 'object',
            properties: {
              values: { type: 'array', items: { type: 'number' } },
              dates: { type: 'array', items: { type: 'string' } },
              confidenceIntervals: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    lower: { type: 'number' },
                    upper: { type: 'number' },
                  },
                },
              },
              modelMetrics: {
                type: 'object',
                properties: {
                  mape: { type: 'number' },
                  rmse: { type: 'number' },
                },
              },
            },
          },
        },
      },
      AIChatResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          response: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              conversationId: { type: 'string' },
              suggestedActions: { type: 'array', items: { type: 'string' } },
              relatedData: { type: 'object' },
            },
          },
        },
      },
      AICleanResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          report: {
            type: 'object',
            properties: {
              qualityScore: { type: 'number' },
              issues: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    column: { type: 'string' },
                    count: { type: 'integer' },
                    severity: { type: 'string', enum: ['low', 'medium', 'high'] },
                    suggestions: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
              fixesApplied: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },

      // ============================================
      // PAYMENT SCHEMAS
      // ============================================
      PaymentInitializeRequest: {
        type: 'object',
        required: ['organizationId', 'plan', 'email'],
        properties: {
          organizationId: { type: 'string' },
          plan: {
            type: 'string',
            enum: ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
          },
          email: { type: 'string', format: 'email' },
          billingCycle: { type: 'string', enum: ['monthly', 'yearly'], default: 'monthly' },
          callbackUrl: { type: 'string', format: 'uri' },
        },
      },
      PaymentInitializeResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              authorizationUrl: { type: 'string', format: 'uri' },
              reference: { type: 'string' },
              accessCode: { type: 'string' },
            },
          },
        },
      },
      PaymentVerifyResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              reference: { type: 'string' },
              amount: { type: 'number' },
              currency: { type: 'string' },
              paidAt: { type: 'string', format: 'date-time' },
              channel: { type: 'string' },
            },
          },
        },
      },
      PaystackWebhookPayload: {
        type: 'object',
        properties: {
          event: { type: 'string' },
          data: { type: 'object' },
        },
      },
      Subscription: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          organizationId: { type: 'string' },
          tier: { type: 'string', enum: ['free', 'starter', 'professional', 'enterprise'] },
          status: { type: 'string', enum: ['active', 'past_due', 'canceled', 'inactive'] },
          price: { type: 'number' },
          currency: { type: 'string' },
          billingCycle: { type: 'string', enum: ['monthly', 'yearly'] },
          currentPeriodStart: { type: 'string', format: 'date-time' },
          currentPeriodEnd: { type: 'string', format: 'date-time' },
          cancelAtPeriodEnd: { type: 'boolean' },
          paystackSubscriptionId: { type: 'string' },
        },
      },

      // ============================================
      // ORGANIZATION SCHEMAS
      // ============================================
      Organization: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['ministry', 'ngo', 'enterprise', 'academic', 'other'] },
          sector: { type: 'string' },
          country: { type: 'string' },
          city: { type: 'string' },
          subscriptionTier: { type: 'string' },
          logoUrl: { type: 'string', format: 'uri' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      OrganizationInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['ministry', 'ngo', 'enterprise', 'academic', 'other'] },
          sector: { type: 'string' },
          country: { type: 'string' },
          city: { type: 'string' },
        },
      },

      // ============================================
      // TEAM SCHEMAS
      // ============================================
      TeamMember: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['owner', 'admin', 'analyst', 'viewer'] },
          avatarUrl: { type: 'string', format: 'uri' },
          joinedAt: { type: 'string', format: 'date-time' },
        },
      },

      // ============================================
      // NOTIFICATION SCHEMAS
      // ============================================
      NotificationListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          notifications: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                title: { type: 'string' },
                message: { type: 'string' },
                read: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' },
                actionUrl: { type: 'string', format: 'uri' },
              },
            },
          },
          unreadCount: { type: 'integer' },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },

      // ============================================
      // COMMENT SCHEMAS
      // ============================================
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          content: { type: 'string' },
          entityType: { type: 'string' },
          entityId: { type: 'string' },
          author: { $ref: '#/components/schemas/User' },
          parentId: { type: 'string', nullable: true },
          replies: {
            type: 'array',
            items: { $ref: '#/components/schemas/Comment' },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      // ============================================
      // API KEY SCHEMAS
      // ============================================
      ApiKey: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          prefix: { type: 'string' },
          permissions: { type: 'array', items: { type: 'string' } },
          lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ApiKeyCreated: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          key: { type: 'string', description: 'Clé complète (affichée une seule fois)' },
          permissions: { type: 'array', items: { type: 'string' } },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },

      // ============================================
      // WEBHOOK SCHEMAS
      // ============================================
      Webhook: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          events: { type: 'array', items: { type: 'string' } },
          isActive: { type: 'boolean' },
          secret: { type: 'string' },
          lastTriggeredAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      WebhookInput: {
        type: 'object',
        required: ['name', 'url', 'events'],
        properties: {
          name: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          events: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['dataset.created', 'dataset.analyzed', 'report.generated', 'subscription.created', 'subscription.canceled', 'payment.received'],
            },
          },
          secret: { type: 'string' },
          isActive: { type: 'boolean', default: true },
        },
      },

      // ============================================
      // TEMPLATE SCHEMAS
      // ============================================
      DashboardTemplate: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          sector: { type: 'string' },
          organizationType: { type: 'string' },
          previewImage: { type: 'string', format: 'uri' },
          config: { $ref: '#/components/schemas/DashboardConfig' },
          isPremium: { type: 'boolean' },
          usageCount: { type: 'integer' },
        },
      },

      // ============================================
      // CONNECTOR SCHEMAS
      // ============================================
      Connector: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['google_sheets', 'airtable', 'postgresql', 'mysql', 'mongodb', 'api', 's3'] },
          config: { type: 'object' },
          lastSyncAt: { type: 'string', format: 'date-time', nullable: true },
          syncStatus: { type: 'string', enum: ['pending', 'syncing', 'completed', 'failed'] },
          isActive: { type: 'boolean' },
        },
      },
      ConnectorInput: {
        type: 'object',
        required: ['name', 'type', 'config'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['google_sheets', 'airtable', 'postgresql', 'mysql', 'mongodb', 'api', 's3'] },
          config: { type: 'object' },
          syncSchedule: { type: 'string', description: 'Expression cron' },
        },
      },

      // ============================================
      // INVOICE SCHEMAS
      // ============================================
      Invoice: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          invoiceNumber: { type: 'string' },
          organizationId: { type: 'string' },
          userId: { type: 'string' },
          subscriptionId: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['draft', 'pending', 'paid', 'overdue', 'canceled', 'refunded'] },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'integer' },
                unitPrice: { type: 'number' },
                total: { type: 'number' },
              },
            },
          },
          subtotal: { type: 'number' },
          taxRate: { type: 'number' },
          taxAmount: { type: 'number' },
          discountAmount: { type: 'number' },
          totalAmount: { type: 'number' },
          currency: { type: 'string' },
          dueDate: { type: 'string', format: 'date-time' },
          paidAt: { type: 'string', format: 'date-time', nullable: true },
          pdfUrl: { type: 'string', format: 'uri', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      InvoiceInput: {
        type: 'object',
        required: ['organizationId', 'items'],
        properties: {
          organizationId: { type: 'string' },
          userId: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['description', 'quantity', 'unitPrice'],
              properties: {
                description: { type: 'string' },
                quantity: { type: 'integer' },
                unitPrice: { type: 'number' },
              },
            },
          },
          taxRate: { type: 'number' },
          discountAmount: { type: 'number' },
          currency: { type: 'string', default: 'EUR' },
          dueInDays: { type: 'integer', default: 30 },
        },
      },
      InvoiceListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          invoices: {
            type: 'array',
            items: { $ref: '#/components/schemas/Invoice' },
          },
          stats: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              totalRevenue: { type: 'number' },
              pendingAmount: { type: 'number' },
              overdueAmount: { type: 'number' },
            },
          },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },

      // ============================================
      // AUDIT SCHEMAS
      // ============================================
      AuditLogListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          logs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                action: { type: 'string' },
                entityType: { type: 'string' },
                entityId: { type: 'string' },
                userId: { type: 'string' },
                userName: { type: 'string' },
                ipAddress: { type: 'string' },
                status: { type: 'string', enum: ['success', 'failed', 'pending'] },
                metadata: { type: 'object' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
          stats: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              successCount: { type: 'integer' },
              failedCount: { type: 'integer' },
              uniqueUsers: { type: 'integer' },
            },
          },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },

      // ============================================
      // SHARE SCHEMAS
      // ============================================
      SharedDashboardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          dashboard: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              organization: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          kpis: {
            type: 'array',
            items: { $ref: '#/components/schemas/KPIConfig' },
          },
          rawData: {
            type: 'array',
            items: { type: 'object' },
          },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },

      // ============================================
      // HEALTH SCHEMAS
      // ============================================
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
          timestamp: { type: 'string', format: 'date-time' },
          version: { type: 'string' },
          checks: {
            type: 'object',
            properties: {
              database: { type: 'string', enum: ['up', 'down'] },
              redis: { type: 'string', enum: ['up', 'down'] },
              ai: { type: 'string', enum: ['up', 'down'] },
            },
          },
          uptime: { type: 'number' },
        },
      },

      // ============================================
      // HISTORY SCHEMAS
      // ============================================
      HistoryEntry: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          action: { type: 'string' },
          entityType: { type: 'string' },
          entityId: { type: 'string' },
          userId: { type: 'string' },
          userName: { type: 'string' },
          changes: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ============================================
      // EXPORT SCHEMAS
      // ============================================
      PDFPreviewResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          preview: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              executiveSummary: { type: 'string' },
              kpisCount: { type: 'integer' },
              keyMetricsCount: { type: 'integer' },
              insightsCount: { type: 'integer' },
              recommendationsCount: { type: 'integer' },
              organizationName: { type: 'string' },
              generatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },

      // ============================================
      // COMMON SCHEMAS
      // ============================================
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: false },
          error: { type: 'string' },
          code: { type: 'string' },
          details: { type: 'object' },
        },
      },
    },

    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtenu via /api/auth/login',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Clé API créée via /api/api-keys',
      },
    },
  },

  security: [{ bearerAuth: [] }],
};

export default openApiSpec;
