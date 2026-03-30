// ============================================
// InsightGov Africa - Swagger/OpenAPI Documentation
// Documentation interactive de l'API
// ============================================

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'InsightGov Africa API',
    version: '1.0.0',
    description: `
      API de la plateforme InsightGov Africa - Dashboards IA pour l'Afrique.

      ## Authentification
      L'API utilise NextAuth.js avec JWT. Incluez le token dans le header:
      \`\`\`
      Authorization: Bearer <token>
      \`\`\`

      ## Rate Limiting
      - API générale: 100 req/min
      - Auth: 5 tentatives/15min
      - Upload: 20/heure
      - Export: 50/heure

      ## Support
      Email: support@insightgov.africa
    `,
    contact: {
      name: 'InsightGov Africa',
      email: 'support@insightgov.africa',
      url: 'https://insightgov.africa',
    },
    license: {
      name: 'Proprietary',
      url: 'https://insightgov.africa/legal/terms',
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
  ],
  tags: [
    { name: 'Auth', description: 'Authentification et sessions' },
    { name: 'Datasets', description: 'Gestion des datasets' },
    { name: 'KPIs', description: 'Indicateurs clés de performance' },
    { name: 'Organizations', description: 'Gestion des organisations' },
    { name: 'Payments', description: 'Paiements et abonnements' },
    { name: 'Share', description: 'Partage de dashboards' },
    { name: 'Demo', description: 'Données de démonstration' },
  ],
  paths: {
    // ============================================
    // AUTH
    // ============================================
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Créer un compte',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' },
                  organizationName: { type: 'string' },
                  organizationType: {
                    type: 'string',
                    enum: ['MINISTRY', 'NGO', 'ENTERPRISE', 'ACADEMIC', 'OTHER'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Compte créé avec succès',
          },
          '400': { description: 'Données invalides' },
          '409': { description: 'Email déjà utilisé' },
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
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Liste des datasets',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Dataset' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Datasets'],
        summary: 'Créer un dataset',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  name: { type: 'string' },
                  sector: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Dataset créé' },
          '400': { description: 'Fichier invalide' },
          '413': { description: 'Fichier trop volumineux' },
        },
      },
    },

    '/datasets/{id}': {
      get: {
        tags: ['Datasets'],
        summary: 'Obtenir un dataset',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Détails du dataset',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Dataset' },
              },
            },
          },
          '404': { description: 'Dataset non trouvé' },
        },
      },
      delete: {
        tags: ['Datasets'],
        summary: 'Supprimer un dataset',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '204': { description: 'Dataset supprimé' },
          '404': { description: 'Dataset non trouvé' },
        },
      },
    },

    '/datasets/{id}/data': {
      get: {
        tags: ['Datasets'],
        summary: 'Obtenir les données brutes',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 100 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: {
          '200': {
            description: 'Données du dataset',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { type: 'object' } },
                    total: { type: 'integer' },
                  },
                },
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
        summary: 'Lister les KPIs',
        parameters: [
          { name: 'datasetId', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Liste des KPIs',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Kpi' },
                },
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
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['organizationId', 'plan', 'email'],
                properties: {
                  organizationId: { type: 'string' },
                  plan: {
                    type: 'string',
                    enum: ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
                  },
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'URL de paiement Paystack',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        authorizationUrl: { type: 'string', format: 'uri' },
                        reference: { type: 'string' },
                      },
                    },
                  },
                },
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
        parameters: [
          { name: 'reference', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Paiement vérifié' },
          '400': { description: 'Paiement échoué' },
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
        parameters: [
          { name: 'token', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Dashboard public',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    dashboard: { $ref: '#/components/schemas/Dashboard' },
                    kpis: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Kpi' },
                    },
                    rawData: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
          '404': { description: 'Dashboard non trouvé' },
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
                    enum: ['health', 'education', 'agriculture', 'finance'],
                  },
                  rowCount: { type: 'integer', default: 200 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Dataset de démo généré',
          },
        },
      },
    },
  },
  components: {
    schemas: {
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
          processingStatus: {
            type: 'string',
            enum: ['PENDING', 'UPLOADING', 'PARSING', 'ANALYZING', 'COMPLETED', 'FAILED'],
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Kpi: {
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
          insightText: { type: 'string' },
        },
      },
      Dashboard: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          isPublic: { type: 'boolean' },
          shareToken: { type: 'string' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

export default swaggerSpec;
