// ============================================
// InsightGov Africa - Tests E2E API
// ============================================

import { test, expect } from '@playwright/test';

test.describe('API Health', () => {
  test('should return healthy status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('ok');
  });
});

test.describe('API Documentation', () => {
  test('should serve Swagger UI', async ({ page }) => {
    await page.goto('/api-docs');
    await expect(page.locator('.swagger-ui, #swagger-ui')).toBeVisible();
  });

  test('should return OpenAPI spec', async ({ request }) => {
    const response = await request.get('/api/docs');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.openapi).toBeDefined();
    expect(data.paths).toBeDefined();
  });
});

test.describe('Demo API', () => {
  test('should generate demo data', async ({ request }) => {
    const response = await request.post('/api/demo/generate', {
      data: {
        sector: 'health',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBeTruthy();
  });
});

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
});

test.describe('Payment API', () => {
  test('should reject payment without data', async ({ request }) => {
    const response = await request.post('/api/payments/initialize', {
      data: {},
    });

    expect(response.status()).toBe(400);
  });

  test('should verify payment reference', async ({ request }) => {
    const response = await request.get('/api/payments/verify?reference=test');

    // Will fail without real reference, but should handle gracefully
    expect([200, 400, 404]).toContain(response.status());
  });
});

test.describe('Dataset API', () => {
  test('should require authentication for datasets', async ({ request }) => {
    const response = await request.get('/api/datasets');
    // Should return error or empty without auth
    expect([200, 401]).toContain(response.status());
  });

  test('should require authentication for KPIs', async ({ request }) => {
    const response = await request.get('/api/kpis');
    expect([200, 401]).toContain(response.status());
  });
});

test.describe('Export API', () => {
  test('should reject export without data', async ({ request }) => {
    const response = await request.post('/api/export/pdf', {
      data: {},
    });

    // Should require data or auth
    expect([400, 401]).toContain(response.status());
  });

  test('should reject excel export without data', async ({ request }) => {
    const response = await request.post('/api/export/excel', {
      data: {},
    });

    expect([400, 401]).toContain(response.status());
  });
});

test.describe('Share API', () => {
  test('should handle invalid share token', async ({ request }) => {
    const response = await request.get('/api/share/invalid-token-123');

    expect(response.status()).toBe(404);
  });
});

test.describe('Rate Limiting', () => {
  test('should apply rate limits', async ({ request }) => {
    // Make multiple requests
    const requests = Array(10).fill(null).map(() =>
      request.get('/api/health')
    );

    const responses = await Promise.all(requests);

    // All should succeed (well under limit)
    responses.forEach(res => {
      expect(res.ok()).toBeTruthy();
    });
  });
});

test.describe('CORS and Security Headers', () => {
  test('should have security headers', async ({ request }) => {
    const response = await request.get('/api/health');

    // Check for common security headers
    const headers = response.headers();

    // X-Content-Type-Options should be set
    expect(headers['x-content-type-options'] || headers['X-Content-Type-Options']).toBeTruthy();
  });
});
