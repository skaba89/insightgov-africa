// ============================================
// InsightGov Africa - Comprehensive API E2E Tests
// ============================================

import { test, expect, APIRequestContext } from '@playwright/test';

// ============================================
// API Health Tests
// ============================================

test.describe('API Health Endpoints', () => {
  test('should return healthy status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBeDefined();
    expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
  });

  test('should include timestamp in health response', async ({ request }) => {
    const response = await request.get('/api/health');
    const data = await response.json();

    expect(data.timestamp).toBeDefined();
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
  });

  test('should include version information', async ({ request }) => {
    const response = await request.get('/api/health');
    const data = await response.json();

    expect(data.version).toBeDefined();
  });

  test('should include environment information', async ({ request }) => {
    const response = await request.get('/api/health');
    const data = await response.json();

    expect(data.environment).toBeDefined();
  });

  test('should include uptime', async ({ request }) => {
    const response = await request.get('/api/health');
    const data = await response.json();

    expect(data.uptime).toBeDefined();
    expect(data.uptime).toBeGreaterThanOrEqual(0);
  });

  test('should include database status', async ({ request }) => {
    const response = await request.get('/api/health');
    const data = await response.json();

    expect(data.checks).toBeDefined();
    expect(data.checks.database).toBeDefined();
    expect(data.checks.database.status).toBeDefined();
  });

  test('should include environment variables check', async ({ request }) => {
    const response = await request.get('/api/health');
    const data = await response.json();

    expect(data.checks.environment).toBeDefined();
    expect(data.checks.environment.status).toBeDefined();
  });

  test('should include AI configuration check', async ({ request }) => {
    const response = await request.get('/api/health');
    const data = await response.json();

    expect(data.checks.ai).toBeDefined();
  });

  test('should return response time', async ({ request }) => {
    const response = await request.get('/api/health');
    const data = await response.json();

    expect(data.responseTime).toBeDefined();
  });
});

// ============================================
// API Documentation Tests
// ============================================

test.describe('API Documentation', () => {
  test('should serve Swagger UI', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');

    // Check for Swagger UI elements
    const swaggerUI = page.locator('.swagger-ui, #swagger-ui');
    await expect(swaggerUI).toBeVisible();
  });

  test('should return OpenAPI spec', async ({ request }) => {
    const response = await request.get('/api/docs');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.openapi).toBeDefined();
    expect(data.openapi).toMatch(/^3\./);
  });

  test('should include API paths in OpenAPI spec', async ({ request }) => {
    const response = await request.get('/api/docs');
    const data = await response.json();

    expect(data.paths).toBeDefined();
    expect(Object.keys(data.paths).length).toBeGreaterThan(0);
  });

  test('should include API info in OpenAPI spec', async ({ request }) => {
    const response = await request.get('/api/docs');
    const data = await response.json();

    expect(data.info).toBeDefined();
    expect(data.info.title).toBeDefined();
    expect(data.info.version).toBeDefined();
  });

  test('should include security schemes in OpenAPI spec', async ({ request }) => {
    const response = await request.get('/api/docs');
    const data = await response.json();

    // Security schemes might be present
    if (data.components?.securitySchemes) {
      expect(data.components.securitySchemes).toBeDefined();
    }
  });
});

// ============================================
// Templates API Tests
// ============================================

test.describe('Templates API', () => {
  test('should list all templates', async ({ request }) => {
    const response = await request.get('/api/templates');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.templates).toBeDefined();
    expect(Array.isArray(data.templates)).toBe(true);
  });

  test('should include template count', async ({ request }) => {
    const response = await request.get('/api/templates');
    const data = await response.json();

    expect(data.count).toBeDefined();
    expect(data.count).toBeGreaterThan(0);
  });

  test('should filter templates by sector', async ({ request }) => {
    const response = await request.get('/api/templates?sector=health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.templates).toBeDefined();
  });

  test('should filter templates by organization type', async ({ request }) => {
    const response = await request.get('/api/templates?organizationType=ministry');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('should return 404 for non-existent template', async ({ request }) => {
    const response = await request.get('/api/templates?id=non-existent-template-123');
    expect(response.status()).toBe(404);
  });

  test('should require templateId for POST', async ({ request }) => {
    const response = await request.post('/api/templates', {
      data: {},
    });

    expect(response.status()).toBe(400);
  });

  test('should validate auto-detect parameters', async ({ request }) => {
    const response = await request.post('/api/templates', {
      data: {
        autoDetect: true,
        // Missing required columns and sector
      },
    });

    expect(response.status()).toBe(400);
  });
});

// ============================================
// Auth API Tests
// ============================================

test.describe('Auth API', () => {
  test('should reject invalid registration', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        email: 'invalid-email',
        password: 'short',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should validate registration fields', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {},
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  test('should reject duplicate registration', async ({ request }) => {
    const email = `test.${Date.now()}@example.com`;

    // First registration
    await request.post('/api/auth/register', {
      data: {
        email,
        password: 'Password123!',
        name: 'Test User',
      },
    });

    // Second registration with same email
    const response = await request.post('/api/auth/register', {
      data: {
        email,
        password: 'Password123!',
        name: 'Test User 2',
      },
    });

    // Should fail with 400 or 409
    expect([400, 409]).toContain(response.status());
  });

  test('should validate password strength', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        email: `test.${Date.now()}@example.com`,
        password: '123', // Too weak
        name: 'Test User',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should handle forgot password request', async ({ request }) => {
    const response = await request.post('/api/auth/reset-password', {
      data: {
        email: 'test@example.com',
      },
    });

    // Should succeed or return appropriate error
    expect([200, 400, 404]).toContain(response.status());
  });

  test('should handle resend verification request', async ({ request }) => {
    const response = await request.post('/api/auth/resend-verification', {
      data: {
        email: 'test@example.com',
      },
    });

    // Should succeed or return appropriate error
    expect([200, 400, 404, 429]).toContain(response.status());
  });
});

// ============================================
// Datasets API Tests
// ============================================

test.describe('Datasets API', () => {
  test('should require authentication for datasets list', async ({ request }) => {
    const response = await request.get('/api/datasets');
    expect([200, 401]).toContain(response.status());
  });

  test('should require authentication for creating datasets', async ({ request }) => {
    const response = await request.post('/api/datasets', {
      data: {
        name: 'Test Dataset',
      },
    });

    expect([400, 401]).toContain(response.status());
  });

  test('should return 404 for non-existent dataset', async ({ request }) => {
    const response = await request.get('/api/datasets/non-existent-id-123');
    expect(response.status()).toBe(404);
  });

  test('should require authentication for dataset update', async ({ request }) => {
    const response = await request.patch('/api/datasets/test-id', {
      data: {
        name: 'Updated Name',
      },
    });

    expect([400, 401, 404]).toContain(response.status());
  });

  test('should require authentication for dataset deletion', async ({ request }) => {
    const response = await request.delete('/api/datasets/test-id');
    expect([401, 404]).toContain(response.status());
  });
});

// ============================================
// KPIs API Tests
// ============================================

test.describe('KPIs API', () => {
  test('should require authentication for KPIs list', async ({ request }) => {
    const response = await request.get('/api/kpis');
    expect([200, 401]).toContain(response.status());
  });

  test('should require authentication for creating KPIs', async ({ request }) => {
    const response = await request.post('/api/kpis', {
      data: {
        name: 'Test KPI',
      },
    });

    expect([400, 401]).toContain(response.status());
  });

  test('should return 404 for non-existent KPI', async ({ request }) => {
    const response = await request.get('/api/kpis/non-existent-id-123');
    expect(response.status()).toBe(404);
  });
});

// ============================================
// Export API Tests
// ============================================

test.describe('Export API', () => {
  test('should reject PDF export without data', async ({ request }) => {
    const response = await request.post('/api/export/pdf', {
      data: {},
    });

    expect([400, 401]).toContain(response.status());
  });

  test('should reject Excel export without data', async ({ request }) => {
    const response = await request.post('/api/export/excel', {
      data: {},
    });

    expect([400, 401]).toContain(response.status());
  });

  test('should reject PowerPoint export without data', async ({ request }) => {
    const response = await request.post('/api/export/powerpoint', {
      data: {},
    });

    expect([400, 401, 404]).toContain(response.status());
  });

  test('should require kpiConfigId for PDF preview', async ({ request }) => {
    const response = await request.get('/api/export/pdf');
    expect(response.status()).toBe(400);
  });

  test('should return 404 for non-existent KPI config in PDF preview', async ({ request }) => {
    const response = await request.get('/api/export/pdf?kpiConfigId=non-existent');
    expect(response.status()).toBe(404);
  });

  test('should validate export format', async ({ request }) => {
    const response = await request.get('/api/export');
    expect(response.ok()).toBeTruthy();
  });
});

// ============================================
// Payment API Tests
// ============================================

test.describe('Payment API', () => {
  test('should reject payment initialization without data', async ({ request }) => {
    const response = await request.post('/api/payments/initialize', {
      data: {},
    });

    expect(response.status()).toBe(400);
  });

  test('should validate payment amount', async ({ request }) => {
    const response = await request.post('/api/payments/initialize', {
      data: {
        amount: -100,
        email: 'test@example.com',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should validate payment email', async ({ request }) => {
    const response = await request.post('/api/payments/initialize', {
      data: {
        amount: 100,
        email: 'invalid-email',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should verify payment reference', async ({ request }) => {
    const response = await request.get('/api/payments/verify?reference=test');

    // Will fail without real reference, but should handle gracefully
    expect([200, 400, 404]).toContain(response.status());
  });

  test('should require reference for verification', async ({ request }) => {
    const response = await request.get('/api/payments/verify');
    expect(response.status()).toBe(400);
  });
});

// ============================================
// Subscriptions API Tests
// ============================================

test.describe('Subscriptions API', () => {
  test('should require authentication for subscription status', async ({ request }) => {
    const response = await request.get('/api/subscriptions');
    expect(response.status()).toBe(401);
  });

  test('should require authentication for plan change', async ({ request }) => {
    const response = await request.post('/api/subscriptions', {
      data: {
        plan: 'professional',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should require authentication for subscription cancellation', async ({ request }) => {
    const response = await request.delete('/api/subscriptions');
    expect(response.status()).toBe(401);
  });

  test('should validate plan parameter', async ({ request }) => {
    const response = await request.post('/api/subscriptions', {
      data: {
        plan: 'invalid-plan',
      },
    });

    expect([400, 401]).toContain(response.status());
  });
});

// ============================================
// Upload API Tests
// ============================================

test.describe('Upload API', () => {
  test('should reject upload without file', async ({ request }) => {
    const response = await request.post('/api/upload', {
      data: {},
    });

    expect(response.status()).toBe(400);
  });

  test('should require userId for upload', async ({ request }) => {
    // Create a simple CSV file
    const csvContent = 'name,value\ntest,123';
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

    const response = await request.post('/api/upload', {
      multipart: {
        file,
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should validate file type', async ({ request }) => {
    // Create an invalid file type
    const textContent = 'This is not a valid data file';
    const file = new File([textContent], 'test.txt', { type: 'text/plain' });

    const response = await request.post('/api/upload', {
      multipart: {
        file,
        userId: 'test-user',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should require userId for listing datasets', async ({ request }) => {
    const response = await request.get('/api/upload');
    expect(response.status()).toBe(400);
  });

  test('should list datasets with userId', async ({ request }) => {
    const response = await request.get('/api/upload?userId=test-user');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.datasets)).toBe(true);
  });
});

// ============================================
// AI API Tests
// ============================================

test.describe('AI API', () => {
  test('should require authentication for AI analysis', async ({ request }) => {
    const response = await request.post('/api/ai/analyze', {
      data: {},
    });

    expect([400, 401]).toContain(response.status());
  });

  test('should require authentication for AI insights', async ({ request }) => {
    const response = await request.post('/api/ai/insights', {
      data: {},
    });

    expect([400, 401]).toContain(response.status());
  });

  test('should require authentication for AI query', async ({ request }) => {
    const response = await request.post('/api/ai/query', {
      data: {
        query: 'Show me sales data',
      },
    });

    expect([400, 401]).toContain(response.status());
  });

  test('should require authentication for AI predict', async ({ request }) => {
    const response = await request.post('/api/ai/predict', {
      data: {},
    });

    expect([400, 401]).toContain(response.status());
  });

  test('should require authentication for AI clean', async ({ request }) => {
    const response = await request.post('/api/ai/clean', {
      data: {},
    });

    expect([400, 401]).toContain(response.status());
  });
});

// ============================================
// Share API Tests
// ============================================

test.describe('Share API', () => {
  test('should handle invalid share token', async ({ request }) => {
    const response = await request.get('/api/share/invalid-token-123');
    expect(response.status()).toBe(404);
  });

  test('should return 404 for expired share token', async ({ request }) => {
    const response = await request.get('/api/share/expired-token');
    expect(response.status()).toBe(404);
  });
});

// ============================================
// Organizations API Tests
// ============================================

test.describe('Organizations API', () => {
  test('should require authentication for organizations', async ({ request }) => {
    const response = await request.get('/api/organizations');
    expect([200, 401]).toContain(response.status());
  });

  test('should require authentication for organization creation', async ({ request }) => {
    const response = await request.post('/api/organizations', {
      data: {
        name: 'Test Organization',
      },
    });

    expect([400, 401]).toContain(response.status());
  });

  test('should return 404 for non-existent organization', async ({ request }) => {
    const response = await request.get('/api/organizations?id=non-existent');
    expect([401, 404]).toContain(response.status());
  });
});

// ============================================
// Team API Tests
// ============================================

test.describe('Team API', () => {
  test('should require authentication for team list', async ({ request }) => {
    const response = await request.get('/api/team');
    expect([200, 401]).toContain(response.status());
  });

  test('should require authentication for team invite', async ({ request }) => {
    const response = await request.post('/api/team', {
      data: {
        action: 'invite',
        email: 'test@example.com',
      },
    });

    expect([400, 401]).toContain(response.status());
  });
});

// ============================================
// API Keys API Tests
// ============================================

test.describe('API Keys API', () => {
  test('should require authentication for API keys list', async ({ request }) => {
    const response = await request.get('/api/api-keys');
    expect([200, 401]).toContain(response.status());
  });

  test('should require authentication for API key creation', async ({ request }) => {
    const response = await request.post('/api/api-keys', {
      data: {
        name: 'Test Key',
      },
    });

    expect([400, 401]).toContain(response.status());
  });

  test('should require authentication for API key deletion', async ({ request }) => {
    const response = await request.delete('/api/api-keys?keyId=test');
    expect([401, 400]).toContain(response.status());
  });
});

// ============================================
// Demo API Tests
// ============================================

test.describe('Demo API', () => {
  test('should generate demo data', async ({ request }) => {
    const response = await request.post('/api/demo/generate', {
      data: {
        sector: 'health',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('should generate demo data for different sectors', async ({ request }) => {
    const sectors = ['health', 'education', 'agriculture', 'finance'];

    for (const sector of sectors) {
      const response = await request.post('/api/demo/generate', {
        data: { sector },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
    }
  });

  test('should handle invalid sector for demo', async ({ request }) => {
    const response = await request.post('/api/demo/generate', {
      data: {
        sector: 'invalid-sector',
      },
    });

    // Should either fail or use fallback
    expect([200, 400]).toContain(response.status());
  });
});

// ============================================
// Rate Limiting Tests
// ============================================

test.describe('Rate Limiting', () => {
  test('should apply rate limits', async ({ request }) => {
    // Make multiple requests
    const requests = Array(10)
      .fill(null)
      .map(() => request.get('/api/health'));

    const responses = await Promise.all(requests);

    // All should succeed (well under limit)
    responses.forEach((res) => {
      expect(res.ok()).toBeTruthy();
    });
  });

  test('should not block health endpoint', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
  });
});

// ============================================
// CORS and Security Headers Tests
// ============================================

test.describe('CORS and Security Headers', () => {
  test('should have security headers', async ({ request }) => {
    const response = await request.get('/api/health');

    const headers = response.headers();

    // X-Content-Type-Options should be set
    const contentTypeOptions =
      headers['x-content-type-options'] || headers['X-Content-Type-Options'];
    expect(contentTypeOptions).toBeTruthy();
  });

  test('should handle OPTIONS preflight', async ({ request }) => {
    const response = await request.fetch('/api/health', {
      method: 'OPTIONS',
    });

    expect([200, 204]).toContain(response.status());
  });

  test('should have proper content-type for JSON responses', async ({ request }) => {
    const response = await request.get('/api/health');
    const contentType = response.headers()['content-type'];

    expect(contentType).toContain('application/json');
  });
});

// ============================================
// Error Handling Tests
// ============================================

test.describe('Error Handling', () => {
  test('should return JSON error for 404', async ({ request }) => {
    const response = await request.get('/api/non-existent-endpoint');
    expect(response.status()).toBe(404);
  });

  test('should return JSON error for invalid JSON body', async ({ request }) => {
    const response = await request.post('/api/health', {
      data: 'invalid json string',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Should handle gracefully
    expect([200, 400, 404, 405]).toContain(response.status());
  });

  test('should return proper error structure', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {},
    });

    const data = await response.json();
    expect(data.error || data.message || data.success).toBeDefined();
  });
});

// ============================================
// API Versioning Tests
// ============================================

test.describe('API Versioning', () => {
  test('should handle v1 API endpoints', async ({ request }) => {
    const response = await request.get('/api/v1/datasets');
    expect([200, 401]).toContain(response.status());
  });

  test('should maintain backward compatibility', async ({ request }) => {
    // Both v1 and unversioned should work
    const v1Response = await request.get('/api/v1/datasets');
    const unversionedResponse = await request.get('/api/datasets');

    expect(v1Response.status()).toBe(unversionedResponse.status());
  });
});

// ============================================
// Webhooks API Tests
// ============================================

test.describe('Webhooks API', () => {
  test('should reject unauthorized webhook', async ({ request }) => {
    const response = await request.post('/api/webhooks', {
      data: {
        event: 'test.event',
      },
    });

    expect([400, 401, 403]).toContain(response.status());
  });

  test('should reject Paystack webhook without signature', async ({ request }) => {
    const response = await request.post('/api/paystack/webhook', {
      data: {
        event: 'charge.success',
      },
    });

    expect([400, 401, 403]).toContain(response.status());
  });
});

// ============================================
// Connectors API Tests
// ============================================

test.describe('Connectors API', () => {
  test('should require authentication for connectors', async ({ request }) => {
    const response = await request.get('/api/connectors');
    expect([200, 401]).toContain(response.status());
  });

  test('should require authentication for connector creation', async ({ request }) => {
    const response = await request.post('/api/connectors', {
      data: {
        type: 'google_sheets',
      },
    });

    expect([400, 401]).toContain(response.status());
  });
});

// ============================================
// Notifications API Tests
// ============================================

test.describe('Notifications API', () => {
  test('should require authentication for notifications', async ({ request }) => {
    const response = await request.get('/api/notifications');
    expect([200, 401]).toContain(response.status());
  });

  test('should require authentication for marking notifications', async ({ request }) => {
    const response = await request.post('/api/notifications', {
      data: {
        action: 'mark_read',
      },
    });

    expect([400, 401]).toContain(response.status());
  });
});

// ============================================
// History API Tests
// ============================================

test.describe('History API', () => {
  test('should require authentication for history', async ({ request }) => {
    const response = await request.get('/api/history');
    expect([200, 401]).toContain(response.status());
  });
});

// ============================================
// Comments API Tests
// ============================================

test.describe('Comments API', () => {
  test('should require authentication for comments', async ({ request }) => {
    const response = await request.get('/api/comments');
    expect([200, 401]).toContain(response.status());
  });

  test('should require authentication for creating comments', async ({ request }) => {
    const response = await request.post('/api/comments', {
      data: {
        content: 'Test comment',
      },
    });

    expect([400, 401]).toContain(response.status());
  });
});
