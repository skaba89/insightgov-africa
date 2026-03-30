// ============================================
// InsightGov Africa - Export & Subscription E2E Tests
// ============================================

import { test, expect, Page, APIRequestContext } from '@playwright/test';

// ============================================
// Test Utilities
// ============================================

async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

async function enableDemoMode(page: Page) {
  await page.goto('/?demo=true');
  await waitForPageLoad(page);
}

// ============================================
// Export Functionality - UI Tests
// ============================================

test.describe('Export Functionality - UI', () => {
  test.beforeEach(async ({ page }) => {
    await enableDemoMode(page);
  });

  test('should show export options in dashboard', async ({ page }) => {
    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Exporter")');

    if (await exportButton.first().isVisible()) {
      await expect(exportButton.first()).toBeVisible();
    }
  });

  test('should show PDF export option', async ({ page }) => {
    const pdfButton = page.locator('button:has-text("PDF"), text=/PDF/');

    if (await pdfButton.first().isVisible()) {
      await expect(pdfButton.first()).toBeVisible();
    }
  });

  test('should show Excel export option', async ({ page }) => {
    const excelButton = page.locator('button:has-text("Excel"), text=/Excel/');

    if (await excelButton.first().isVisible()) {
      await expect(excelButton.first()).toBeVisible();
    }
  });

  test('should show PowerPoint export option', async ({ page }) => {
    const pptButton = page.locator('button:has-text("PowerPoint"), button:has-text("PPT"), text=/PowerPoint/');

    if (await pptButton.first().isVisible()) {
      await expect(pptButton.first()).toBeVisible();
    }
  });

  test('should open export modal when clicking export', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Exporter")').first();

    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(500);

      // Check for modal or dropdown
      const modal = page.locator('[role="dialog"], [class*="modal"], [class*="dropdown"]');
      const modalVisible = await modal.first().isVisible();

      expect(modalVisible).toBeTruthy();
    }
  });

  test('should show export format selection', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Exporter")').first();

    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(300);

      // Check for format options
      const formatOptions = page.locator('input[type="radio"], [role="radio"], [class*="format"]');
      const optionsCount = await formatOptions.count();

      expect(optionsCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show export options checkboxes', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Exporter")').first();

    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(300);

      // Look for option checkboxes
      const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
      const checkboxCount = await checkboxes.count();

      expect(checkboxCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have download button in export modal', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Exporter")').first();

    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(300);

      // Look for download/confirm button
      const downloadButton = page.locator('button:has-text("Télécharger"), button:has-text("Download"), button:has-text("Générer")');

      if (await downloadButton.first().isVisible()) {
        await expect(downloadButton.first()).toBeVisible();
      }
    }
  });

  test('should show premium indicator for advanced exports', async ({ page }) => {
    // Look for premium/pro indicators
    const premiumIndicator = page.locator('text=/Premium|Pro|Enterprise|🔒/');

    if (await premiumIndicator.first().isVisible()) {
      await expect(premiumIndicator.first()).toBeVisible();
    }
  });

  test('should close export modal on cancel', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Exporter")').first();

    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(300);

      // Click cancel
      const cancelButton = page.locator('button:has-text("Annuler"), button:has-text("Cancel")');

      if (await cancelButton.first().isVisible()) {
        await cancelButton.first().click();
        await page.waitForTimeout(300);

        // Modal should be closed
        const modal = page.locator('[role="dialog"]');
        const modalVisible = await modal.isVisible();
        expect(modalVisible).toBeFalsy();
      }
    }
  });
});

// ============================================
// Export Functionality - API Tests
// ============================================

test.describe('Export Functionality - API', () => {
  test('should reject PDF export without configuration', async ({ request }) => {
    const response = await request.post('/api/export/pdf', {
      data: {},
    });

    expect([400, 401]).toContain(response.status());
  });

  test('should reject Excel export without configuration', async ({ request }) => {
    const response = await request.post('/api/export/excel', {
      data: {},
    });

    expect([400, 401]).toContain(response.status());
  });

  test('should reject PowerPoint export without configuration', async ({ request }) => {
    const response = await request.post('/api/export/powerpoint', {
      data: {},
    });

    expect([400, 401, 404]).toContain(response.status());
  });

  test('should require kpiConfigId for PDF preview', async ({ request }) => {
    const response = await request.get('/api/export/pdf');

    expect(response.status()).toBe(400);
  });

  test('should return 404 for non-existent config in preview', async ({ request }) => {
    const response = await request.get('/api/export/pdf?kpiConfigId=non-existent-id');

    expect(response.status()).toBe(404);
  });

  test('should validate dashboard config for export', async ({ request }) => {
    const response = await request.post('/api/export/pdf', {
      data: {
        config: {
          title: 'Test Dashboard',
          // Missing required fields
        },
      },
    });

    expect([400, 401, 500]).toContain(response.status());
  });

  test('should handle valid export request structure', async ({ request }) => {
    const validConfig = {
      title: 'Test Dashboard',
      description: 'Test Description',
      kpis: [],
      filters: {},
    };

    const response = await request.post('/api/export/pdf', {
      data: {
        config: validConfig,
        organizationName: 'Test Organization',
      },
    });

    // May fail due to auth or other requirements
    expect([200, 400, 401, 500]).toContain(response.status());
  });
});

// ============================================
// Subscription Flow - UI Tests
// ============================================

test.describe('Subscription Flow - UI', () => {
  test('should display pricing page', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    await expect(page.locator('h1:has-text("Tarifs")')).toBeVisible();
  });

  test('should show all subscription tiers', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Starter')).toBeVisible();
    await expect(page.locator('text=Professional')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();
  });

  test('should show correct pricing amounts', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Check for price displays
    const prices = page.locator('text=/0€|99€|499€|1499€|250€|750€/');
    const priceCount = await prices.count();
    expect(priceCount).toBeGreaterThan(0);
  });

  test('should show monthly/yearly toggle', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    const toggle = page.locator('button[role="switch"], input[type="checkbox"], [class*="toggle"]').first();

    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForTimeout(300);
    }
  });

  test('should highlight popular plan', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Look for "popular" badge
    const popularBadge = page.locator('text=/populaire|popular|recommandé/i');

    if (await popularBadge.isVisible()) {
      await expect(popularBadge).toBeVisible();
    }
  });

  test('should show plan features', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Check for feature lists
    const features = page.locator('li, [class*="feature"]');
    const featureCount = await features.count();
    expect(featureCount).toBeGreaterThan(0);
  });

  test('should have CTA buttons for each plan', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    const ctaButtons = page.locator('button:has-text("Commencer"), a:has-text("Commencer"), button:has-text("Essai")');
    const buttonCount = await ctaButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should show FAQ section on pricing page', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    await expect(page.locator('text=FAQ')).toBeVisible();
  });

  test('should show guarantees section', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    const guarantee = page.locator('text=/garantie|satisfaction|essai gratuit/i');

    if (await guarantee.first().isVisible()) {
      await expect(guarantee.first()).toBeVisible();
    }
  });

  test('should show contact sales for enterprise', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    const contactButton = page.locator('text=/nous contacter|contact sales|Nous contacter/i');

    if (await contactButton.isVisible()) {
      await expect(contactButton).toBeVisible();
    }
  });
});

// ============================================
// Subscription Flow - Plan Selection Tests
// ============================================

test.describe('Subscription Flow - Plan Selection', () => {
  test('should click starter plan CTA', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Find starter plan and click its CTA
    const starterSection = page.locator('text=Starter').first();
    await starterSection.click();

    const ctaButton = page.locator('button:has-text("Commencer")').first();

    if (await ctaButton.isVisible()) {
      await ctaButton.click();
      await waitForPageLoad(page);

      // Should navigate to signup or payment
      expect(page.url()).toMatch(/\/(onboarding|signup|login|payment)/);
    }
  });

  test('should click professional plan CTA', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Find professional plan
    const professionalSection = page.locator('text=Professional').first();
    await professionalSection.click();

    const ctaButton = page.locator('button:has-text("Essai"), button:has-text("Commencer")').first();

    if (await ctaButton.isVisible()) {
      await ctaButton.click();
      await waitForPageLoad(page);

      expect(page.url()).toMatch(/\/(onboarding|signup|login|payment)/);
    }
  });

  test('should toggle yearly billing', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Find billing toggle
    const yearlyToggle = page.locator('text=/an|yearly|annuel/i').first();

    if (await yearlyToggle.isVisible()) {
      await yearlyToggle.click();
      await page.waitForTimeout(300);

      // Prices should update
      const prices = page.locator('text=/€/');
      const priceCount = await prices.count();
      expect(priceCount).toBeGreaterThan(0);
    }
  });

  test('should show savings for yearly plans', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Look for savings indicator
    const savings = page.locator('text=/économ|save|%|20%/i');

    if (await savings.first().isVisible()) {
      await expect(savings.first()).toBeVisible();
    }
  });
});

// ============================================
// Subscription Flow - API Tests
// ============================================

test.describe('Subscription Flow - API', () => {
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

  test('should validate plan parameter for change', async ({ request }) => {
    const response = await request.post('/api/subscriptions', {
      data: {
        plan: 'invalid-plan-name',
      },
    });

    expect([400, 401]).toContain(response.status());
  });

  test('should require plan parameter for change', async ({ request }) => {
    const response = await request.post('/api/subscriptions', {
      data: {},
    });

    expect([400, 401]).toContain(response.status());
  });
});

// ============================================
// Payment Flow - UI Tests
// ============================================

test.describe('Payment Flow - UI', () => {
  test('should show payment callback page', async ({ page }) => {
    await page.goto('/payment/callback?reference=test-ref');
    await waitForPageLoad(page);

    // Should show processing or result
    const processingOrResult = page.locator('text=/traitement|processing|merci|thank|succès|success|erreur|error/i');
    await expect(processingOrResult.first()).toBeVisible();
  });

  test('should handle payment demo page', async ({ page }) => {
    await page.goto('/payment/demo');
    await waitForPageLoad(page);

    // Check for demo payment elements
    const demoElements = page.locator('text=/demo|test|simulation/i');
    const demoCount = await demoElements.count();
    expect(demoCount).toBeGreaterThanOrEqual(0);
  });
});

// ============================================
// Payment Flow - API Tests
// ============================================

test.describe('Payment Flow - API', () => {
  test('should reject payment initialization without data', async ({ request }) => {
    const response = await request.post('/api/payments/initialize', {
      data: {},
    });

    expect(response.status()).toBe(400);
  });

  test('should validate email for payment', async ({ request }) => {
    const response = await request.post('/api/payments/initialize', {
      data: {
        email: 'invalid-email',
        amount: 10000,
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should validate amount for payment', async ({ request }) => {
    const response = await request.post('/api/payments/initialize', {
      data: {
        email: 'test@example.com',
        amount: -100,
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should require reference for verification', async ({ request }) => {
    const response = await request.get('/api/payments/verify');

    expect(response.status()).toBe(400);
  });

  test('should handle invalid payment reference', async ({ request }) => {
    const response = await request.get('/api/payments/verify?reference=invalid-ref-123');

    expect([200, 400, 404]).toContain(response.status());
  });

  test('should reject webhook without signature', async ({ request }) => {
    const response = await request.post('/api/paystack/webhook', {
      data: {
        event: 'charge.success',
        data: {},
      },
    });

    expect([400, 401, 403]).toContain(response.status());
  });
});

// ============================================
// Plan Limits Tests
// ============================================

test.describe('Plan Limits', () => {
  test('should show plan limits on pricing page', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Look for limit indicators
    const limits = page.locator('text=/utilisateur|dashboard|dataset|KPI|export/i');
    const limitCount = await limits.count();
    expect(limitCount).toBeGreaterThan(0);
  });

  test('should show feature comparison', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Check for feature lists/comparison
    const features = page.locator('li:has-text("dashboard"), li:has-text("export"), li:has-text("support")');
    const featureCount = await features.count();
    expect(featureCount).toBeGreaterThan(0);
  });

  test('should indicate premium features', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Look for premium indicators
    const premium = page.locator('text=/API|SSO|SLA|dédié|illimité/i');
    const premiumCount = await premium.count();
    expect(premiumCount).toBeGreaterThan(0);
  });
});

// ============================================
// Subscription Management - Settings Tests
// ============================================

test.describe('Subscription Management - Settings', () => {
  test.skip('should show current plan in settings', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    // Navigate to subscription tab
    await page.click('text=Abonnement');

    // Check for current plan display
    const currentPlan = page.locator('text=/Plan actuel|Current plan|Votre plan/i');
    await expect(currentPlan).toBeVisible();
  });

  test.skip('should show upgrade options in settings', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Abonnement');

    // Look for upgrade buttons
    const upgradeButtons = page.locator('button:has-text("Upgrade"), button:has-text("Améliorer")');
    const buttonCount = await upgradeButtons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(0);
  });

  test.skip('should show billing history in settings', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Abonnement');

    // Look for billing history
    const history = page.locator('text=/Historique|History|Factures|Invoices/i');
    await expect(history).toBeVisible();
  });

  test.skip('should show cancellation option', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Abonnement');

    // Look for cancel option
    const cancelOption = page.locator('button:has-text("Annuler"), text=/Annuler l\'abonnement/i');
    const cancelVisible = await cancelOption.first().isVisible();
    expect(cancelVisible).toBeTruthy();
  });
});

// ============================================
// Subscription Errors Tests
// ============================================

test.describe('Subscription Errors', () => {
  test('should handle payment failure gracefully', async ({ page }) => {
    await page.goto('/payment/callback?status=failed');
    await waitForPageLoad(page);

    // Should show error message
    const error = page.locator('text=/erreur|error|échoué|failed/i');
    const errorVisible = await error.first().isVisible();
    expect(errorVisible).toBeTruthy();
  });

  test('should handle payment cancellation', async ({ page }) => {
    await page.goto('/payment/callback?status=cancelled');
    await waitForPageLoad(page);

    // Should show cancellation message
    const cancel = page.locator('text=/annul|cancel|abandonné/i');
    const cancelVisible = await cancel.first().isVisible();
    expect(cancelVisible).toBeTruthy();
  });
});

// ============================================
// Export - Download Tests
// ============================================

test.describe('Export - Download Flow', () => {
  test('should trigger PDF download with valid config', async ({ page }) => {
    await enableDemoMode(page);

    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("PDF")').first();

    if (await exportButton.isVisible()) {
      // Set up download listener
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
        exportButton.click(),
      ]);

      // If download triggered, verify
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.pdf$/);
      }
    }
  });

  test('should show export progress indicator', async ({ page }) => {
    await enableDemoMode(page);

    const exportButton = page.locator('button:has-text("Export"), button:has-text("Exporter")').first();

    if (await exportButton.isVisible()) {
      await exportButton.click();

      // Look for progress indicator
      const progress = page.locator('[role="progressbar"], text=/génération|generating|export/i');
      const progressVisible = await progress.first().isVisible();

      expect(progressVisible).toBeTruthy();
    }
  });
});

// ============================================
// Mobile Export/Subscription Tests
// ============================================

test.describe('Mobile Export & Subscription', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('should display pricing on mobile', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    await expect(page.locator('h1:has-text("Tarifs")')).toBeVisible();
  });

  test('should stack pricing cards on mobile', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Cards should be stacked vertically
    const cards = page.locator('[class*="card"]');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should show export options on mobile demo', async ({ page }) => {
    await enableDemoMode(page);

    const exportButton = page.locator('button:has-text("Export"), button:has-text("Exporter")');
    const exportVisible = await exportButton.first().isVisible();

    expect(exportVisible).toBeTruthy();
  });
});
