// ============================================
// InsightGov Africa - Tests E2E Legal Pages
// ============================================

import { test, expect } from '@playwright/test';

test.describe('Legal Pages', () => {
  test('should display terms of service', async ({ page }) => {
    await page.goto('/legal/terms');
    await expect(page.locator('h1, h2').first()).toContainText(/CGU|Conditions|Termes/i);
  });

  test('should display privacy policy', async ({ page }) => {
    await page.goto('/legal/privacy');
    await expect(page.locator('h1, h2').first()).toContainText(/Confidentialité|Privacy|RGPD/i);
  });

  test('should display legal mentions', async ({ page }) => {
    await page.goto('/legal/mentions');
    await expect(page.locator('h1, h2').first()).toContainText(/Mentions|Légales/i);
  });

  test('should have consistent footer links', async ({ page }) => {
    await page.goto('/');
    await page.click('text=CGU');
    await expect(page).toHaveURL('/legal/terms');
  });

  test('should contain GDPR information', async ({ page }) => {
    await page.goto('/legal/privacy');
    const content = await page.content();
    expect(content).toMatch(/RGPD|GDPR|données personnelles/i);
  });
});

test.describe('Settings Page', () => {
  test('should redirect unauthenticated users', async ({ page }) => {
    await page.goto('/settings');
    // Should not stay on settings page
    await expect(page).not.toHaveURL('/settings');
  });
});

test.describe('Onboarding Page', () => {
  test('should display onboarding', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.locator('text=Bienvenue')).toBeVisible();
  });

  test('should show progress indicator', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.locator('[role="progressbar"], [class*="progress"]')).toBeVisible();
  });

  test('should have navigation buttons', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.locator('button:has-text("Suivant")')).toBeVisible();
  });

  test('should allow skipping onboarding', async ({ page }) => {
    await page.goto('/onboarding');
    await page.click('text=Passer');
    await expect(page).toHaveURL('/');
  });

  test('should navigate through steps', async ({ page }) => {
    await page.goto('/onboarding');

    // Click through steps
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(300);

    // Check step changed
    await expect(page.locator('text=/2.*4/')).toBeVisible();
  });
});

test.describe('Error Pages', () => {
  test('should display auth error page', async ({ page }) => {
    await page.goto('/auth/error?error=AccessDenied');
    await expect(page.locator('text=Erreur')).toBeVisible();
  });

  test('should show retry button on error', async ({ page }) => {
    await page.goto('/auth/error');
    await expect(page.locator('button:has-text("Réessayer")')).toBeVisible();
  });
});
